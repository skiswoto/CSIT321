import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ApiError, getReport } from '../api/mockApi';
import type { Report, Severity } from '../api/types';
import { DemoTag } from '../components/DemoBanner';
import { FindingCard } from '../components/FindingCard';
import { StageList } from '../components/StageList';

const SEVERITY_ORDER: Severity[] = ['high', 'medium', 'low', 'info'];

// Screen 4: the complete report, laid out for printing to PDF.
export function ReportPage() {
  const { jobId = '' } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getReport(jobId)
      .then((data) => !cancelled && setReport(data))
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the report.');
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (error) return <p className="error">{error}</p>;
  if (!report) return <p>Loading...</p>;

  const { app, environment } = report;

  return (
    <section className="report">
      <div className="report-title">
        <h2>Security report: {app.package}</h2>
        <button className="no-print" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>

      <h3>Application</h3>
      <dl className="report-details">
        <dt>Package</dt>
        <dd>{app.package}</dd>
        <dt>Version</dt>
        <dd>{app.version}</dd>
        <dt>SHA-256</dt>
        <dd>
          <code>{app.sha256 ?? 'Not yet calculated'}</code> <DemoTag />
        </dd>
        <dt>Job ID</dt>
        <dd>{report.job_id}</dd>
      </dl>

      <h3>Test environment</h3>
      <dl className="report-details">
        <dt>Type</dt>
        <dd>{environment.type}</dd>
        <dt>Android version</dt>
        <dd>
          {environment.android_version ?? 'Not recorded'} <DemoTag />
        </dd>
        <dt>API level</dt>
        <dd>
          {environment.api_level ?? 'Not recorded'} <DemoTag />
        </dd>
      </dl>

      <h3>Summary</h3>
      <table className="summary-table">
        <thead>
          <tr>
            {SEVERITY_ORDER.map((severity) => (
              <th key={severity}>{severity}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {SEVERITY_ORDER.map((severity) => (
              <td key={severity}>{report.summary[severity]}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <h3>Pipeline stages</h3>
      <StageList stages={report.stages} />

      <h3>Findings</h3>
      {report.findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} environment={environment} />
      ))}
    </section>
  );
}
