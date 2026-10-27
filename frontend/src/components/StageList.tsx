import type { Stage, StageName, StageState } from '../api/types';

// Readable names for the pipeline's code names.
const STAGE_LABELS: Record<StageName, string> = {
  submit_and_validate: 'Submit and validate',
  static_inspection: 'Static inspection',
  environment_setup: 'Environment setup',
  runtime_tests: 'Runtime tests',
  timing_analysis: 'Timing analysis',
  findings: 'Findings',
  report: 'Report',
};

const STATE_LABELS: Record<StageState, string> = {
  pending: 'Waiting',
  running: 'In progress',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
};

export function StageList({ stages }: { stages: Stage[] }) {
  return (
    <ol className="stage-list">
      {stages.map((stage, index) => (
        <li key={stage.name} className={`stage stage-${stage.state}`}>
          <span className="stage-number">{index + 1}</span>
          <span className="stage-name">{STAGE_LABELS[stage.name]}</span>
          <span className="stage-state">{STATE_LABELS[stage.state]}</span>
        </li>
      ))}
    </ol>
  );
}
