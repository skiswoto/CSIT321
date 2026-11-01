import type { Stage } from '../api/types';
import { STAGE_LABELS, STAGE_STATE_LABELS } from './labels';

// Turns a number of seconds into "42 s" or "3 min 5 s".
function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} s`;
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

// How long a stage took, or for a running stage how long it has been running.
// The job page re-renders on every poll, so the running time stays current.
function stageTime(stage: Stage): string | null {
  if (!stage.started_at) return null;
  const start = Date.parse(stage.started_at);
  if (stage.ended_at) return formatSeconds((Date.parse(stage.ended_at) - start) / 1000);
  if (stage.state === 'RUNNING') return `${formatSeconds((Date.now() - start) / 1000)} so far`;
  return null;
}

// The seven pipeline stages with their state, time and any reason (FR-RPT-01).
export function StageList({ stages }: { stages: Stage[] }) {
  return (
    <ol className="stage-list">
      {stages.map((stage, index) => {
        const time = stageTime(stage);
        return (
          <li key={stage.name} className={`stage stage-${stage.state.toLowerCase()}`}>
            <span className="stage-number">{index + 1}</span>
            <span className="stage-name">
              {STAGE_LABELS[stage.name]}
              {stage.reason && <span className="stage-reason">{stage.reason}</span>}
            </span>
            <span className="stage-state">
              {STAGE_STATE_LABELS[stage.state]}
              {time && <span className="stage-time">{time}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
