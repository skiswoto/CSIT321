// Types for the API contract (PRD section 6.3) and the shared findings schema
// (PRD section 5.1.4). They describe the data the real backend will send, so
// they stay the same when the mock API is replaced.

// ---------- Jobs and stages ----------

// Job status values from PRD section 6.8.
export type JobStatus = 'queued' | 'running' | 'partial' | 'failed' | 'skipped' | 'completed';

// Stage states from PRD section 5.1.5.
export type StageState = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED';

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
}

// Response of GET /api/jobs/{job_id}
export interface Job {
  job_id: string;
  status: JobStatus;
  stages: Stage[];
  error?: string; // set when status is 'failed'
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

export interface ApkInfo {
  sha256: string;
  package: string;
  min_sdk: number;
  target_sdk: number;
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
  created_at: string; // ISO 8601
  consent_confirmed: boolean;
  apk: ApkInfo;
  environment: Environment;
  // TODO(Shawn, Yi Hong): PRD 5.1.4's example groups stages as
  // { static: {...}, dynamic: {...} }, but the status view uses the seven
  // pipeline stages. Modelled as the seven stages until the report's stages
  // object is settled.
  stages: Stage[];
  analysis_limits: AnalysisLimits;
  findings: Finding[];
}

// A remediation template, looked up by a finding's remediation_id.
// PRD 5.1.4 says templates hold an explanation, a secure pattern, a
// documentation reference and a re-test step. How templates reach the
// frontend is not in the API contract yet.
export interface Remediation {
  remediation_id: string;
  action: string;
  retest: string;
  reference: string;
}

// ---------- Requests and lists ----------

export type BuildType = 'debug' | 'release';

// Request body of POST /api/jobs (sent as multipart form data)
export interface CreateJobRequest {
  apk: File;
  source?: File;
  build_type: BuildType;
  authorised: boolean;
}

// One row of GET /api/jobs. The PRD does not define this shape yet,
// so these fields are a proposal.
export interface JobSummary {
  job_id: string;
  status: JobStatus;
  app_name: string;
}
