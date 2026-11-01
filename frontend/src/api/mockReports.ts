import type { Finding, Report, Stage, StageName, StageState } from './types';

// The three demonstration jobs, one for each final job state (PRD 8.6):
//   job_0001  SUCCESS  every stage ran
//   job_0002  PARTIAL  stages 3 to 5 were not performed, so only static findings
//   job_0003  FAILED   the APK could not be parsed in stage 2
//
// Every value here is made up: no app has been analysed. The findings are
// chosen so the UI has to handle each status and several severities. The UI
// labels all of it as demonstration data.

// The summary and the fix templates are added by getReport in mockApi.ts, the
// same way the real backend adds them when it builds a report.
export type MockReport = Omit<Report, 'summary' | 'remediations'>;

// Tool versions are pinned in the proof of concept; until then they are TBC.
const TBC = 'TBC (pinned in PoC)';
const RULE_SET = '0.1';

const APK_SHA256 = '3f9a1c0e7b2d4a6f8e1c3b5d7a9f0e2c4b6d8a1f3e5c7b9d0a2f4e6c8b1d3a5f';

// One planned stage: its final state, how long it took and, if it did not
// simply succeed, why.
interface StagePlan {
  name: StageName;
  state: StageState;
  seconds?: number; // left out for skipped stages
  reason?: string;
}

// Turns a list of planned stages into stages with start and end times, each
// one starting when the one before it ended. Skipped stages have no times.
function timeline(startIso: string, plan: StagePlan[]): Stage[] {
  let time = Date.parse(startIso);
  return plan.map(({ name, state, seconds = 0, reason }): Stage => {
    if (state === 'SKIPPED') return { name, state, reason };
    const started_at = new Date(time).toISOString();
    time += seconds * 1000;
    return { name, state, reason, started_at, ended_at: new Date(time).toISOString() };
  });
}

// ---------- job_0001: SUCCESS ----------

