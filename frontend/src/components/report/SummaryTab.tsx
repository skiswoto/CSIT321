import type { Report } from '../../api/types';
import { SeverityBadge, StatusBadge } from '../SeverityBadge';
import { STAGE_LABELS, STAGE_STATE_LABELS, STATUS_LABELS, STATUS_ORDER, TECHNIQUE_LABELS } from '../labels';
import { conclusionFor, dynamicStages, limitationsFor } from './reportText';

const INPUT_TYPE_LABELS = { apk: 'APK only', apk_and_source: 'APK and source' } as const;

// The report view (PRD 5.1.5 sections A, C, D, G and H): assessment details,
// coverage, the findings summary, limitations and the conclusion.
// Sections B (environment) and E (individual findings) and F (timing) are on
// the Run details, Findings and Timing tabs.
export function SummaryTab({ report }: { report: Report }) {
  const { apk, summary } = report;
  const staticFindings = report.findings.filter((f) => f.technique === 'static');
  const dynamicFindings = report.findings.filter((f) => f.technique !== 'static');

  return (
    <>
      <h3>Assessment information</h3>
      <dl className="details">
        <dt>Job</dt>
        <dd>{report.job_id}</dd>
        <dt>Date and time</dt>
        <dd>{new Date(report.created_at).toLocaleString('en-GB')}</dd>
        <dt>Application</dt>
        <dd>
          {apk.package ?? 'Could not be read'}
          {apk.version_name && `, version ${apk.version_name}`}
        </dd>
        <dt>Input</dt>
        <dd>{INPUT_TYPE_LABELS[apk.input_type]}</dd>
        <dt>APK SHA-256</dt>
        <dd>
          <code>{apk.sha256}</code>
        </dd>
        {apk.source_sha256 && (
          <>
            <dt>Source SHA-256</dt>
            <dd>
              <code>{apk.source_sha256}</code>
            </dd>
          </>
        )}
        <dt>Analysis status</dt>
        <dd>{STAGE_STATE_LABELS[report.status]}</dd>
      </dl>

      <h3>Findings summary</h3>
      <dl className="details">
        <dt>By status</dt>
        <dd>{STATUS_ORDER.map((status) => `${STATUS_LABELS[status]} ${summary.by_status[status]}`).join(' · ')}</dd>
        <dt>By technique</dt>
        <dd>
          {(['static', 'dynamic', 'inferred'] as const)
            .map((technique) => `${TECHNIQUE_LABELS[technique]} ${summary.by_technique[technique]}`)
            .join(' · ')}
        </dd>
      </dl>

      <h3>Analysis coverage</h3>
      <h4>Static rules</h4>
      <table className="data-table">
        <thead>
          <tr>
            <th>Rule</th>
            <th>Check</th>
            <th>Result</th>
            <th>Severity</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {staticFindings.map((f) => (
            <tr key={f.rule_id}>
              <td>{f.rule_id}</td>
              <td>
                {f.title}
                {f.reason && <div className="hint">{f.reason}</div>}
              </td>
              <td>
                <StatusBadge status={f.status} />
              </td>
              <td>{f.severity ? <SeverityBadge severity={f.severity} /> : 'None'}</td>
              <td>{f.confidence}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Runtime and timing tests</h4>
      <ul>
        {dynamicStages(report).map((stage) => (
          <li key={stage.name}>
            {STAGE_LABELS[stage.name]}: {STAGE_STATE_LABELS[stage.state]}
            {stage.reason && `. ${stage.reason}`}
          </li>
        ))}
      </ul>
      {dynamicFindings.length > 0 && (
        <p>Tests with a result: {dynamicFindings.map((f) => f.rule_id).join(', ')}.</p>
      )}

      <h3>Limitations</h3>
      <ul>
        {limitationsFor(report).map((limit) => (
          <li key={limit}>{limit}</li>
        ))}
      </ul>

      <h3>Conclusion</h3>
      {conclusionFor(report).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  );
}
