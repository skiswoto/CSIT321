import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError, getReport } from '../api/mockApi';
import type { Report, Severity } from '../api/types';
import { FindingCard } from '../components/FindingCard';
import { SeverityBadge } from '../components/SeverityBadge';

const SEVERITY_ORDER: Severity[] = ['high', 'medium', 'low', 'info'];

// Screen 3: the list of findings, most severe first.
export function FindingsPage() {
  const { jobId = '' } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getReport(jobId)
      .then((data) => !cancelled && setReport(data))
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the findings.');
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (error) return <p className="error">{error}</p>;
  if (!report) return <p>Loading...</p>;

  const sortedFindings = [...report.findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  return (
    <section>
      <h2>Findings for {report.app.package}</h2>

      <ul className="summary">
        {SEVERITY_ORDER.map((severity) => (
          <li key={severity}>
            <SeverityBadge severity={severity} /> {report.summary[severity]}
          </li>
        ))}
      </ul>

      {sortedFindings.length === 0 ? (
        <p>No findings were reported for this app.</p>
      ) : (
        sortedFindings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} environment={report.environment} />
        ))
      )}

      <p className="actions">
        <Link className="button" to={`/jobs/${report.job_id}/report`}>
          Open full report
        </Link>
      </p>
    </section>
  );
}
