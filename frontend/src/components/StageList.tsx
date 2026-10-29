import type { Stage } from '../api/types';
import { STAGE_LABELS, STAGE_STATE_LABELS } from './labels';

export function StageList({ stages }: { stages: Stage[] }) {
  return (
    <ol className="stage-list">
      {stages.map((stage, index) => (
        <li key={stage.name} className={`stage stage-${stage.state.toLowerCase()}`}>
          <span className="stage-number">{index + 1}</span>
          <span className="stage-name">
            {STAGE_LABELS[stage.name]}
            {stage.reason && <span className="stage-reason">{stage.reason}</span>}
          </span>
          <span className="stage-state">{STAGE_STATE_LABELS[stage.state]}</span>
        </li>
      ))}
    </ol>
  );
}
