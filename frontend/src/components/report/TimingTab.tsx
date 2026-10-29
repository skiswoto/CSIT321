import { isTimingEvidence, type Environment, type Finding } from '../../api/types';
import { TimingEvidenceView } from '../FindingCard';
import { SeverityBadge, StatusBadge } from '../SeverityBadge';

interface TimingTabProps {
  findings: Finding[];
  environment: Environment;
}

// Timing results (report section F): each timing test with its measured
// interval, numbers and the limitation statement.
export function TimingTab({ findings, environment }: TimingTabProps) {
  const timing = findings.filter((f) => f.evidence && isTimingEvidence(f.evidence));

  if (timing.length === 0) {
    return <p>No timing tests ran for this job.</p>;
  }

  return (
    <>
      <p className="finding-note">
        Measured on {environment.type === 'emulator' ? 'an emulator' : 'a device'} (API{' '}
        {environment.api_level}, {environment.abi}). Emulator timing does not reproduce hardware
        sensor timing, and instrumentation ({environment.instrumentation}) can change timing. A
        difference is a reason to investigate, not proof of a vulnerability.
      </p>
      {timing.map((f) => (
        <article key={f.rule_id} className="finding-card">
          <header className="finding-header">
            {f.severity && <SeverityBadge severity={f.severity} />}
            <StatusBadge status={f.status} />
            <h3>
              {f.rule_id}: {f.title}
            </h3>
          </header>
          {f.evidence && isTimingEvidence(f.evidence) && <TimingEvidenceView evidence={f.evidence} />}
          <p className="hint">
            Confidence {f.confidence} · validation level {f.validation_level}
          </p>
        </article>
      ))}
    </>
  );
}
