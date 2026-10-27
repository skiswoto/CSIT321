import type { Report } from './types';

// The example report from docs/ARCHITECTURE.md.
// The document leaves the hash, environment and timing statistics as null.
// Here they are filled with made-up values so the prototype shows what a
// finished report looks like. None of these numbers come from a measurement.
// The UI labels all of this as demo data.
export const exampleReport: Report = {
  job_id: 'job_0001',
  app: {
    package: 'com.fyp.biotest',
    version: '1.0',
    sha256: '3f9a1c0e7b2d4a6f8e1c3b5d7a9f0e2c4b6d8a1f3e5c7b9d0a2f4e6c8b1d3a5f',
  },
  environment: { type: 'emulator', android_version: '14', api_level: 34 },
  status: 'completed',
  stages: [
    { name: 'submit_and_validate', state: 'done' },
    { name: 'static_inspection', state: 'done' },
    { name: 'environment_setup', state: 'done' },
    { name: 'runtime_tests', state: 'done' },
    { name: 'timing_analysis', state: 'done' },
    { name: 'findings', state: 'done' },
    { name: 'report', state: 'done' },
  ],
  summary: { high: 1, medium: 1, low: 0, info: 0 },
  findings: [
    {
      id: 'F-001',
      title: 'Biometric prompt not bound to a cryptographic operation',
      category: 'implementation',
      technique: 'static',
      severity: 'high',
      confidence: 'confirmed',
      component: 'com.fyp.biotest.LoginActivity.authenticate()',
      evidence: { type: 'code', detail: 'authenticate() called without a CryptoObject' },
      recommendation:
        'Pass a CryptoObject backed by a Keystore key that requires user authentication.',
      reference: 'OWASP MASVS-AUTH',
    },
    {
      id: 'F-002',
      title: 'Response time differs between matching and non-matching attempts',
      category: 'side-channel',
      technique: 'statistical',
      severity: 'medium',
      confidence: 'likely',
      component: 'com.fyp.biotest.TokenVerifier.verify()',
      evidence: {
        type: 'timing',
        samples_per_condition: 500,
        mean_difference_ms: 3.2,
        p_value: 0.001,
        effect_size: 0.41,
      },
      recommendation: 'Replace the early-exit comparison with a constant-time comparison.',
      reference: 'OWASP MASVS-CRYPTO',
    },
  ],
};
