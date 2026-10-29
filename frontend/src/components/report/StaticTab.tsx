import type { AnalysisLimits, Finding } from '../../api/types';
import { SeverityBadge, StatusBadge } from '../SeverityBadge';

interface StaticTabProps {
  findings: Finding[];
  limits: AnalysisLimits;
}

// Coverage of the static rules (FR-RPT-03): every rule that ran, whatever its
// result, plus the limits that affected the analysis.
export function StaticTab({ findings, limits }: StaticTabProps) {
  const staticFindings = findings.filter((f) => f.technique === 'static');

  return (
    <>
      <h3>Static rules</h3>
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

      <h3>Analysis limits</h3>
      <dl className="details">
        <dt>Obfuscated</dt>
        <dd>{limits.obfuscated ? 'Yes' : 'No'}</dd>
        <dt>Native libraries</dt>
        <dd>{limits.native_libs}</dd>
        <dt>Dynamic class loading</dt>
        <dd>{limits.dynamic_class_loading ? 'Yes' : 'No'}</dd>
      </dl>
    </>
  );
}
