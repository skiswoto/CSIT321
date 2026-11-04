# Bio-V

The deliberately vulnerable controlled test app (PRD 12.1, Tier 1). Bio-S, the
fixed version, comes later. This first version holds only what the static spike
needs; the remaining weaknesses VS01 to VS07 are added later.

| Screen | How the prompt opens | Planted weakness | Rules expected |
|---|---|---|---|
| `LaunchPromptActivity` (launcher) | On launch, from `onCreate` | VS04: `authenticate()` without a CryptoObject; success stores a flag | SB-01, SB-02, SB-05 |
| `CryptoPromptActivity` | From a button tap | None: CryptoObject bound to a Keystore key | SB-01 only |
| `SecretActivity` | No prompt | VS07: exported in the manifest | SB-08 |

Build from this folder: `./gradlew assembleDebug assembleMinified`. The APKs
land in `app/build/outputs/apk/`; they are never committed.
