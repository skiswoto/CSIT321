import { isTimingEvidence, type Finding, type Remediation, type StaticEvidence, type TimingEvidence } from '../api/types';
import { SeverityBadge, StatusBadge } from './SeverityBadge';

// Shows a number, or "Not measured" while the backend has not filled it in.
function valueOrPending(value: number | null, unit = '') {
  return value === null ? 'Not measured' : `${value}${unit}`;
}

function StaticEvidenceView({ evidence }: { evidence: StaticEvidence }) {
  const location = [evidence.file, evidence.method].filter(Boolean).join(', method ');
  return (
    <div className="evidence">
      {location && <p className="evidence-location">{location}</p>}
      {evidence.snippet && <code className="evidence-code">{evidence.snippet}</code>}
    </div>
  );
}

export function TimingEvidenceView({ evidence }: { evidence: TimingEvidence }) {
  return (
    <dl className="details">
      <dt>Interval</dt>
      <dd>
        {evidence.measurement}: {evidence.start_event} to {evidence.end_event}
      </dd>
      <dt>Samples per condition</dt>
      <dd>{valueOrPending(evidence.samples_per_condition)}</dd>
      <dt>Mean difference</dt>
      <dd>{valueOrPending(evidence.mean_difference_ms, ' ms')}</dd>
      <dt>Effect size</dt>
      <dd>{valueOrPending(evidence.effect_size)}</dd>
      <dt>p-value</dt>
      <dd>{valueOrPending(evidence.p_value)}</dd>
      <dt>Test</dt>
      <dd>{evidence.test}</dd>
    </dl>
  );
}

interface FindingCardProps {
  finding: Finding;
  remediation?: Remediation;
}

export function FindingCard({ finding, remediation }: FindingCardProps) {
  return (
    <article className="finding-card">
      <header className="finding-header">
        {finding.severity && <SeverityBadge severity={finding.severity} />}
        <StatusBadge status={finding.status} />
        <h3>
          {finding.rule_id}: {finding.title}
        </h3>
      </header>

      <dl className="details">
        <dt>Validation level</dt>
        <dd>{finding.validation_level}</dd>
        <dt>Confidence</dt>
        <dd>{finding.confidence}</dd>
        <dt>Technique</dt>
        <dd>{finding.technique}</dd>
        {finding.affected_component && (
          <>
            <dt>Affected component</dt>
            <dd>
              <code>{finding.affected_component}</code>
            </dd>
          </>
        )}
      </dl>

      {finding.evidence && (
        <>
          <h4>Evidence</h4>
          {isTimingEvidence(finding.evidence) ? (
            <TimingEvidenceView evidence={finding.evidence} />
          ) : (
            <StaticEvidenceView evidence={finding.evidence} />
          )}
        </>
      )}

      {finding.impact && (
        <>
          <h4>Potential impact</h4>
          <p>{finding.impact}</p>
        </>
      )}

      {finding.reason && (
        <>
          <h4>Why this is not settled</h4>
          <p>{finding.reason}</p>
          {finding.next_step && (
            <p>
              <strong>Next step:</strong> {finding.next_step}
            </p>
          )}
        </>
      )}

      {/* A timing difference is evidence to investigate, never proof (FR-DYN-11, FR-DYN-12). */}
      {finding.technique === 'dynamic' && (
        <p className="finding-note">
          A statistically significant difference is a reason to investigate. It does not prove the
          timing can be exploited. Emulator timing does not reproduce hardware sensor timing, and
          instrumentation can change timing.
        </p>
      )}

      {remediation && (
        <>
          <h4>Recommended fix</h4>
          <p>{remediation.action}</p>
          <p>
            <strong>Re-test:</strong> {remediation.retest}
          </p>
          <p className="finding-reference">
            {remediation.remediation_id} · {remediation.reference}
          </p>
        </>
      )}

      <p className="finding-tool">
        {finding.tool} {finding.tool_version} · rule set {finding.rule_set_version}
      </p>
    </article>
  );
}