const successReport: MockReport = {
  schema_version: '1.0',
  job_id: 'job_0001',
  status: 'SUCCESS',
  created_at: '2026-10-29T10:00:00Z',
  consent_confirmed: true,
  apk: {
    sha256: APK_SHA256,
    source_sha256: '9c2e4a6b8d0f1e3c5a7b9d2f4e6a8c0b1d3f5e7a9c2b4d6f8e0a1c3b5d7f9e2a',
    input_type: 'apk_and_source',
    package: 'com.fyp.biotest',
    version_name: '1.0 (debug)',
    min_sdk: 28,
    target_sdk: 34,
  },
  environment: {
    type: 'emulator',
    api_level: 34,
    abi: 'x86_64',
    image: 'google_apis',
    instrumentation: 'frida',
  },
  stages: timeline('2026-10-29T10:00:00Z', [
    { name: 'submit_and_validate', state: 'SUCCESS', seconds: 3 },
    { name: 'static_inspection', state: 'SUCCESS', seconds: 42 },
    { name: 'environment_setup', state: 'SUCCESS', seconds: 95 },
    { name: 'runtime_tests', state: 'SUCCESS', seconds: 180 },
    { name: 'timing_analysis', state: 'SUCCESS', seconds: 240 },
    { name: 'findings', state: 'SUCCESS', seconds: 1 },
    { name: 'report', state: 'SUCCESS', seconds: 2 },
  ]),
  analysis_limits: { obfuscated: false, native_libs: 0, dynamic_class_loading: false },
  findings: [
    {
      rule_id: 'SB-02',
      title: 'Biometric authentication without CryptoObject',
      status: 'DETECTED',
      validation_level: 'Confirmed',
      severity: 'HIGH',
      confidence: 'high',
      technique: 'static',
      evidence: { file: 'LoginActivity.java', method: 'showPrompt', snippet: 'prompt.authenticate(promptInfo);' },
      affected_component: 'com.fyp.biotest.LoginActivity',
      impact:
        'The authentication result is only a callback event. Someone who can hook the app can trigger the success callback without a fingerprint.',
      remediation_id: 'REM-02',
      tool: 'jadx',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
    {
      rule_id: 'SB-08',
      title: 'Post-authentication screen reachable without authentication',
      status: 'DETECTED',
      validation_level: 'Needs validation',
      severity: 'HIGH',
      confidence: 'high',
      technique: 'static',
      evidence: {
        file: 'AndroidManifest.xml',
        snippet: '<activity android:name=".VaultActivity" android:exported="true" />',
      },
      affected_component: 'com.fyp.biotest.VaultActivity',
      impact:
        'The screen behind the biometric prompt can be opened directly, for example through ADB, without authenticating. Dynamic check DY-02 would confirm this.',
      remediation_id: 'REM-08',
      tool: 'androguard',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
    {
      rule_id: 'SB-04',
      title: 'Weak authenticator class allowed',
      status: 'DETECTED',
      validation_level: 'Potential',
      severity: 'MEDIUM',
      confidence: 'high',
      technique: 'static',
      evidence: {
        file: 'LoginActivity.java',
        method: 'buildPromptInfo',
        snippet: '.setAllowedAuthenticators(BIOMETRIC_WEAK | DEVICE_CREDENTIAL)',
      },
      affected_component: 'com.fyp.biotest.LoginActivity',
      impact: 'Class 2 (weak) biometrics and the device PIN are accepted for a sensitive action.',
      remediation_id: 'REM-04',
      tool: 'jadx',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
    {
      rule_id: 'T-02',
      title: 'Token comparison time differs between success and failure paths',
      status: 'DETECTED',
      validation_level: 'Potential',
      severity: 'MEDIUM',
      confidence: 'medium', // emulator timing is capped at medium
      technique: 'dynamic',
      evidence: {
        measurement: 'M2',
        start_event: 'Entry to onAuthenticationSucceeded or onAuthenticationFailed',
        end_event: 'Return from TokenVerifier.verify()',
        samples_per_condition: 500,
        mean_difference_ms: 3.2,
        effect_size: 0.41,
        p_value: 0.001,
        test: "Welch's t-test, cross-checked with Mann-Whitney U",
      },
      affected_component: 'com.fyp.biotest.TokenVerifier.verify()',
      impact:
        'Failed attempts take longer than successful ones, which may reveal how much of a token matched. This is a potential timing concern, not a demonstrated vulnerability.',
      remediation_id: 'REM-T02',
      tool: 'frida, scipy',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
    {
      rule_id: 'SB-01',
      title: 'Biometric API in use',
      status: 'DETECTED',
      validation_level: 'Confirmed',
      severity: 'INFO',
      confidence: 'high',
      technique: 'static',
      evidence: {
        file: 'AndroidManifest.xml',
        snippet: '<uses-permission android:name="android.permission.USE_BIOMETRIC" />',
      },
      affected_component: 'androidx.biometric.BiometricPrompt',
      impact: 'For information: the app uses the AndroidX BiometricPrompt API, so the biometric rules apply.',
      tool: 'androguard',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
    {
      rule_id: 'SB-11',
      title: 'Possible non-constant-time comparison',
      status: 'NEEDS_DYNAMIC_CONFIRMATION',
      validation_level: 'Needs validation',
      confidence: 'medium',
      technique: 'static',
      evidence: { file: 'TokenVerifier.java', method: 'verify', snippet: 'return expected.equals(provided);' },
      affected_component: 'com.fyp.biotest.TokenVerifier.verify()',
      reason: 'String.equals can stop at the first differing character, but a code pattern alone cannot show whether the time difference is measurable.',
      next_step: 'Run timing test T-02 in the dynamic stage.',
      remediation_id: 'REM-11',
      tool: 'jadx',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
    {
      rule_id: 'SB-03',
      title: 'Keystore key does not require user authentication',
      status: 'INCONCLUSIVE',
      validation_level: 'Not assessed',
      confidence: 'low',
      technique: 'static',
      affected_component: 'com.fyp.biotest.KeyStoreHelper.createKey()',
      reason: 'The key parameters are computed at runtime, so the static rule cannot read them.',
      next_step: 'Inspect the key properties during the dynamic stage.',
      tool: 'androguard',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
    {
      rule_id: 'SB-12',
      title: 'Analysis limits',
      status: 'NOT_DETECTED',
      validation_level: 'Confirmed',
      confidence: 'high',
      technique: 'static',
      tool: 'jadx, androguard',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
    {
      rule_id: 'SB-10',
      title: 'Known-vulnerable biometric or crypto library',
      status: 'NOT_APPLICABLE',
      validation_level: 'Not assessed',
      confidence: 'high',
      technique: 'static',
      reason: 'The app bundles no third-party biometric or cryptography library.',
      next_step: 'None needed.',
      tool: 'androguard',
      tool_version: TBC,
      rule_set_version: RULE_SET,
    },
  ],
};

// ---------- job_0002: PARTIAL ----------

const NO_EMULATOR = 'No emulator was available on the analysis host, so the app could not be run.';

// Same app, but stages 3 to 5 were skipped, so only the static findings exist
// and SB-11 stays a candidate that needs dynamic confirmation.
const partialReport: MockReport = {
  ...successReport,
  job_id: 'job_0002',
  status: 'PARTIAL',
  created_at: '2026-10-30T14:20:00Z',
  apk: { ...successReport.apk, source_sha256: undefined, input_type: 'apk' },
  environment: null,
  stages: timeline('2026-10-30T14:20:00Z', [
    { name: 'submit_and_validate', state: 'SUCCESS', seconds: 3 },
    { name: 'static_inspection', state: 'SUCCESS', seconds: 40 },
    { name: 'environment_setup', state: 'SKIPPED', reason: NO_EMULATOR },
    { name: 'runtime_tests', state: 'SKIPPED', reason: NO_EMULATOR },
    { name: 'timing_analysis', state: 'SKIPPED', reason: NO_EMULATOR },
    { name: 'findings', state: 'SUCCESS', seconds: 1 },
    { name: 'report', state: 'SUCCESS', seconds: 2 },
  ]),
  findings: successReport.findings
    .filter((f) => f.technique === 'static')
    .map((f) =>
      f.rule_id === 'SB-11'
        ? { ...f, next_step: 'Run timing test T-02 when an emulator is available.' }
        : f,
    ),
};

// ---------- job_0003: FAILED ----------

const PARSE_FAILED = 'The APK could not be parsed: the decompiler could not read classes.dex.';

// Every static rule that would have run is reported as INCONCLUSIVE, never
// NOT_DETECTED, because none of them could run (FR-FND-02).
function couldNotRun(finding: Finding): Finding {
  return {
    rule_id: finding.rule_id,
    title: finding.title,
    status: 'INCONCLUSIVE',
    validation_level: 'Not assessed',
    confidence: 'low',
    technique: 'static',
    reason: 'The APK could not be parsed, so this rule could not run.',
    next_step: 'Check that the file is a valid debug APK and upload it again.',
    tool: finding.tool,
    tool_version: finding.tool_version,
    rule_set_version: finding.rule_set_version,
  };
}

// Stages 6 and 7 always run (PRD 5.1.5), so a failed job still has a report.
// It says that nothing could be analysed and why.
const failedReport: MockReport = {
  schema_version: '1.0',
  job_id: 'job_0003',
  status: 'FAILED',
  created_at: '2026-10-31T09:05:00Z',
  consent_confirmed: true,
  apk: {
    sha256: 'b7d1e3f5a9c2b4d6f8e0a1c3b5d7f9e2a4c6b8d0f1e3a5c7b9d2f4e6a8c0b1d3',
    input_type: 'apk',
    package: null,
    version_name: null,
    min_sdk: null,
    target_sdk: null,
  },
  environment: null,
  stages: timeline('2026-10-31T09:05:00Z', [
    { name: 'submit_and_validate', state: 'SUCCESS', seconds: 2 },
    { name: 'static_inspection', state: 'FAILED', seconds: 12, reason: PARSE_FAILED },
    { name: 'environment_setup', state: 'SKIPPED', reason: 'Static inspection failed, so triage could not run.' },
    { name: 'runtime_tests', state: 'SKIPPED', reason: 'Static inspection failed, so triage could not run.' },
    { name: 'timing_analysis', state: 'SKIPPED', reason: 'Static inspection failed, so triage could not run.' },
    { name: 'findings', state: 'SUCCESS', seconds: 1 },
    { name: 'report', state: 'SUCCESS', seconds: 1 },
  ]),
  analysis_limits: null,
  findings: successReport.findings.filter((f) => f.technique === 'static').map(couldNotRun),
};

// The built-in demonstration jobs, keyed by job ID.
export const MOCK_REPORTS: Record<string, MockReport> = {
  job_0001: successReport,
  job_0002: partialReport,
  job_0003: failedReport,
};

// The completed report that new uploads show once their stages finish.
export const exampleReport = successReport;
