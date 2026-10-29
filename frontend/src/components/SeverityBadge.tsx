import type { FindingStatus, Severity } from '../api/types';
import { STATUS_LABELS } from './labels';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`badge severity-${severity.toLowerCase()}`}>{severity}</span>;
}

export function StatusBadge({ status }: { status: FindingStatus }) {
  return <span className={`badge status status-${status.toLowerCase()}`}>{STATUS_LABELS[status]}</span>;
}
