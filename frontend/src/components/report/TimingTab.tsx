import { isTimingEvidence, type Environment, type Finding, type Stage } from '../../api/types';
import { TimingEvidenceView } from '../FindingCard';
import { SeverityBadge, StatusBadge } from '../SeverityBadge';
import { STAGE_STATE_LABELS } from '../labels';

interface TimingTabProps {
  findings: Finding[];
  environment: Environment | null;
  timingStage: Stage | undefined;
}

// Timing results (report section F): each timing test with its measured
// interval, numbers and the limitation statement.
// TODO(Shawn, Nicholas): the timing evidence fields are a placeholder until
// the runtime spike settles them. FR-RPT-08 also asks for a distribution
// chart, the number of kept trials and the detection floor.
export function TimingTab({ findings, environment, timingStage }: TimingTabProps) {
  const timing = findings.filter((f) => f.evidence && isTimingEvidence(f.evidence));

  if (timing.length === 0 || !environment) {
    // Say why there are no timing results, rather than showing an empty tab.
    const why =
      timingStage && timingStage.state !== 'SUCCESS'
        ? `Timing analysis: ${STAGE_STATE_LABELS[timingStage.state].toLowerCase()}. ${timingStage.reason ?? ''}`
        : 'No timing test produced a result for this job.';
    return <p>{why}</p>;
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
