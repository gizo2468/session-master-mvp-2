import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { emptyState } from './engine.ts';
import { Conflict, persistDeal } from './dealPersistence.ts';

Deno.test('deal publishes state, deck and private cards together in one RPC', async () => {
  const state = emptyState(); state.hand_number = 7; state.hand_id = crypto.randomUUID();
  const calls: Record<string, unknown>[] = [];
  await persistDeal((name, args) => {
    assertEquals(name, 'commit_training_deal'); calls.push(args);
    return Promise.resolve({ data: true, error: null });
  }, 'lesson', 35, state, ['As', 'Kd'], { 1: ['Ah', 'Ad'] }, []);
  assertEquals(calls.length, 1);
  assertEquals(calls[0].p_version, 35);
  assertEquals(calls[0].p_state, state);
  assertEquals(calls[0].p_holes, { 1: ['Ah', 'Ad'] });
  assertEquals(calls[0].p_deck, ['As', 'Kd']);
});

Deno.test('overlapping deal is a retryable conflict, not a duplicate hand failure', async () => {
  await assertRejects(() => persistDeal(() => Promise.resolve({ data: false, error: null }),
    'lesson', 35, emptyState(), [], {}, []), Conflict);
});

Deno.test('database failure does not expose private error details', async () => {
  await assertRejects(() => persistDeal(() => Promise.resolve({ data: null, error: { code: '23505' } }),
    'lesson', 35, emptyState(), [], {}, []), Error, 'Could not create hand');
});