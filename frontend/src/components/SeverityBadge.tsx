import type { Severity } from '../api/types';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`badge severity-${severity}`}>{severity}</span>;
}
