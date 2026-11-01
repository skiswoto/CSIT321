import type { Report, Stage } from '../../api/types';
import { STAGE_LABELS, STAGE_STATE_LABELS } from '../labels';

// Wording for report sections G (limitations) and H (conclusion) in PRD 5.1.5.
// Both are worked out from the report data only, so they always match the
// rest of the report. They never decide a finding; they only describe what
// the report already holds.

// Stages 3 to 5: the runtime and timing path.
const DYNAMIC_STAGES = new Set(['environment_setup', 'runtime_tests', 'timing_analysis']);

export function dynamicStages(report: Report): Stage[] {
  return report.stages.filter((stage) => DYNAMIC_STAGES.has(stage.name));
}

// "1 check is" or "3 checks are".
function count(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

// One line per run of neighbouring stages that share a state and a reason,
// so stages 3 to 5 skipped for the same reason read as one limitation.
function stageLimits(report: Report): string[] {
  const groups: { stages: Stage[]; numbers: number[] }[] = [];
  report.stages.forEach((stage, index) => {
    if (stage.state !== 'SKIPPED' && stage.state !== 'FAILED' && stage.state !== 'PARTIAL') return;
    const last = groups[groups.length - 1];
    const previous = last?.stages[last.stages.length - 1];
    const neighbour = last && last.numbers[last.numbers.length - 1] === index;
    if (neighbour && previous.state === stage.state && previous.reason === stage.reason) {
      last.stages.push(stage);
      last.numbers.push(index + 1);
    } else {
      groups.push({ stages: [stage], numbers: [index + 1] });
    }
  });

  return groups.map(({ stages, numbers }) => {
    const first = stages[0];
    const which =
      numbers.length === 1 ? `Stage ${numbers[0]}` : `Stages ${numbers[0]} to ${numbers[numbers.length - 1]}`;
    const names = stages.map((stage) => STAGE_LABELS[stage.name].toLowerCase()).join(', ');
    const state = STAGE_STATE_LABELS[first.state].toLowerCase();
    return `${which} (${names}): ${state}. ${first.reason ?? 'No reason was recorded.'}`;
  });
}

// Section G: what this report cannot establish.
export function limitationsFor(report: Report): string[] {
  const limits = stageLimits(report);

  const appLimits = report.analysis_limits;
  if (!appLimits) {
    limits.push('The APK could not be read, so its obfuscation, native code and code loaded at runtime are unknown.');
  } else {
    if (appLimits.obfuscated) {
      limits.push('The app is obfuscated, so rules that need class or method names may be inconclusive.');
    }
    if (appLimits.native_libs > 0) {
      limits.push(`The app has ${appLimits.native_libs} native libraries, which the static rules do not inspect.`);
    }
    if (appLimits.dynamic_class_loading) {
      limits.push('The app loads code at runtime, and that code was not inspected.');
    }
  }

  if (report.environment?.type === 'emulator') {
    limits.push(
      'Timing was measured on an emulator, which does not reproduce hardware sensor timing. Instrumentation can also change timing. A timing difference is a reason to investigate, not proof of a vulnerability.',
    );
  }

  limits.push('Only the code paths the rules inspect and the scenarios the runtime tests drive were tested. Other paths in the app were not.');
  limits.push('Face recognition is covered at the API level only, because the emulator does not simulate it.');
  limits.push('Apps never receive raw biometric templates, so template storage and extraction are outside what this tool can test.');
  return limits;
}

// Section H: what was assessed, what was found and what remains uncertain.
export function conclusionFor(report: Report): string[] {
  const { summary } = report;
  const staticStage = report.stages.find((stage) => stage.name === 'static_inspection');
  const ranDynamic = dynamicStages(report).some((stage) => stage.state === 'SUCCESS' || stage.state === 'PARTIAL');

  // Nothing ran, so there is nothing to report as found or uncertain.
  if (staticStage?.state === 'FAILED') {
    return [
      'Static inspection could not complete, so no rule produced a result and the runtime tests did not run.',
      'This report says nothing about how secure the app is. Fix the reason above and upload the app again.',
    ];
  }

  const assessed = `Static inspection ran ${summary.by_technique.static} rules. ${
    ranDynamic ? 'Runtime and timing tests ran on an emulator.' : 'Runtime and timing tests were not performed.'
  }`;

  // INFO findings are inventory facts (for example SB-01), not issues.
  const issues = summary.by_status.DETECTED - summary.by_severity.INFO;
  const found =
    issues > 0
      ? `${count(issues, 'issue was', 'issues were')} detected: ${summary.by_severity.CRITICAL} critical, ${summary.by_severity.HIGH} high, ${summary.by_severity.MEDIUM} medium and ${summary.by_severity.LOW} low.`
      : 'No issue was detected by the checks that ran. This does not mean the app is secure.';

  const open = [
    summary.by_status.INCONCLUSIVE > 0 && `${count(summary.by_status.INCONCLUSIVE, 'check is', 'checks are')} inconclusive`,
    summary.by_status.NEEDS_DYNAMIC_CONFIRMATION > 0 &&
      `${count(summary.by_status.NEEDS_DYNAMIC_CONFIRMATION, 'finding needs', 'findings need')} dynamic confirmation`,
  ].filter(Boolean);
  const uncertain =
    open.length > 0
      ? `Still uncertain: ${open.join(', and ')}. See the limitations above.`
      : 'Every check that ran reached a result. The limitations above still apply.';

  return [assessed, found, uncertain];
}
