// Mock version of the backend API in PRD section 6.3.
//
// Every page gets its data through the functions in this file. Each one
// matches one endpoint of the API contract. To connect the real
// backend, write a module with the same function names that calls fetch(),
// and change the imports. Nothing else in the app needs to change.
//
// No analysis happens here. There are three built-in jobs, one per final
// state (see mockReports.ts). New uploads move through the seven stages on a
// timer and then show the SUCCESS report.

import { MOCK_REPORTS, exampleReport, type MockReport } from './mockReports';
import { remediations } from './remediations';
import {
  STAGE_NAMES,
  type CreateJobRequest,
  type Finding,
  type Job,
  type JobSummary,
  type Remediation,
  type Report,
  type Stage,
  type Summary,
} from './types';

// Tells the UI to show demonstration labels. The real API module will set this to false.
export const isDemo = true;

// The built-in demonstration jobs, for links on the upload page.
export const DEMO_JOB_IDS = Object.keys(MOCK_REPORTS);

// How long each mock stage takes to finish, in milliseconds.
const STAGE_DURATION_MS = 2000;

// Upload size limit from FR-SUB-04 and NFR-PERF-02 (provisional, TBC in the PoC).
export const MAX_UPLOAD_MB = 100;

// Mimics network delay so loading states are visible.
const RESPONSE_DELAY_MS = 300;

export class ApiError extends Error {}

interface UploadedJob {
  appName: string;
  createdAt: number;
}

// Jobs created during this browser session. They are lost on page refresh.
const uploadedJobs = new Map<string, UploadedJob>();
let nextJobNumber = DEMO_JOB_IDS.length + 1;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

// Works out each stage's state and times from when the job was created.
function stagesAt(createdAt: number, now: number): Stage[] {
  const currentIndex = Math.floor((now - createdAt) / STAGE_DURATION_MS);
  return STAGE_NAMES.map((name, index) => {
    const startedAt = createdAt + index * STAGE_DURATION_MS;
    if (index < currentIndex) {
      return { name, state: 'SUCCESS', started_at: iso(startedAt), ended_at: iso(startedAt + STAGE_DURATION_MS) };
    }
    if (index === currentIndex) {
      return { name, state: 'RUNNING', started_at: iso(startedAt) };
    }
    return { name, state: 'PENDING' };
  });
}

function isFinished(stages: Stage[]): boolean {
  return stages.every((stage) => stage.state === 'SUCCESS');
}

// Checks the file names the way the real API's first checks do, and gives a
// specific reason for each rejection (FR-SUB-02, FR-SUB-03, FR-SUB-08).
// The real API also checks the file's content and archive safety.
function rejectionReason(request: CreateJobRequest): string | null {
  const apkName = request.apk.name.toLowerCase();
  if (!request.authorised) {
    return 'Confirm that you own this app or are authorised to test it.';
  }
  if (apkName.endsWith('.aab')) {
    return 'This is an .aab bundle. Upload a universal APK built from it.';
  }
  if (apkName.endsWith('.apks') || apkName.endsWith('.xapk')) {
    return 'This is a split APK set. Upload a single universal APK instead.';
  }
  if (!apkName.endsWith('.apk')) {
    return 'This file is not an APK. Choose a .apk file.';
  }
  if (request.apk.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `The APK is larger than the ${MAX_UPLOAD_MB} MB limit.`;
  }
  if (request.source && !request.source.name.toLowerCase().endsWith('.zip')) {
    return 'The source code must be a .zip archive.';
  }
  return null;
}

// POST /api/jobs
// A rejected file creates no job (PRD 6.3).
export async function createJob(request: CreateJobRequest): Promise<{ job_id: string }> {
  await delay();

  const reason = rejectionReason(request);
  if (reason) throw new ApiError(reason);

  const jobId = `job_${String(nextJobNumber).padStart(4, '0')}`;
  nextJobNumber += 1;
  uploadedJobs.set(jobId, { appName: request.apk.name, createdAt: Date.now() });
  return { job_id: jobId };
}

// GET /api/jobs/{job_id}
export async function getJob(jobId: string): Promise<Job> {
  await delay();

  const demo = MOCK_REPORTS[jobId];
  if (demo) {
    const failed = demo.stages.find((stage) => stage.state === 'FAILED');
    return { job_id: jobId, status: demo.status, stages: demo.stages, error: failed?.reason };
  }

  const job = uploadedJobs.get(jobId);
  if (!job) {
    throw new ApiError(`Job ${jobId} was not found.`);
  }

  const stages = stagesAt(job.createdAt, Date.now());
  return { job_id: jobId, status: isFinished(stages) ? 'SUCCESS' : 'RUNNING', stages };
}

// GET /api/jobs/{job_id}/report
// Available once the job has reached a final state. Stages 6 and 7 always
// run, so a FAILED job has a report too (PRD 5.1.5).
export async function getReport(jobId: string): Promise<Report> {
  const job = await getJob(jobId);
  if (job.status === 'PENDING' || job.status === 'RUNNING') {
    throw new ApiError('The report is not ready yet.');
  }

  const base: MockReport = MOCK_REPORTS[jobId] ?? {
    ...exampleReport,
    job_id: jobId,
    created_at: job.stages[0].started_at ?? exampleReport.created_at,
    stages: job.stages,
  };
  return {
    ...base,
    summary: buildSummary(base.findings),
    remediations: templatesFor(base.findings),
  };
}

// The two helpers below stand in for work the real backend does when it
// builds a report. The frontend only displays the result.

// Counts findings by severity (DETECTED only), status and technique.
function buildSummary(findings: Finding[]): Summary {
  const summary: Summary = {
    by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 },
    by_status: { DETECTED: 0, NOT_DETECTED: 0, INCONCLUSIVE: 0, NEEDS_DYNAMIC_CONFIRMATION: 0, NOT_APPLICABLE: 0 },
    by_technique: { static: 0, dynamic: 0, inferred: 0 },
  };
  for (const finding of findings) {
    summary.by_status[finding.status] += 1;
    summary.by_technique[finding.technique] += 1;
    if (finding.status === 'DETECTED' && finding.severity) {
      summary.by_severity[finding.severity] += 1;
    }
  }
  return summary;
}

// Picks out the fix templates that this report's findings refer to.
function templatesFor(findings: Finding[]): Record<string, Remediation> {
  const used: Record<string, Remediation> = {};
  for (const finding of findings) {
    const id = finding.remediation_id;
    if (id && remediations[id]) used[id] = remediations[id];
  }
  return used;
}

// GET /api/jobs
export async function listJobs(): Promise<JobSummary[]> {
  await delay();

  const demos: JobSummary[] = Object.values(MOCK_REPORTS).map((report) => ({
    job_id: report.job_id,
    status: report.status,
    app_name: report.apk.package ?? 'Unknown app',
  }));
  const uploaded = [...uploadedJobs.entries()].map(([jobId, job]) => ({
    job_id: jobId,
    status: isFinished(stagesAt(job.createdAt, Date.now())) ? ('SUCCESS' as const) : ('RUNNING' as const),
    app_name: job.appName,
  }));
  return [...demos, ...uploaded];
}
