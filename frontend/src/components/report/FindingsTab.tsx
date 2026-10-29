import type { Finding, Remediation } from '../../api/types';
import { FindingCard } from '../FindingCard';
import { SEVERITY_ORDER, STATUS_ORDER } from '../labels';

interface FindingsTabProps {
  findings: Finding[];
  remediations: Record<string, Remediation>;
}

// Findings that need the developer's attention: detected issues, then
// candidates that need dynamic confirmation, then checks that could not
// finish. Checks that found nothing or did not apply are on the Static tab.
const SHOWN = new Set(['DETECTED', 'NEEDS_DYNAMIC_CONFIRMATION', 'INCONCLUSIVE']);

// Sort by status first, then by severity (most severe first).
function compare(a: Finding, b: Finding): number {
  const byStatus = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  if (byStatus !== 0) return byStatus;
  const rank = (f: Finding) => (f.severity ? SEVERITY_ORDER.indexOf(f.severity) : SEVERITY_ORDER.length);
  return rank(a) - rank(b);
}

export function FindingsTab({ findings, remediations }: FindingsTabProps) {
  const shown = findings.filter((f) => SHOWN.has(f.status)).sort(compare);

  if (shown.length === 0) {
    return <p>No issue was detected by the checks that ran. This does not mean the app is secure.</p>;
  }

  return (
    <>
      {shown.map((finding) => (
        <FindingCard
          key={finding.rule_id}
          finding={finding}
          remediation={finding.remediation_id ? remediations[finding.remediation_id] : undefined}
        />
      ))}
      <p className="hint">Checks that found nothing or did not apply are listed on the Static tab.</p>
    </>
  );
}
