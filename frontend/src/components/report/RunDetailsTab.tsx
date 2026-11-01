import type { Report } from '../../api/types';
import { StageList } from '../StageList';

// Run details (PRD 7.5): the test environment (report section B), tool and
// rule-set versions, the limits found in the app and the state of each stage,
// so a result can be tied to the build and conditions tested.
export function RunDetailsTab({ report }: { report: Report }) {
  const { environment, analysis_limits: limits } = report;
  const tools = [...new Set(report.findings.map((f) => `${f.tool} ${f.tool_version}`))];
  const ruleSets = [...new Set(report.findings.map((f) => f.rule_set_version))];

  return (
    <>
      <h3>Test environment</h3>
      {environment ? (
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
      ) : (
        <p>No emulator was set up for this job, so the app was not run.</p>
      )}

      <h3>Versions</h3>
      <dl className="details">
        <dt>Tools</dt>
        <dd>{tools.join('; ')}</dd>
        <dt>Rule set</dt>
        <dd>{ruleSets.join(', ')}</dd>
        <dt>Schema</dt>
        <dd>{report.schema_version}</dd>
        <dt>Authorisation declared</dt>
        <dd>{report.consent_confirmed ? 'Yes' : 'No'}</dd>
      </dl>

      <h3>Limits found in the app</h3>
      {limits ? (
        <dl className="details">
          <dt>Obfuscated</dt>
          <dd>{limits.obfuscated ? 'Yes' : 'No'}</dd>
          <dt>Native libraries</dt>
          <dd>{limits.native_libs}</dd>
          <dt>Dynamic class loading</dt>
          <dd>{limits.dynamic_class_loading ? 'Yes' : 'No'}</dd>
        </dl>
      ) : (
        <p>Unknown: the APK could not be read.</p>
      )}

      <h3>Pipeline stages</h3>
      <StageList stages={report.stages} />
    </>
  );
}
