import type { Environment, Evidence, Finding } from '../api/types';
import { DemoTag } from './DemoBanner';
import { SeverityBadge } from './SeverityBadge';

// Shows a value, or "Not yet measured" while the backend has not filled it in.
function valueOrPending(value: number | null, unit = '') {
  return value === null ? 'Not yet measured' : `${value}${unit}`;
}

function EvidenceDetails({ evidence }: { evidence: Evidence }) {
  if (evidence.type === 'code') {
    return <code className="evidence-code">{evidence.detail}</code>;
  }

  return (
    <dl className="evidence-timing">
      <dt>Samples per condition</dt>
      <dd>{valueOrPending(evidence.samples_per_condition)} <DemoTag /></dd>
      <dt>Mean difference</dt>
      <dd>{valueOrPending(evidence.mean_difference_ms, ' ms')} <DemoTag /></dd>
      <dt>p-value</dt>
      <dd>{valueOrPending(evidence.p_value)} <DemoTag /></dd>
      <dt>Effect size</dt>
      <dd>{valueOrPending(evidence.effect_size)} <DemoTag /></dd>
    </dl>
  );
}

interface FindingCardProps {
  finding: Finding;
  environment: Environment;
}

export function FindingCard({ finding, environment }: FindingCardProps) {
  const isTiming = finding.evidence.type === 'timing';

  return (
    <article className="finding-card">
      <header className="finding-header">
        <SeverityBadge severity={finding.severity} />
        <h3>
          {finding.id}: {finding.title}
        </h3>
      </header>

      <dl className="finding-meta">
        <dt>Confidence</dt>
        <dd>{finding.confidence}</dd>
        <dt>Category</dt>
        <dd>{finding.category}</dd>
        <dt>Technique</dt>
        <dd>{finding.technique}</dd>
        <dt>Affected component</dt>
        <dd>
          <code>{finding.component}</code>
        </dd>
      </dl>

      <h4>Evidence</h4>
      <EvidenceDetails evidence={finding.evidence} />

      {/* Constraints from CLAUDE.md: a timing difference is evidence, not proof,
          and emulator timing is not a hardware-level result. */}
      {isTiming && (
        <p className="finding-note">
          A statistically significant difference is a reason to investigate. It does not prove
          the timing can be exploited.
          {environment.type === 'emulator' &&
            ' Measured on an emulator, so this does not reflect hardware sensor timing.'}
        </p>
      )}

      <h4>Recommended fix</h4>
      <p>{finding.recommendation}</p>
      <p className="finding-reference">Reference: {finding.reference}</p>
    </article>
  );
}
