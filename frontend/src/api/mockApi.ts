// Mock version of the backend API in PRD section 6.3.
//
// Every page gets its data through the functions in this file. Each of the
// first four matches one endpoint of the API contract. To connect the real
// backend, write a module with the same function names that calls fetch(),
// and change the imports. Nothing else in the app needs to change.
//
// No analysis happens here. New jobs move through the seven stages on a timer,
// and every completed job returns the demonstration report.

import { exampleReport } from './exampleReport';
import { remediations } from './remediations';
import {
  STAGE_NAMES,
  type CreateJobRequest,
  type Job,
  type JobSummary,
  type Remediation,
  type Report,
  type Stage,
} from './types';

// Tells the UI to show demonstration labels. The real API module will set this to false.
export const isDemo = true;

// How long each mock stage takes to finish, in milliseconds.
const STAGE_DURATION_MS = 2000;

// Upload size limit from FR-SUB-04 and NFR-PERF-02 (provisional, TBC in the PoC).
export const MAX_UPLOAD_MB = 100;

// Mimics network delay so loading states are visible.
const RESPONSE_DELAY_MS = 300;

export class ApiError extends Error {}

interface MockJob {
  appName: string;
  createdAt: number;
}

// Jobs created during this browser session. They are lost on page refresh.
const jobs = new Map<string, MockJob>();
let nextJobNumber = 2; // job_0001 is the built-in completed example

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));
}

// Works out each stage's state from how long ago the job was created.
function stagesAt(elapsedMs: number): Stage[] {
  const currentIndex = Math.floor(elapsedMs / STAGE_DURATION_MS);
  return STAGE_NAMES.map((name, index) => ({
    name,
    state: index < currentIndex ? 'SUCCESS' : index === currentIndex ? 'RUNNING' : 'PENDING',
  }));
}

function isFinished(stages: Stage[]): boolean {
  return stages.every((stage) => stage.state === 'SUCCESS');
}

// POST /api/jobs
export async function createJob(request: CreateJobRequest): Promise<{ job_id: string }> {
  await delay();

  // The same checks the real API makes first (FR-SUB-02 and FR-SUB-03).
  // The real API also checks the file's content, size and structure.
  if (!request.apk.name.toLowerCase().endsWith('.apk')) {
    throw new ApiError('The uploaded file is not an APK.');
  }
  if (request.apk.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new ApiError(`The APK is larger than the ${MAX_UPLOAD_MB} MB limit.`);
  }
  if (request.source && !request.source.name.toLowerCase().endsWith('.zip')) {
    throw new ApiError('The source code must be a .zip archive.');
  }
  if (!request.authorised) {
    throw new ApiError('You must confirm that you own this app or are authorised to test it.');
  }

  const jobId = `job_${String(nextJobNumber).padStart(4, '0')}`;
  nextJobNumber += 1;
  jobs.set(jobId, { appName: request.apk.name, createdAt: Date.now() });
  return { job_id: jobId };
}

// GET /api/jobs/{job_id}
export async function getJob(jobId: string): Promise<Job> {
  await delay();

  if (jobId === exampleReport.job_id) {
    return { job_id: jobId, status: 'completed', stages: exampleReport.stages };
  }

  const job = jobs.get(jobId);
  if (!job) {
    throw new ApiError(`Job ${jobId} was not found.`);
  }

  const stages = stagesAt(Date.now() - job.createdAt);
  return { job_id: jobId, status: isFinished(stages) ? 'completed' : 'running', stages };
}

// GET /api/jobs/{job_id}/report
export async function getReport(jobId: string): Promise<Report> {
  const job = await getJob(jobId);
  if (job.status !== 'completed' && job.status !== 'partial') {
    throw new ApiError('The report is not ready yet.');
  }
  return { ...exampleReport, job_id: jobId };
}

// GET /api/jobs
export async function listJobs(): Promise<JobSummary[]> {
  await delay();

  const example: JobSummary = {
    job_id: exampleReport.job_id,
    status: 'completed',
    app_name: exampleReport.apk.package,
  };
  const created = [...jobs.entries()].map(([jobId, job]) => ({
    job_id: jobId,
    status: isFinished(stagesAt(Date.now() - job.createdAt)) ? ('completed' as const) : ('running' as const),
    app_name: job.appName,
  }));
  return [example, ...created];
}

// Remediation templates, keyed by remediation_id.
// TODO(Shawn): no endpoint for this yet. Decide whether the report includes
// the templates it uses or the API serves them separately.
export async function getRemediations(): Promise<Record<string, Remediation>> {
  await delay();
  return remediations;
}
