# Static spike (WBS 2.2, PRD 7.2)

`find_prompt.py` checks two things on an APK:

1. Whether androguard can tell `authenticate(info)` from
   `authenticate(info, cryptoObject)`, which SB-02 depends on.
2. Whether it can find the screen that shows the prompt and what triggers it,
   which layer 1 of reaching the prompt needs (PRD 7.3).

Run it only on apps we own or are authorised to test.

## Set up once (macOS)

```sh
brew install python@3.12 jadx
cd analysis
/opt/homebrew/opt/python@3.12/bin/python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

You also need Android Studio, opened once so it installs the SDK.

## Build the test app

```sh
cd test-apps/bio-v
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties   # once
./gradlew assembleDebug assembleMinified
```

This gives two APKs under `app/build/outputs/apk/`:

- `debug/app-debug.apk`, the normal debug build;
- `minified/app-minified.apk`, shrunk and renamed by R8, to see what breaks.

## Run the spike

From the repository root:

```sh
analysis/.venv/bin/python analysis/spikes/find_prompt.py \
  test-apps/bio-v/app/build/outputs/apk/debug/app-debug.apk
```

Add `--out file.json` to save the output. The saved results from 4 November
are in `results/`.

## Check it by hand

Decompile the same APK and look for the calls yourself:

```sh
jadx -d /tmp/bio-v-src test-apps/bio-v/app/build/outputs/apk/debug/app-debug.apk
grep -rn "\.authenticate(" /tmp/bio-v-src/sources/com/fyp2608
```

The lines jadx shows should match `called_from` and `crypto_object` in the
spike output. To see the spike catch a change, edit
`LaunchPromptActivity.kt` to pass a CryptoObject (or move `showPrompt()` into
a button), rebuild and run again: `sb02_no_crypto_object` and `triggers`
should change with it.

## Open-source apps tried (4 November)

Both are GPL-3.0, which permits building and analysing them (PRD 4.5). They
are cloned outside this repository, in `../oss-apps/`, and never committed.

| App | Source | Release | Commit | Build |
|---|---|---|---|---|
| Aegis | github.com/beemdevelopment/Aegis | v3.4.3 | d6f4e5925a97e4e91593f1542085eae03432a759 | `./gradlew assembleDebug` |
| KeePassDX | github.com/Kunzisoft/KeePassDX | 4.5.8 | 77ecfa8654a5bd0d79d512f8fa71c0af8a29b554 | `./gradlew assembleLibreDebug` |

To repeat it (from the folder that holds `project code`):

```sh
mkdir -p oss-apps && cd oss-apps
git clone --depth 1 --branch v3.4.3 https://github.com/beemdevelopment/Aegis.git aegis
git clone --depth 1 --branch 4.5.8 https://github.com/Kunzisoft/KeePassDX.git keepassdx
for d in aegis keepassdx; do echo "sdk.dir=$HOME/Library/Android/sdk" > $d/local.properties; done
(cd aegis && ./gradlew assembleDebug)
(cd keepassdx && ./gradlew assembleLibreDebug)
```

Then run the spike on `aegis/app/build/outputs/apk/debug/app-debug.apk` and
`keepassdx/app/build/outputs/apk/libre/debug/app-libre-debug.apk`. What the
spike found is saved in `results/`. To check it by hand, search the app's
source for the calls and compare:

```sh
grep -rn "\.authenticate(" aegis --include='*.java' --include='*.kt'
```
