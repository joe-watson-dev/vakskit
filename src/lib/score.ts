import type { Issue } from './types';

/** A simple 0–100 health score from the checks: errors weigh most, tips least. */
export function seoScore(issues: Issue[]) {
  const penalty = issues.reduce((sum, i) => sum + (i.level === 'error' ? 15 : i.level === 'warn' ? 6 : 2), 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function toImprove(issues: Issue[]) {
  return issues.filter((i) => i.level !== 'info').length;
}
