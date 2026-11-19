import type { LoggedAction, TableState } from './engine.ts';

export class Conflict extends Error {
  constructor() { super('Table changed, try again'); }
}

type DealRpc = (name: string, args: Record<string, unknown>) => PromiseLike<{
  data: unknown; error: { code?: string } | null;
}>;

/** Publish the deal and every private record in one database transaction. */
export async function persistDeal(rpc: DealRpc, lessonId: string, version: number,
  state: TableState, deck: string[], holes: Record<string, string[]>, actions: LoggedAction[]) {
  const { data, error } = await rpc('commit_training_deal', {
    p_lesson_id: lessonId, p_version: version, p_state: state,
    p_deck: deck, p_holes: holes, p_actions: actions,
  });
  if (error) {
    // Log only a diagnostic code, never the deck, private cards or DB details.
    console.error('training-table: atomic deal failed', { code: error.code });
    throw new Error('Could not create hand');
  }
  if (data !== true) throw new Conflict();
}