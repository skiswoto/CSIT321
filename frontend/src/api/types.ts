// Types for the API contract and findings schema in docs/ARCHITECTURE.md.
// These describe the data the real backend will send, so they stay the same
// when the mock API is replaced.

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type StageState = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

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
}

export type BuildType = 'debug' | 'release';

export interface AppInfo {
  package: string;
  version: string;
  sha256: string | null;
}

export interface Environment {
  type: 'emulator' | 'device';
  android_version: string | null;
  api_level: number | null;
}

// Response of GET /api/jobs/{job_id}
export interface Job {
  job_id: string;
  status: JobStatus;
  stages: Stage[];
  error?: string; // set when status is 'failed'
}

export type Severity = 'high' | 'medium' | 'low' | 'info';
export type Confidence = 'confirmed' | 'likely' | 'possible';
export type Category = 'implementation' | 'behaviour' | 'side-channel' | 'information-leakage';
export type Technique = 'static' | 'runtime' | 'statistical';

// Evidence depends on the kind of finding. The `type` field says which one it is.
export interface CodeEvidence {
  type: 'code';
  detail: string;
}

export interface TimingEvidence {
  type: 'timing';
  // null until the timing analysis stage has produced a value
  samples_per_condition: number | null;
  mean_difference_ms: number | null;
  p_value: number | null;
  effect_size: number | null;
}

export type Evidence = CodeEvidence | TimingEvidence;

export interface Finding {
  id: string;
  title: string;
  category: Category;
  technique: Technique;
  severity: Severity;
  confidence: Confidence;
  component: string;
  evidence: Evidence;
  recommendation: string;
  reference: string;
}

// Response of GET /api/jobs/{job_id}/report
export interface Report {
  job_id: string;
  app: AppInfo;
  environment: Environment;
  status: JobStatus;
  stages: Stage[];
  summary: Record<Severity, number>;
  findings: Finding[];
}

// Request body of POST /api/jobs (sent as multipart form data)
export interface CreateJobRequest {
  apk: File;
  source?: File;
  build_type: BuildType;
  authorised: boolean;
}

// One row of GET /api/jobs. ARCHITECTURE.md does not define this shape yet,
// so these fields are a proposal.
export interface JobSummary {
  job_id: string;
  status: JobStatus;
  app_name: string;
}
