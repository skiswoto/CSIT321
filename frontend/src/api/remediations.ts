import type { Remediation } from './types';

// Demonstration remediation templates, keyed by remediation_id. The backend
// owns the real templates and sends the ones a report uses inside the report.
//
// The re-test steps follow the remediation table in PRD 5.1.4. The
// explanations and secure patterns were drafted with AI assistance and have
// not been reviewed yet, so they are marked ai_assisted and not reviewed
// (FR-FND-11). The UI shows that label.
export const remediations: Record<string, Remediation> = {
  'REM-02': {
    remediation_id: 'REM-02',
    explanation:
      'Without a CryptoObject, a successful prompt only produces a callback. No key is unlocked, so anyone who can hook or fake that callback gets past the check without a fingerprint.',
    secure_pattern: `// Key created with setUserAuthenticationRequired(true)
cipher.init(Cipher.DECRYPT_MODE, key, iv)
prompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))

// In onAuthenticationSucceeded, use the unlocked cipher
val data = result.cryptoObject?.cipher?.doFinal(encrypted)`,
    reference: 'OWASP MASVS-AUTH; MASTG-TEST-0327',
    retest: 'Rebuild and re-scan: SB-02 should be NOT_DETECTED.',
    ai_assisted: true,
    reviewed: false,
  },
  'REM-04': {
    remediation_id: 'REM-04',
    explanation:
      'Class 2 (weak) biometrics are easier to spoof than Class 3, and the device PIN replaces the biometric entirely. For a sensitive action, the app should accept only strong biometrics unless the fallback is a deliberate choice.',
    secure_pattern: `BiometricPrompt.PromptInfo.Builder()
    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
    .setNegativeButtonText("Cancel")
    .build()`,
    reference: 'OWASP MASVS-AUTH',
    retest: 'Re-scan: SB-04 should be NOT_DETECTED.',
    ai_assisted: true,
    reviewed: false,
  },
  'REM-08': {
    remediation_id: 'REM-08',
    explanation:
      'An exported activity can be started by any app on the device, or with adb shell am start, so the screen behind the prompt can be opened without authenticating.',
    secure_pattern: `<!-- AndroidManifest.xml -->
<activity
    android:name=".VaultActivity"
    android:exported="false" />`,
    reference: 'OWASP MASVS-PLATFORM; MASVS-AUTH',
    retest: 'Re-scan, then run dynamic check DY-02.',
    ai_assisted: true,
    reviewed: false,
  },
  'REM-11': {
    remediation_id: 'REM-11',
    explanation:
      'A comparison that stops at the first differing character takes longer the more of a guess is correct. Measuring that time can reveal a secret one character at a time.',
    secure_pattern: `// Takes the same time whatever the input
val ok = MessageDigest.isEqual(
    expected.toByteArray(),
    provided.toByteArray()
)`,
    reference: 'OWASP MASVS-CRYPTO',
    retest: 'Re-scan, then run timing test T-02.',
    ai_assisted: true,
    reviewed: false,
  },
  'REM-T02': {
    remediation_id: 'REM-T02',
    explanation:
      'The success and failure paths took measurably different times after the callback. The difference may come from work that depends on the secret, such as an early-exit comparison, and could tell an observer more than the result alone.',
    secure_pattern: `// Do the same work on both paths, then branch on the result
val ok = MessageDigest.isEqual(expected, provided)
if (ok) openVault() else showError()`,
    reference: 'OWASP MASVS-CRYPTO',
    retest: 'Repeat T-02: the difference should no longer be reproducible.',
    ai_assisted: true,
    reviewed: false,
  },
};
