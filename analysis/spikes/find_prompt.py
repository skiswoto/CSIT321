"""Static spike (PRD 7.2, WBS 2.2): find where an APK shows its biometric prompt.

For each call to a biometric authenticate() method, report:
  - the class and method that makes the call;
  - whether a CryptoObject is passed (if not, SB-02 applies);
  - the screen it belongs to (an Activity, or a Fragment and the Activity
    that hosts it) and what triggers it, such as onCreate or a click
    handler (layer 1 of PRD 7.3);
  - whether the Activity is the launcher, exported, or has a deep link.

Only rules decide the output: no guessing and no language model.

Usage: python find_prompt.py path/to/app.apk [--out result.json]
Run it only on apps we built, open-source apps whose licence allows it, or
apps whose owner has given permission (PRD 4.5).
"""

import argparse
import json
import sys
import time
from collections import deque

from androguard.misc import AnalyzeAPK
from loguru import logger

# The authenticate() methods we look for, by class (androguard's type names).
PROMPT_CLASSES = {
    "Landroidx/biometric/BiometricPrompt;": "androidx BiometricPrompt",
    "Landroid/hardware/biometrics/BiometricPrompt;": "framework BiometricPrompt",
    "Landroid/hardware/fingerprint/FingerprintManager;": "FingerprintManager (deprecated)",
    "Landroidx/core/hardware/fingerprint/FingerprintManagerCompat;": "FingerprintManagerCompat (deprecated)",
}

# Calls made from inside these packages are the libraries' own internals
# (androidx BiometricPrompt calls the framework one), not the app's code.
LIBRARY_PREFIXES = ("Landroidx/", "Landroid/", "Lcom/google/android/", "Lkotlin/", "Lkotlinx/")

# Methods Android calls when a screen is shown, and methods it calls when the
# user does something. A caller chain that reaches one of these is complete.
LIFECYCLE_METHODS = {
    "onCreate", "onStart", "onResume", "onPostCreate", "onPostResume",
    "onCreateView", "onViewCreated", "onActivityCreated", "onAttach",
    "onCreateDialog", "onAttachedToWindow", "onNewIntent",
}
USER_ACTION_METHODS = {
    "onClick", "onLongClick", "onMenuItemClick", "onOptionsItemSelected",
    "onMenuItemSelected", "onPreferenceClick", "onPreferenceChange",
    "onPreferenceTreeClick", "onCheckedChanged", "onItemClick", "onEditorAction",
}

# Base classes that make a class a Fragment, so it counts as a screen.
FRAGMENT_BASES = {
    "Landroidx/fragment/app/Fragment;",
    "Landroidx/fragment/app/DialogFragment;",
    "Landroid/app/Fragment;",
}

# How far back to follow the chain of callers before giving up.
MAX_DEPTH = 16

ANDROID_NS = "{http://schemas.android.com/apk/res/android}"


def to_type_name(dotted):
    """com.example.Main -> Lcom/example/Main;"""
    return "L" + dotted.replace(".", "/") + ";"


def to_dotted(type_name):
    """Lcom/example/Main; -> com.example.Main"""
    return type_name[1:-1].replace("/", ".")


def outer_class(type_name):
    """Lcom/x/Main$showPrompt$1; -> Lcom/x/Main;  (inner and lambda classes)."""
    return type_name.split("$", 1)[0].rstrip(";") + ";"


def read_activities(apk):
    """Each Activity in the manifest, with the facts layer 1 needs."""
    manifest = apk.get_android_manifest_xml()
    package = apk.get_package()
    launcher = apk.get_main_activity()
    activities = {}

    for node in manifest.iter("activity", "activity-alias"):
        name = node.get(ANDROID_NS + "name")
        if name.startswith("."):
            name = package + name
        filters = node.findall("intent-filter")
        deep_links = []
        for intent_filter in filters:
            for data in intent_filter.findall("data"):
                scheme = data.get(ANDROID_NS + "scheme")
                if scheme:
                    host = data.get(ANDROID_NS + "host") or ""
                    deep_links.append(f"{scheme}://{host}")

        # Before Android 12, an Activity with an intent filter and no
        # android:exported attribute is exported by default.
        exported_attr = node.get(ANDROID_NS + "exported")
        exported = exported_attr == "true" if exported_attr is not None else bool(filters)

        activities[to_type_name(name)] = {
            "activity": name,
            "launcher": name == launcher,
            "exported": exported,
            "deep_links": deep_links,
        }
    return activities


def _exact(type_name):
    """find_methods takes regular expressions, so escape $ and anchor the name."""
    return "^" + type_name.replace("$", r"\$") + "$"


def find_prompt_calls(dx):
    """Every call from the app's own code to one of the authenticate() methods."""
    calls = []
    skipped_library_calls = 0
    for class_name, label in PROMPT_CLASSES.items():
        for target in dx.find_methods(classname=_exact(class_name), methodname="^authenticate$"):
            for caller_class, caller, _offset in target.get_xref_from():
                if caller_class.name.startswith(LIBRARY_PREFIXES):
                    skipped_library_calls += 1
                    continue
                calls.append((label, target, caller))
    return calls, skipped_library_calls


def passes_crypto_object(target):
    """True if this authenticate() overload takes a CryptoObject parameter."""
    params = target.descriptor.split(")")[0]
    return "CryptoObject;" in params


def is_fragment(dx, type_name):
    """True if the class extends one of the Fragment base classes."""
    seen = set()
    while type_name and type_name not in seen:
        if type_name in FRAGMENT_BASES:
            return True
        seen.add(type_name)
        cls = dx.get_class_analysis(type_name)
        if cls is None or cls.is_external():
            return False
        type_name = cls.extends
    return False


