import type { Report } from '../../api/types';
import { StageList } from '../StageList';

// Assessment information and test environment (report sections A and B),
// so a result can be tied to the build and conditions tested.
export function EnvironmentTab({ report }: { report: Report }) {
  const { apk, environment } = report;
  const tools = [...new Set(report.findings.map((f) => `${f.tool} ${f.tool_version}`))];
  const ruleSets = [...new Set(report.findings.map((f) => f.rule_set_version))];

  return (
    <>
      <h3>Application</h3>
      <dl className="details">
        <dt>Package</dt>
        <dd>{apk.package}</dd>
        <dt>SHA-256</dt>
        <dd>
          <code>{apk.sha256}</code>
        </dd>
        <dt>Min / target SDK</dt>
        <dd>
          {apk.min_sdk} / {apk.target_sdk}
        </dd>
        <dt>Authorisation declared</dt>
        <dd>{report.consent_confirmed ? 'Yes' : 'No'}</dd>
      </dl>

      <h3>Test environment</h3>
      <dl className="details">
        <dt>Type</dt>
        <dd>{environment.type}</dd>
        <dt>API level</dt>
        <dd>{environment.api_level}</dd>
        <dt>ABI</dt>
        <dd>{environment.abi}</dd>
        <dt>Image</dt>
        <dd>{environment.image}</dd>
        <dt>Instrumentation</dt>
        <dd>{environment.instrumentation}</dd>
      </dl>

      <h3>Versions</h3>
      <dl className="details">
        <dt>Tools</dt>
        <dd>{tools.join('; ')}</dd>
        <dt>Rule set</dt>
        <dd>{ruleSets.join(', ')}</dd>
        <dt>Schema</dt>
        <dd>{report.schema_version}</dd>
      </dl>

      <h3>Pipeline stages</h3>
      <StageList stages={report.stages} />
    </>
  );
}
