import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError, getJob } from '../api/mockApi';
import type { Job } from '../api/types';
import { StageList } from '../components/StageList';

// How often the page asks the API for the latest job status.
const POLL_INTERVAL_MS = 1000;

// Screen 2: shows the job's progress through the seven stages.
export function StatusPage() {
  const { jobId = '' } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    // Fetch the status, then schedule the next fetch until the job has finished.
    async function poll() {
      try {
        const latest = await getJob(jobId);
        if (cancelled) return;
        setJob(latest);
        if (latest.status === 'queued' || latest.status === 'running') {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
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
          Demo jobs only last until the page is refreshed. <Link to="/upload">Start a new one</Link>.
        </p>
      </section>
    );
  }

  if (!job) return <p>Loading...</p>;

  return (
    <section>
      <h2>Analysis of {job.job_id}</h2>
      <p>
        Status: <strong>{job.status}</strong>
      </p>
      <StageList stages={job.stages} />

      {job.status === 'failed' && <p className="error">{job.error ?? 'The analysis stopped.'}</p>}

      {job.status === 'completed' && (
        <p className="actions">
          <Link className="button" to={`/jobs/${job.job_id}/findings`}>
            View findings
          </Link>
          <Link to={`/jobs/${job.job_id}/report`}>Open full report</Link>
        </p>
      )}
    </section>
  );
}