def creators_of(dx, type_name):
    """Methods that create an object of this class (call its constructor)."""
    creators = []
    for init in dx.find_methods(classname=_exact(type_name), methodname="^<init>$"):
        for _cls, caller, _offset in init.get_xref_from():
            if caller.class_name != type_name:  # skip constructors calling each other
                creators.append(caller)
    return creators


def parent_versions(dx, method):
    """The same method (same name and parameters) in the app's parent classes.

    Code that calls an overridden method through its parent type, such as
    `slide.onNotFinishedError()` on a base class, is recorded against the
    parent's method, not the override.
    """
    versions = []
    seen = set()
    cls = dx.get_class_analysis(method.class_name)
    # Only the app's own parent classes: library and Java parents (such as
    # Kotlin's coroutine base class) lead into library code, not to a screen.
    while (
        cls is not None
        and not cls.is_external()
        and cls.extends
        and cls.extends not in seen
        and not cls.extends.startswith(LIBRARY_PREFIXES + ("Ljava/",))
    ):
        seen.add(cls.extends)
        found = dx.find_methods(
            classname=_exact(cls.extends),
            methodname="^" + method.name.replace("$", r"\$") + "$",
            descriptor="^" + method.descriptor.replace("$", r"\$").replace("(", r"\(").replace(")", r"\)").replace("[", r"\[") + "$",
        )
        versions.extend(found)
        cls = dx.get_class_analysis(cls.extends)
    return versions


def callers_of(dx, method):
    """The methods to step back to from `method`, and how each was reached.

    Normally these are the direct callers, including callers that reach it
    through a parent class. A method with no callers inside a lambda,
    listener or coroutine class is run by Android or a library, so we step
    back to wherever that object was created instead.
    """
    direct = [caller for _cls, caller, _offset in method.get_xref_from()]
    for parent in parent_versions(dx, method):
        direct += [caller for _cls, caller, _offset in parent.get_xref_from()]
    if direct:
        return [(caller, "called by") for caller in direct]
    if "$" in method.class_name:
        return [(creator, "created in") for creator in creators_of(dx, method.class_name)]
    return []


def trace_callers(dx, start):
    """Walk backwards from `start`, breadth first, to the methods Android calls.

    Returns one entry per chain: its kind (lifecycle, user action, or other
    when the chain ends somewhere we do not recognise) and the path, written
    from the entry point to `start`.
    """
    entry_points = []
    seen = {start}
    queue = deque([(start, [_label(start)])])

    while queue:
        method, path = queue.popleft()
        if method.name in USER_ACTION_METHODS:
            entry_points.append({"kind": "user action", "path": list(reversed(path))})
            continue
        if method.name in LIFECYCLE_METHODS:
            entry_points.append({"kind": "lifecycle", "path": list(reversed(path))})
            continue
        if len(path) > MAX_DEPTH:
            entry_points.append({"kind": "too deep", "path": list(reversed(path))})
            continue

        steps = [(m, how) for m, how in callers_of(dx, method) if m not in seen]
        if not steps:
            entry_points.append({"kind": "other", "path": list(reversed(path))})
        for caller, how in steps:
            seen.add(caller)
            step = _label(caller) if how == "called by" else f"{_label(caller)} (creates it)"
            queue.append((caller, path + [step]))
    return entry_points


def find_screen(dx, activities, start, entry_points):
    """The Activity or Fragment the call belongs to, nearest to the call first.

    For a Fragment, also look for the Activity that creates it (its host).
    """
    classes = [outer_class(start.class_name)]
    for entry in entry_points:
        for step in reversed(entry["path"]):
            classes.append(outer_class(to_type_name(step.split(" ")[0].rsplit(".", 1)[0])))

    for type_name in dict.fromkeys(classes):  # keeps order, drops repeats
        if type_name in activities:
            return {"kind": "activity", **activities[type_name]}
        if is_fragment(dx, type_name):
            hosts = sorted({
                activities[outer_class(m.class_name)]["activity"]
                for m in creators_of(dx, type_name)
                if outer_class(m.class_name) in activities
            })
            return {"kind": "fragment", "fragment": to_dotted(type_name), "host_activities": hosts}
    return None


def _label(method):
    return f"{to_dotted(method.class_name)}.{method.name}"


def analyse(apk_path):
    started = time.monotonic()
    apk, _dex, dx = AnalyzeAPK(apk_path)
    activities = read_activities(apk)
    calls, skipped = find_prompt_calls(dx)

    results = []
    for label, target, caller in calls:
        entry_points = trace_callers(dx, caller)
        results.append({
            "api": label,
            "called_from": _label(caller),
            "crypto_object": passes_crypto_object(target),
            "sb02_no_crypto_object": not passes_crypto_object(target),
            "screen": find_screen(dx, activities, caller, entry_points),
            "triggers": sorted({e["kind"] for e in entry_points}),
            "trigger_paths": entry_points,
        })

    return {
        "apk": apk_path,
        "package": apk.get_package(),
        "launcher": apk.get_main_activity(),
        "activities": list(activities.values()),
        "prompt_calls": results,
        "library_internal_calls_skipped": skipped,
        "seconds": round(time.monotonic() - started, 2),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("apk")
    parser.add_argument("--out", help="write the JSON here as well as printing it")
    args = parser.parse_args()

    logger.remove()  # androguard logs every step; keep the output readable
    result = analyse(args.apk)
    text = json.dumps(result, indent=2)
    print(text)
    if args.out:
        with open(args.out, "w") as f:
            f.write(text + "\n")
    return 0 if result["prompt_calls"] else 1


if __name__ == "__main__":
    sys.exit(main())
