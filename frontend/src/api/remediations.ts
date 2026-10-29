import type { Remediation } from './types';

// Demonstration remediation templates, keyed by remediation_id. The actions
// and re-test steps follow the remediation table in PRD 5.1.4. In the real
// system the backend owns these templates; how they reach the frontend is
// not in the API contract yet.
export const remediations: Record<string, Remediation> = {
  'REM-02': {
    remediation_id: 'REM-02',
    action:
      'Call authenticate(promptInfo, cryptoObject) with a Cipher or Signature backed by a Keystore key that requires user authentication, and use the unlocked crypto object to decrypt data or sign a server challenge.',
    retest: 'Rebuild and re-scan: SB-02 should be NOT_DETECTED.',
    reference: 'OWASP MASVS-AUTH',
  },
  'REM-04': {
    remediation_id: 'REM-04',
    action:
      'Require BIOMETRIC_STRONG for sensitive operations. Allow the device-credential fallback only as a deliberate choice.',
    retest: 'Re-scan: SB-04 should be NOT_DETECTED.',
    reference: 'OWASP MASVS-AUTH',
  },
  'REM-08': {
    remediation_id: 'REM-08',
    action:
      'Set android:exported="false" on post-authentication components unless they must be exported, or check authentication again when the component opens.',
    retest: 'Re-scan, then run dynamic check DY-02.',
    reference: 'OWASP MASVS-AUTH',
  },
  'REM-11': {
    remediation_id: 'REM-11',
    action:
      'Compare secrets and tokens in constant time with MessageDigest.isEqual, and avoid loops that exit at the first difference.',
    retest: 'Re-scan, then run timing test T-02.',
    reference: 'OWASP MASVS-CRYPTO',
  },
  'REM-T02': {
    remediation_id: 'REM-T02',
    action:
      'Re-run under controlled conditions, find the cause of the path-dependent delay, remove or equalise differences that depend on the secret, and measure again.',
    retest: 'Repeat T-02: the difference should no longer be reproducible.',
    reference: 'OWASP MASVS-CRYPTO',
  },
};
