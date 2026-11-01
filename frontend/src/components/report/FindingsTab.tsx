import { useState } from 'react';
import type { Finding, FindingStatus, Remediation, Severity, Technique } from '../../api/types';
import { FindingCard } from '../FindingCard';
import { SeverityBadge, StatusBadge } from '../SeverityBadge';
import { SEVERITY_ORDER, STATUS_LABELS, STATUS_ORDER, TECHNIQUE_LABELS } from '../labels';

interface FindingsTabProps {
  findings: Finding[];
  remediations: Record<string, Remediation>;
}

type SortKey = 'status' | 'severity' | 'rule';

const ALL = 'all';

function severityRank(f: Finding): number {
  return f.severity ? SEVERITY_ORDER.indexOf(f.severity) : SEVERITY_ORDER.length;
}

// Each sort uses the others to break ties, so the order is always the same.
const COMPARE: Record<SortKey, (a: Finding, b: Finding) => number> = {
  status: (a, b) =>
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || severityRank(a) - severityRank(b),
  severity: (a, b) =>
    severityRank(a) - severityRank(b) || STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  rule: (a, b) => a.rule_id.localeCompare(b.rule_id),
};

// The findings list (FR-RPT-07) and the detail of one selected finding
// (FR-FND-01 to 08). When printing, every finding is shown in full instead.
export function FindingsTab({ findings, remediations }: FindingsTabProps) {
  const [severity, setSeverity] = useState<Severity | typeof ALL>(ALL);
  const [status, setStatus] = useState<FindingStatus | typeof ALL>(ALL);
  const [technique, setTechnique] = useState<Technique | typeof ALL>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const shown = findings
    .filter((f) => severity === ALL || f.severity === severity)
    .filter((f) => status === ALL || f.status === status)
    .filter((f) => technique === ALL || f.technique === technique)
    .sort(COMPARE[sortKey]);
  const selected = shown.find((f) => f.rule_id === selectedId);
  const templateFor = (f: Finding) => (f.remediation_id ? remediations[f.remediation_id] : undefined);

  return (
    <>
      <div className="filters no-print">
        <label>
          Severity
          <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity | typeof ALL)}>
            <option value={ALL}>All</option>
            {SEVERITY_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as FindingStatus | typeof ALL)}>
            <option value={ALL}>All</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Technique
          <select value={technique} onChange={(e) => setTechnique(e.target.value as Technique | typeof ALL)}>
            <option value={ALL}>All</option>
            {(['static', 'dynamic', 'inferred'] as const).map((t) => (
              <option key={t} value={t}>
                {TECHNIQUE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="status">Status</option>
            <option value="severity">Severity</option>
            <option value="rule">Rule ID</option>
          </select>
        </label>
      </div>

      <div className="no-print">
        {shown.length === 0 ? (
          <p>No findings match these filters.</p>
        ) : (
          <table className="data-table findings-list">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Finding</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Technique</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((f) => (
                <tr key={f.rule_id} className={f.rule_id === selectedId ? 'selected' : undefined}>
                  <td>{f.rule_id}</td>
                  <td>
                    <button
                      className="link-button"
                      aria-expanded={f.rule_id === selectedId}
                      onClick={() => setSelectedId(f.rule_id === selectedId ? null : f.rule_id)}
                    >
                      {f.title}
                    </button>
                  </td>
                  <td>
                    <StatusBadge status={f.status} />
                  </td>
                  <td>{f.severity ? <SeverityBadge severity={f.severity} /> : 'None'}</td>
                  <td>{TECHNIQUE_LABELS[f.technique]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selected ? (
          <FindingCard finding={selected} remediation={templateFor(selected)} />
        ) : (
          shown.length > 0 && <p className="hint">Select a finding to see its evidence and recommended fix.</p>
        )}
      </div>

      <div className="print-only">
        {[...findings].sort(COMPARE.status).map((f) => (
          <FindingCard key={f.rule_id} finding={f} remediation={templateFor(f)} />
        ))}
      </div>
    </>
  );
}
