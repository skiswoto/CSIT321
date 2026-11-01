// Types for the API contract (PRD section 6.3) and the shared findings schema
// (PRD section 5.1.4). They describe the data the real backend will send, so
// they stay the same when the mock API is replaced.

// ---------- Jobs and stages ----------

// Stage states from PRD section 5.1.5. PRD 6.8 uses the same six values for
// jobs, so a job's overall status has the same type.
export type StageState = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
export type JobStatus = StageState;

// The seven pipeline stages, in the order the orchestrator runs them.
export const STAGE_NAMES = [
  'submit_and_validate',
  'static_inspection',
  'environment_setup',
  'runtime_tests',
  'timing_analysis',
  'findings',
  'report',
] as const;

export type StageName = (typeof STAGE_NAMES)[number];

export interface Stage {
  name: StageName;
  state: StageState;
  reason?: string; // why a stage was FAILED, PARTIAL or SKIPPED
  started_at?: string; // ISO 8601, set once the stage starts (PRD 6.3)
  ended_at?: string; // ISO 8601, set once the stage ends
}

// Response of GET /api/jobs/{job_id}
export interface Job {
  job_id: string;
  status: JobStatus;
  stages: Stage[];
  error?: string; // set when status is FAILED
}

// ---------- Findings schema (PRD section 5.1.4) ----------

export type FindingStatus =
  | 'DETECTED'
  | 'NOT_DETECTED'
  | 'INCONCLUSIVE'
  | 'NEEDS_DYNAMIC_CONFIRMATION'
  | 'NOT_APPLICABLE';

export type ValidationLevel = 'Potential' | 'Needs validation' | 'Confirmed' | 'Not assessed';

export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Confidence = 'high' | 'medium' | 'low';

export type Technique = 'static' | 'dynamic' | 'inferred';

// Evidence for a static rule: where the pattern was found.
export interface StaticEvidence {
  file?: string;
  method?: string;
  snippet?: string;
}

// Evidence for a timing test. The PRD only says "the timing measurement and
// its parameters", so these fields are a proposal. null means not measured yet.
export interface TimingEvidence {
  measurement: 'M1' | 'M2';
  start_event: string;
  end_event: string;
  samples_per_condition: number | null;
  mean_difference_ms: number | null;
  effect_size: number | null;
  p_value: number | null;
  test: string;
}

export type Evidence = StaticEvidence | TimingEvidence;

// Tells the two evidence shapes apart without adding a field to the schema.
export function isTimingEvidence(evidence: Evidence): evidence is TimingEvidence {
  return 'measurement' in evidence;
}

export interface Finding {
  rule_id: string; // for example SB-02 or T-02
  title: string;
  status: FindingStatus;
  validation_level: ValidationLevel;
  severity?: Severity; // present when status is DETECTED
  confidence: Confidence;
  technique: Technique;
  evidence?: Evidence; // present when status is DETECTED
  affected_component?: string; // when known
  impact?: string; // present when status is DETECTED
  reason?: string; // when INCONCLUSIVE, NOT_APPLICABLE or NEEDS_DYNAMIC_CONFIRMATION
  next_step?: string; // what would resolve the reason above
  remediation_id?: string; // when DETECTED or NEEDS_DYNAMIC_CONFIRMATION
  tool: string;
  tool_version: string;
  rule_set_version: string;
}

// What was submitted: the APK alone, or the APK with its source (PRD 5.1.5, section A).
export type InputType = 'apk' | 'apk_and_source';

// Facts read from the APK. They are null when the APK could not be parsed.
export interface ApkInfo {
  sha256: string;
  source_sha256?: string; // present when source was uploaded
  input_type: InputType;
  package: string | null;
  version_name: string | null;
  min_sdk: number | null;
  target_sdk: number | null;
}

export interface Environment {
  type: 'emulator' | 'device';
  api_level: number;
  abi: string;
  image: string;
  instrumentation: string;
}

export interface AnalysisLimits {
  obfuscated: boolean;
  native_libs: number;
  dynamic_class_loading: boolean;
}

// Response of GET /api/jobs/{job_id}/report
export interface Report {
  schema_version: string;
  job_id: string;
  status: JobStatus; // the job's final state: SUCCESS, PARTIAL or FAILED
  created_at: string; // ISO 8601
  consent_confirmed: boolean;
  apk: ApkInfo;
  // null when environment setup (stage 3) did not run, so no emulator was used.
  environment: Environment | null;
  // The seven stages, in the same shape as GET /api/jobs/{job_id}.
  stages: Stage[];
  analysis_limits: AnalysisLimits | null; // null when the APK could not be read
  findings: Finding[];
  // Counts worked out by the backend (FR-FND-10), so the screen and the JSON
  // export show the same numbers.
  summary: Summary;
  // The fix templates used by this report's findings, keyed by remediation_id,
  // so a report (and its export) is complete on its own.
  remediations: Record<string, Remediation>;
}

// Counts by severity, status and technique (FR-FND-10), as shown in PRD 5.1.4
// "Report-level fields".
// TODO(Yi Hong): confirm this shape.
export interface Summary {
  by_severity: Record<Severity, number>; // DETECTED findings only
  by_status: Record<FindingStatus, number>;
  by_technique: Record<Technique, number>;
}

// A remediation template, referenced by a finding's remediation_id. The four
// parts follow FR-FND-11. The OWASP MASVS reference lives here, not on the
// finding (PRD 7.5).
export interface Remediation {
  remediation_id: string;
  explanation: string; // why the pattern is a problem
  secure_pattern: string; // the fix, as a short code sketch
  reference: string; // documentation, including the MASVS reference
  retest: string; // how to check the fix worked
  // FR-FND-11: text written with AI assistance must be labelled and reviewed.
  ai_assisted: boolean;
  reviewed: boolean;
}

// ---------- Requests and lists ----------

// Request body of POST /api/jobs (sent as multipart form data, PRD 6.3)
export interface CreateJobRequest {
  apk: File;
  source?: File;
  authorised: boolean;
}

// One row of GET /api/jobs. The PRD does not define this shape yet,
// so these fields are a proposal.
export interface JobSummary {
  job_id: string;
  status: JobStatus;
  app_name: string;
}
