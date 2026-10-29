// Readable labels and display order for schema values. Kept in one place so
// every screen words things the same way.

import type { FindingStatus, Severity, StageName, StageState } from '../api/types';

export const STAGE_LABELS: Record<StageName, string> = {
  submit_and_validate: 'Submit and validate',
  static_inspection: 'Static inspection',
  environment_setup: 'Environment setup',
  runtime_tests: 'Runtime tests',
  timing_analysis: 'Timing analysis',
  findings: 'Findings',
  report: 'Report',
};

// "Shown to the user as" column of PRD 5.1.5.
export const STAGE_STATE_LABELS: Record<StageState, string> = {
  PENDING: 'Waiting',
  RUNNING: 'In progress',
  SUCCESS: 'Completed',
  PARTIAL: 'Completed with limitations',
  FAILED: 'Failed',
  SKIPPED: 'Not performed',
};

export const STATUS_LABELS: Record<FindingStatus, string> = {
  DETECTED: 'Detected',
  NOT_DETECTED: 'Not detected',
  INCONCLUSIVE: 'Inconclusive',
  NEEDS_DYNAMIC_CONFIRMATION: 'Needs dynamic confirmation',
  NOT_APPLICABLE: 'Not applicable',
};

// Most severe first.
export const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

// Order of findings on the Findings tab: detected issues first, then the ones
// that still need work.
export const STATUS_ORDER: FindingStatus[] = [
  'DETECTED',
  'NEEDS_DYNAMIC_CONFIRMATION',
  'INCONCLUSIVE',
  'NOT_APPLICABLE',
  'NOT_DETECTED',
];
