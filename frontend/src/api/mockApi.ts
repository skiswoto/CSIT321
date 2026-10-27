// Mock version of the backend API in docs/ARCHITECTURE.md.
//
// Every page gets its data through the functions in this file. Each function
// matches one endpoint of the API contract. To connect the real backend, write
// a module with the same function names that calls fetch(), and change the
// imports. Nothing else in the app needs to change.
//
// No analysis happens here. New jobs move through the seven stages on a timer,
// and every completed job returns the example report.

import { exampleReport } from './exampleReport';
import {
  STAGE_NAMES,
  type CreateJobRequest,
  type Job,
  type JobSummary,
  type Report,
  type Stage,
} from './types';

// Tells the UI to show demo labels. The real API module will set this to false.
export const isDemo = true;

// How long each mock stage takes to finish, in milliseconds.
const STAGE_DURATION_MS = 2000;

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
    state: index < currentIndex ? 'done' : index === currentIndex ? 'running' : 'pending',
  }));
}

// POST /api/jobs
export async function createJob(request: CreateJobRequest): Promise<{ job_id: string }> {
  await delay();

  // The same checks the real API will make at stage 1.
  if (!request.apk.name.toLowerCase().endsWith('.apk')) {
    throw new ApiError('The uploaded file is not an APK.');
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
  const allDone = stages.every((stage) => stage.state === 'done');
  return { job_id: jobId, status: allDone ? 'completed' : 'running', stages };
}

// GET /api/jobs/{job_id}/report
export async function getReport(jobId: string): Promise<Report> {
  const job = await getJob(jobId);
  if (job.status !== 'completed') {
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
    app_name: exampleReport.app.package,
  };
  const created = [...jobs.entries()].map(([jobId, job]) => ({
    job_id: jobId,
    status: stagesAt(Date.now() - job.createdAt).every((s) => s.state === 'done')
      ? ('completed' as const)
      : ('running' as const),
    app_name: job.appName,
  }));
  return [example, ...created];
}
