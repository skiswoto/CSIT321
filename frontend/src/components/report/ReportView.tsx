import { useState } from 'react';
import type { Report } from '../../api/types';
import { DemoTag } from '../DemoBanner';
import { SeverityBadge } from '../SeverityBadge';
import { SEVERITY_ORDER, STAGE_LABELS } from '../labels';
import { FindingsTab } from './FindingsTab';
import { RunDetailsTab } from './RunDetailsTab';
import { SummaryTab } from './SummaryTab';
import { TimingTab } from './TimingTab';

// The four tabs named in PRD 6.2 and 7.5.
const TABS = ['Summary', 'Findings', 'Timing', 'Run details'] as const;
type Tab = (typeof TABS)[number];

// Saves the report as a JSON file. It is the same object the page shows,
// so the export and the screen cannot disagree (FR-RPT-10).
function downloadJson(report: Report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.job_id}-report.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// For PARTIAL and FAILED jobs: a short notice naming what did not run and why,
// so the report never reads like a clean result (PRD 8.6).
function StatusNotice({ report }: { report: Report }) {
  if (report.status === 'SUCCESS') return null;
  const failed = report.stages.find((stage) => stage.state === 'FAILED');
  const skipped = report.stages.filter((stage) => stage.state === 'SKIPPED');

  if (report.status === 'FAILED') {
    return (
      <p className="notice notice-failed" role="status">
        <strong>Analysis failed</strong>
        {failed && ` at stage ${report.stages.indexOf(failed) + 1}, ${STAGE_LABELS[failed.name].toLowerCase()}`}.{' '}
        {failed?.reason}
      </p>
    );
  }
  return (
    <p className="notice notice-partial" role="status">
      <strong>Completed with limitations.</strong>{' '}
      {skipped.length > 0 &&
        `Not performed: ${skipped.map((stage) => STAGE_LABELS[stage.name].toLowerCase()).join(', ')}. ${skipped[0].reason ?? ''}`}
    </p>
  );
}

// The finished state of the job page: the report, with a severity summary
// above four tabs. All tab panels are rendered; the inactive ones are hidden
// on screen but shown when printing, so a printed report contains everything.
// The counts come from the report's summary, which the backend works out.
export function ReportView({ report }: { report: Report }) {
  const [activeTab, setActiveTab] = useState<Tab>('Summary');
  const { summary } = report;
  const id = (tab: Tab) => tab.replace(' ', '-');

  return (
    <section className="report">
      <div className="report-title">
        <h2>
          Security report: {report.apk.package ?? 'unreadable APK'} <DemoTag />
        </h2>
        <div className="report-actions no-print">
          <button onClick={() => downloadJson(report)}>Export JSON</button>
          <button onClick={() => window.print()}>Print or save as PDF</button>
        </div>
      </div>
      <p className="hint">
        {report.job_id} · created {new Date(report.created_at).toLocaleString('en-GB')}
      </p>

      <StatusNotice report={report} />

      <ul className="summary" aria-label="Detected findings by severity">
        {SEVERITY_ORDER.map((severity) => (
          <li key={severity}>
            <SeverityBadge severity={severity} /> {summary.by_severity[severity]}
          </li>
        ))}
        <li>Needs dynamic confirmation: {summary.by_status.NEEDS_DYNAMIC_CONFIRMATION}</li>
        <li>Inconclusive: {summary.by_status.INCONCLUSIVE}</li>
      </ul>

      <div className="tabs no-print" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            id={`tab-${id(tab)}`}
            aria-selected={activeTab === tab}
            aria-controls={`panel-${id(tab)}`}
            className={activeTab === tab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-Summary" aria-labelledby="tab-Summary" hidden={activeTab !== 'Summary'}>
        <SummaryTab report={report} />
      </div>
      <div role="tabpanel" id="panel-Findings" aria-labelledby="tab-Findings" hidden={activeTab !== 'Findings'}>
        <FindingsTab findings={report.findings} remediations={report.remediations} />
      </div>
      <div role="tabpanel" id="panel-Timing" aria-labelledby="tab-Timing" hidden={activeTab !== 'Timing'}>
        <TimingTab
          findings={report.findings}
          environment={report.environment}
          timingStage={report.stages.find((stage) => stage.name === 'timing_analysis')}
        />
      </div>
      <div role="tabpanel" id="panel-Run-details" aria-labelledby="tab-Run-details" hidden={activeTab !== 'Run details'}>
        <RunDetailsTab report={report} />
      </div>
    </section>
  );
}
