import { useState } from 'react';
import type { Report } from '../../api/types';
import { DemoTag } from '../DemoBanner';
import { SeverityBadge } from '../SeverityBadge';
import { SEVERITY_ORDER } from '../labels';
import { EnvironmentTab } from './EnvironmentTab';
import { FindingsTab } from './FindingsTab';
import { StaticTab } from './StaticTab';
import { TimingTab } from './TimingTab';

const TABS = ['Findings', 'Static', 'Timing', 'Environment'] as const;
type Tab = (typeof TABS)[number];

// The completed state of the job page: a severity summary and four tabs.
// All four tab panels are rendered; the inactive ones are hidden on screen
// but shown when printing, so a printed report contains everything.
// The counts come from the report's summary, which the backend works out.
export function ReportView({ report }: { report: Report }) {
  const [activeTab, setActiveTab] = useState<Tab>('Findings');
  const { summary } = report;

  return (
    <section className="report">
      <div className="report-title">
        <h2>
          Security report: {report.apk.package} <DemoTag />
        </h2>
        <button className="no-print" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      <p className="hint">
        {report.job_id} · created {new Date(report.created_at).toLocaleString('en-GB')}
      </p>

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
            id={`tab-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            className={activeTab === tab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-Findings" aria-labelledby="tab-Findings" hidden={activeTab !== 'Findings'}>
        <FindingsTab findings={report.findings} remediations={report.remediations} />
      </div>
      <div role="tabpanel" id="panel-Static" aria-labelledby="tab-Static" hidden={activeTab !== 'Static'}>
        <StaticTab findings={report.findings} limits={report.analysis_limits} />
      </div>
      <div role="tabpanel" id="panel-Timing" aria-labelledby="tab-Timing" hidden={activeTab !== 'Timing'}>
        <TimingTab findings={report.findings} environment={report.environment} />
      </div>
      <div role="tabpanel" id="panel-Environment" aria-labelledby="tab-Environment" hidden={activeTab !== 'Environment'}>
        <EnvironmentTab report={report} />
      </div>
    </section>
  );
}
