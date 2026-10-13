/**
 * Worktree naming utility for ColtIDE
 * Generates clean, friendly branch names for new worktrees (e.g. colt/feature-1, colt/experiment-2).
 */

export const DEFAULT_BRANCH_PREFIX = 'colt';

export interface PickedWorktreeName {
  readonly branch: string;
  readonly poolName: string;
  readonly suffixed: boolean;
  readonly poolExhausted: boolean;
}

const COLT_NAMES = [
  'meld-sync',
  'layer-link',
  'query-cache',
  'vector-store',
  'stream-fetch',
  'atlas-join',
  'atomic-saga',
  'schema-check',
  'index-scan',
  'event-stream',
];

export function pickWorktreeName(
  _tier: number = 0,
  existingWorktrees: readonly { branch?: string | null }[] = [],
  options?: { readonly prefix?: string },
): PickedWorktreeName {
  const prefix = options?.prefix ?? DEFAULT_BRANCH_PREFIX;
  const used = new Set(
    existingWorktrees
      .map((w) => w.branch?.replace(`${prefix}/`, ''))
      .filter(Boolean)
  );

  for (const name of COLT_NAMES) {
    if (!used.has(name)) {
      return {
        branch: `${prefix}/${name}`,
        poolName: name,
        suffixed: false,
        poolExhausted: false,
      };
    }
  }

  const num = existingWorktrees.length + 1;
  const fallback = `worktree-${num}`;
  return {
    branch: `${prefix}/${fallback}`,
    poolName: fallback,
    suffixed: true,
    poolExhausted: true,
  };
}
