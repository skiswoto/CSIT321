import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError, getJob, getReport } from '../api/mockApi';
import type { Job, Report } from '../api/types';
import { StageList } from '../components/StageList';
import { STAGE_STATE_LABELS } from '../components/labels';
import { ReportView } from '../components/report/ReportView';

// How often the page asks the API for the latest job status.
const POLL_INTERVAL_MS = 1000;

// The job page at /jobs/:jobId. It has two states:
//   running   -> the seven-stage progress view, refreshed every second
//   finished  -> the report, loaded once the job is SUCCESS (or PARTIAL)
export function JobPage() {
  const { jobId = '' } = useParams();
  // The key gives each job its own copy of the view, so moving to another
  // job's URL starts from empty state instead of showing the old job.
  return <JobView key={jobId} jobId={jobId} />;
}

function JobView({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const latest = await getJob(jobId);
        if (cancelled) return;
        setJob(latest);

        if (latest.status === 'PENDING' || latest.status === 'RUNNING') {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else if (latest.status === 'SUCCESS' || latest.status === 'PARTIAL') {
          const fullReport = await getReport(jobId);
          if (cancelled) return;
          setReport(fullReport);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the job.');
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);

  if (error) {
    return (
      <section>
        <h2>Job not available</h2>
        <p className="error">{error}</p>
        <p>
          Demonstration jobs only last until the page is refreshed.{' '}
          <Link to="/upload">Start a new one</Link>.
        </p>
      </section>
    );
  }

  if (!job) return <p>Loading...</p>;

  if (report) return <ReportView report={report} />;

  return (
    <section>
      <h2>Analysing {job.job_id}</h2>
      <p>
        Status: <strong>{STAGE_STATE_LABELS[job.status]}</strong>
      </p>
      <StageList stages={job.stages} />
      {job.status === 'FAILED' && <p className="error">{job.error ?? 'The analysis stopped.'}</p>}
      {(job.status === 'SUCCESS' || job.status === 'PARTIAL') && <p>Loading the report...</p>}
    </section>
  );
}
