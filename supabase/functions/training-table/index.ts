// Training Lab live table – server-authoritative game controller.
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { applyAction, dueTimeout, emptyState, isConnected, isDealable, isHuman, r2, startHand, type ActionType, type Config, type LoggedAction, type SeatState, type TableState } from './engine.ts';
import { decideBot } from './bots.ts';
import { Conflict, persistDeal } from './dealPersistence.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const Body = z.object({
  cmd: z.enum(['start', 'pause', 'resume', 'end', 'discuss', 'deal', 'act', 'timeout', 'set_settings', 'set_preset', 'adjust_stack', 'seat_change', 'note', 'heartbeat', 'sit_in', 'sit_out', 'set_coach_seat']),
  lesson_id: z.string().uuid(),
  seat: z.number().int().min(1).max(9).optional(),
  action: z.enum(['fold', 'check', 'call', 'bet', 'raise', 'all-in']).optional(),
  amount: z.number().min(0).max(1e9).optional(),
  message: z.string().max(500).optional(),
  settings: z.object({ auto_deal: z.boolean().optional(), timer: z.union([z.literal(0), z.literal(15), z.literal(30), z.literal(60)]).optional() }).optional(),
  preset: z.object({
    dealer_seat: z.number().int().min(1).max(9).nullable().optional(),
    board: z.string().max(20).optional(),
    seats: z.record(z.object({ cards: z.string().max(12).optional(), stack: z.number().min(0).max(100000).optional() })).optional(),
  }).nullable().optional(),
  stack_bb: z.number().min(0).max(100000).optional(),
  seat_type: z.enum(['student', 'bot', 'coach', 'closed']).optional(),
  student_id: z.string().uuid().nullable().optional(),
  bot_name: z.string().max(30).nullable().optional(),
  bot_style: z.enum(['tight_passive', 'tight_aggressive', 'loose_passive', 'loose_aggressive']).nullable().optional(),
  note: z.string().min(1).max(2000).optional(),
  coach_seat: z.number().int().min(1).max(9).nullable().optional(),
  attach: z.enum(['lesson', 'hand', 'action']).optional(),
});

const cfgOf = (l: any): Config => ({ game_type: l.game_type, small_blind: Number(l.small_blind), big_blind: Number(l.big_blind), ante: Number(l.ante) });

async function loadState(lessonId: string): Promise<{ state: TableState; version: number }> {
  const { data } = await admin.from('training_table_state').select('state, version').eq('lesson_id', lessonId).maybeSingle();
  if (!data) return { state: emptyState(), version: -1 };
  return { state: { ...emptyState(), ...(data.state as any) }, version: data.version };
}

const markSitOut = (seat: number, auto: boolean) => (st: TableState) => {
  const p = st.seats[seat];
  if (p) Object.assign(p, { ready: false, sitting_out: true, auto_out: auto });
};

const humansReady = (s: TableState, now = Date.now()) => {
  const humans = Object.values(s.seats).filter(isHuman);
  return { ready: humans.filter((p) => isDealable(p, now)).length, total: humans.length };
};

function withDeadline(s: TableState) {
  s.deadline = s.status === 'in_hand' && s.to_act != null && s.settings.timer > 0 && !s.paused ? Date.now() + s.settings.timer * 1000 : null;
  s.turn_started = s.status === 'in_hand' && s.to_act != null ? Date.now() : null;
  return s;
}

/** Optimistic-concurrency save. Returns false if someone else changed the state first. */
async function commit(lessonId: string, s: TableState, version: number): Promise<boolean> {
  if (version < 0) {
    const { error } = await admin.from('training_table_state').insert({ lesson_id: lessonId, state: s, version: 1 });
    return !error;
  }
  const { data } = await admin.from('training_table_state')
    .update({ state: s, version: version + 1, updated_at: new Date().toISOString() })
    .eq('lesson_id', lessonId).eq('version', version).select('lesson_id');
  return !!data?.length;
}

async function buildSeats(lesson: any, prev: TableState): Promise<Record<string, SeatState>> {
  const { data: parts } = await admin.from('training_lesson_participants').select('*').eq('lesson_id', lesson.id).order('seat_number');
  const ids = (parts || []).filter((p: any) => p.student_id).map((p: any) => p.student_id);
  const { data: profs } = ids.length ? await admin.from('profiles').select('id, username, online_nickname').in('id', ids) : { data: [] };
  const name = (id: string) => { const p = (profs || []).find((x: any) => x.id === id); return p?.online_nickname || p?.username || 'Student'; };
  const seats: Record<string, SeatState> = {};
  const defaultStack = r2(Number(lesson.default_stack_bb) * Number(lesson.big_blind));
  for (const p of parts || []) {
    const old = prev.seats[p.seat_number];
    const sameOccupant = old && old.type === p.seat_type && old.player_id === (p.seat_type === 'coach' ? lesson.coach_id : p.student_id);
    seats[p.seat_number] = {
      seat: p.seat_number, type: p.seat_type,
      player_id: p.seat_type === 'student' ? p.student_id : p.seat_type === 'coach' ? lesson.coach_id : null,
      name: p.seat_type === 'student' ? name(p.student_id) : p.seat_type === 'bot' ? (p.bot_name || 'Bot') : p.seat_type === 'coach' ? 'Coach' : '',
      style: p.bot_style, stack: sameOccupant ? old.stack : Number(p.current_stack ?? p.starting_stack ?? defaultStack),
      bet: 0, committed: 0, folded: false, all_in: false, acted: false, in_hand: false,
      ...(sameOccupant ? { ready: old.ready, sitting_out: old.sitting_out, last_seen: old.last_seen, auto_out: (old as any).auto_out } : {}),
    } as SeatState;
  }
  return seats;
}

/** Replace one seat's participant row (validated by the seat trigger in the database). */
async function replaceSeat(lesson: any, s: TableState, seatNo: number, type: string, b: any = {}) {
  const stack = s.seats[seatNo]?.stack ?? r2(Number(lesson.default_stack_bb) * Number(lesson.big_blind));
  await admin.from('training_lesson_participants').delete().eq('lesson_id', lesson.id).eq('seat_number', seatNo);
  const { error } = await admin.from('training_lesson_participants').insert({
    lesson_id: lesson.id, seat_number: seatNo, seat_type: type,
    student_id: type === 'student' ? b.student_id : null,
    bot_name: type === 'bot' ? (b.bot_name || 'Bot') : null,
    bot_style: type === 'bot' ? (b.bot_style || 'tight_aggressive') : null,
    starting_stack: stack, current_stack: stack,
  });
  if (error) throw new Error(error.message.includes('limit') ? 'Student limit reached' : error.message.includes('approved') ? 'Not an approved student' : 'Could not change seat');
}

async function loadHand(handId: string) {
  const [{ data: sec }, { data: cards }] = await Promise.all([
    admin.from('training_hand_secrets').select('deck').eq('hand_id', handId).maybeSingle(),
    admin.from('training_hand_private_cards').select('seat_number, hole_cards').eq('hand_id', handId),
  ]);
  const holes: Record<string, string[]> = {};
  for (const c of cards || []) holes[c.seat_number] = (c.hole_cards.match(/../g) || []);
  return { deck: [...(sec?.deck || [])], holes };
}

async function logActions(handId: string, s: TableState, actions: LoggedAction[]) {
  if (!actions.length) return;
  await admin.from('training_hand_actions').insert(actions.map((a) => ({
    hand_id: handId, seat_number: a.seat, player_id: s.seats[a.seat]?.player_id ?? null, street: a.street,
    action: a.action, amount: a.amount, pot_after: a.pot_after, sequence: a.sequence, revealed_cards: a.revealed_cards ?? null,
  })));
}

async function finalizeHand(lessonId: string, s: TableState) {
  await admin.from('training_hands').update({
    board_cards: s.board.join(''), pot_total: s.pot_total, winners: s.results, status: 'ended', ended_at: new Date().toISOString(),
  }).eq('id', s.hand_id);
  await Promise.all(Object.values(s.seats).map((p) =>
    admin.from('training_lesson_participants').update({ current_stack: p.stack }).eq('lesson_id', lessonId).eq('seat_number', p.seat)));
}

async function doDeal(lesson: any, cur: { state: TableState; version: number }) {
  if (cur.state.status === 'in_hand') throw new Error('A hand is already in progress');
  if (cur.state.paused) throw new Error('Table is paused');
  const base = { ...cur.state, seats: await buildSeats(lesson, cur.state) };
  const { state, holes, deck, actions } = startHand(base, cfgOf(lesson));
  state.hand_id = crypto.randomUUID();
  withDeadline(state);
  await persistDeal((name, args) => admin.rpc(name, args), lesson.id, cur.version, state, deck, holes, actions);
  if (state.status === 'hand_over') await finalizeHand(lesson.id, state);
  return state;
}

async function doAct(lesson: any, cur: { state: TableState; version: number }, seat: number, type: ActionType, amount: number, mutate?: (s: TableState) => void) {
  const s = cur.state;
  if (!s.hand_id) throw new Error('No hand in progress');
  const { deck, holes } = await loadHand(s.hand_id);
  const res = applyAction(s, seat, type, amount, cfgOf(lesson), deck, holes);
  mutate?.(res.state);
  withDeadline(res.state);
  if (!(await commit(lesson.id, res.state, cur.version))) throw new Conflict();
  await admin.from('training_hand_secrets').update({ deck }).eq('hand_id', s.hand_id);
  await logActions(s.hand_id, res.state, res.actions);
  if (res.handEnded) await finalizeHand(lesson.id, res.state);
  return res.state;
}

/** Apply an overdue timeout: check if free, otherwise fold; disconnected players also sit out. */
async function applyTimeout(lesson: any, cur: { state: TableState; version: number }, due: { seat: number; sitOut: boolean }, extra?: (s: TableState) => void) {
  const p = cur.state.seats[due.seat];
  const canCheck = !due.sitOut && cur.state.current_bet - p.bet <= 0;
  return doAct(lesson, cur, due.seat, canCheck ? 'check' : 'fold', 0, (st) => {
    extra?.(st);
    if (due.sitOut) markSitOut(due.seat, !p.sitting_out || !!(p as any).auto_out)(st);
  });
}

/** Background loop: bots act with a natural delay; auto-deal the next hand. */
async function runAuto(lessonId: string) {
  for (let i = 0; i < 300; i++) {
    const { data: lesson } = await admin.from('training_lessons').select('*').eq('id', lessonId).single();
    if (!lesson || lesson.status !== 'live') return;
    let cur = await loadState(lessonId);
    const s = cur.state;
    if (s.paused) return;
    if (s.status === 'in_hand' && s.to_act != null && s.seats[s.to_act]?.type === 'bot') {
      const seat = s.to_act, v = cur.version;
      await sleep(600 + Math.random() * 900);
      cur = await loadState(lessonId);
      if (cur.version !== v) continue;
      // Re-check: a bot only ever acts for its own bot seat.
      if (cur.state.to_act !== seat || cur.state.seats[seat]?.type !== 'bot') continue;
      const { holes } = await loadHand(s.hand_id!);
      const d = decideBot(cur.state, seat, holes[seat] || [], cfgOf(lesson));
      try { await doAct(lesson, cur, seat, d.action, d.amount); }
      catch { try { await doAct(lesson, await loadState(lessonId), seat, 'fold', 0); } catch { return; } }
      continue;
    }
    if (s.status === 'hand_over' && s.settings.auto_deal) {
      const v = cur.version;
      await sleep(4000);
      cur = await loadState(lessonId);
      if (cur.version !== v || !cur.state.settings.auto_deal) return;
      // Never auto-deal unless a human is seated and ready, and at least 2 players can be dealt in.
      const now = Date.now();
      if (humansReady(cur.state, now).ready < 1) return;
      if (Object.values(cur.state.seats).filter((p) => isDealable(p, now)).length < 2) return;
      try { await doDeal(lesson, cur); } catch { return; }
      continue;
    }
    return;
  }
}

const background = (p: Promise<unknown>) => {
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(p.catch(() => {})); else p.catch(() => {});
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const { data: claims, error: authErr } = await admin.auth.getClaims(auth.slice(7));
    if (authErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const uid = claims.claims.sub as string;

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'Invalid request' }, 400);
    const b = parsed.data;

    const { data: lesson } = await admin.from('training_lessons').select('*').eq('id', b.lesson_id).maybeSingle();
    if (!lesson) return json({ error: 'Lesson not found' }, 404);
    const isCoach = lesson.coach_id === uid;
    const coachOnly = !['act', 'timeout', 'heartbeat', 'sit_in', 'sit_out'].includes(b.cmd);
    if (coachOnly && !isCoach) return json({ error: 'Only the coach can do this' }, 403);
    if (!isCoach) {
      const { data: seat } = await admin.from('training_lesson_participants').select('id').eq('lesson_id', lesson.id).eq('student_id', uid).maybeSingle();
      if (!seat) return json({ error: 'You are not seated in this lesson' }, 403);
    }

    // The bot loop and other players commit concurrently; retry on a version conflict.
    let out: any = null;
    for (let attempt = 0; attempt < 4 && !out; attempt++) {
     try { out = await (async (): Promise<TableState | Response> => {
      const cur = await loadState(lesson.id);
      const s = structuredClone(cur.state);
      const save = async (st: TableState) => {
        if (!(await commit(lesson.id, st, cur.version))) throw new Conflict();
        return st;
      };
      const betweenHands = () => { if (s.status === 'in_hand') throw new Error('Only between hands'); };

      let out: TableState = s;
      switch (b.cmd) {
        case 'start': {
          if (lesson.status === 'ended') throw new Error('Lesson has ended');
          await admin.from('training_lessons').update({ status: 'live', started_at: lesson.started_at ?? new Date().toISOString() }).eq('id', lesson.id);
          if (s.status !== 'in_hand') s.seats = await buildSeats(lesson, s);
          if (s.status === 'ended') s.status = 'waiting';
          s.paused = false; s.discuss = null;
          out = await save(withDeadline(s));
          if (lesson.status === 'draft') {
            const students = Object.values(s.seats).filter((p) => p.type === 'student' && p.player_id);
            if (students.length) await admin.from('notifications').insert(students.map((p) => ({
              recipient_user_id: p.player_id, sender_user_id: uid, type: 'training_lesson_live',
              title: 'Live lesson started', body: `${lesson.title} – join the table now`, training_lesson_id: lesson.id,
            })));
          }
          break;
        }
        case 'pause':
        case 'discuss':
          await admin.from('training_lessons').update({ status: 'paused' }).eq('id', lesson.id);
          s.paused = true; s.discuss = b.cmd === 'discuss' ? (b.message || null) : null; s.deadline = null;
          out = await save(s);
          break;
        case 'resume':
          await admin.from('training_lessons').update({ status: 'live' }).eq('id', lesson.id);
          s.paused = false; s.discuss = null;
          out = await save(withDeadline(s));
          break;
        case 'end':
          await admin.from('training_lessons').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', lesson.id);
          s.status = 'ended'; s.to_act = null; s.deadline = null; s.paused = false; s.discuss = null;
          out = await save(s);
          break;
        case 'set_settings':
          s.settings = { ...s.settings, ...(b.settings || {}) };
          out = await save(withDeadline(s));
          break;
        case 'set_preset':
          s.preset = b.preset ?? null;
          out = await save(s);
          break;
        case 'deal':
          if (lesson.status !== 'live') throw new Error('Start or resume the lesson first');
          out = await doDeal(lesson, cur);
          break;
        case 'act': {
          if (!b.seat || !b.action) throw new Error('Missing action');
          const seat = s.seats[b.seat];
          if (!seat) throw new Error('Unknown seat');
          const owns = seat.type === 'student' ? seat.player_id === uid : seat.type === 'coach' ? isCoach : false;
          if (!owns) throw new Error('This is not your seat');
          out = await doAct(lesson, cur, b.seat, b.action, b.amount ?? 0);
          break;
        }
        case 'timeout': {
          const due = dueTimeout(s);
          if (!due) return json({ ok: true, state: s });
          out = await applyTimeout(lesson, cur, due);
          break;
        }
        case 'heartbeat': {
          const now = Date.now();
          const mine = Object.values(s.seats).find((p) => (p.type === 'student' && p.player_id === uid) || (p.type === 'coach' && isCoach));
          const touch = (st: TableState) => {
            const m = mine && st.seats[mine.seat];
            if (!m) return;
            m.last_seen = now;
            // Back after an automatic sit-out caused by a disconnect: deal them in again.
            if ((m as any).auto_out) Object.assign(m, { sitting_out: false, ready: true, auto_out: false });
          };
          touch(cur.state); touch(s);
          const due = dueTimeout(cur.state, now);
          if (due) { out = await applyTimeout(lesson, cur, due); break; }
          if (!mine) return json({ ok: true });
          out = await save(s);
          return json({ ok: true, state: out });
        }
        case 'sit_in':
        case 'sit_out': {
          const target = isCoach && b.seat ? b.seat
            : Object.values(s.seats).find((p) => (p.type === 'student' && p.player_id === uid) || (p.type === 'coach' && isCoach))?.seat;
          const p = target != null ? s.seats[target] : undefined;
          if (!p || !isHuman(p)) throw new Error('No seat to sit in');
          const own = (p.type === 'student' && p.player_id === uid) || (p.type === 'coach' && isCoach);
          if (b.cmd === 'sit_in') {
            Object.assign(p, { ready: true, sitting_out: false, auto_out: false });
            if (own) p.last_seen = Date.now();
            out = await save(s);
          } else if (s.status === 'in_hand' && s.to_act === p.seat && !s.paused) {
            out = await doAct(lesson, cur, p.seat, 'fold', 0, markSitOut(p.seat, false));
          } else {
            markSitOut(p.seat, false)(s);
            out = await save(s);
          }
          break;
        }
        case 'set_coach_seat': {
          betweenHands();
          const target = b.coach_seat ?? null;
          if (target != null) {
            if (target > lesson.max_seats) throw new Error('Unknown seat');
            if (s.seats[target]?.type === 'student') throw new Error('That seat is taken by a student');
          }
          for (const p of Object.values(s.seats)) {
            if (p.type === 'coach' && p.seat !== target) await replaceSeat(lesson, s, p.seat, 'closed');
          }
          if (target != null && s.seats[target]?.type !== 'coach') await replaceSeat(lesson, s, target, 'coach');
          s.seats = await buildSeats(lesson, s);
          if (target != null) Object.assign(s.seats[target], { ready: true, sitting_out: false, last_seen: Date.now() });
          out = await save(s);
          break;
        }
        case 'adjust_stack': {
          betweenHands();
          if (!b.seat || b.stack_bb == null || !s.seats[b.seat]) throw new Error('Missing seat');
          const chips = r2(b.stack_bb * Number(lesson.big_blind));
          s.seats[b.seat].stack = chips;
          await admin.from('training_lesson_participants').update({ current_stack: chips }).eq('lesson_id', lesson.id).eq('seat_number', b.seat);
          out = await save(s);
          break;
        }
        case 'seat_change': {
          betweenHands();
          if (!b.seat || !b.seat_type || b.seat > lesson.max_seats) throw new Error('Missing seat');
          await replaceSeat(lesson, s, b.seat, b.seat_type, b);
          s.seats = await buildSeats(lesson, s);
          out = await save(s);
          break;
        }
        case 'note': {
          if (!b.note) throw new Error('Empty note');
          let actionId: string | null = null;
          if (b.attach === 'action' && s.hand_id) {
            const { data } = await admin.from('training_hand_actions').select('id').eq('hand_id', s.hand_id).order('sequence', { ascending: false }).limit(1).maybeSingle();
            actionId = data?.id ?? null;
          }
          await admin.from('training_notes').insert({
            lesson_id: lesson.id, coach_id: uid, note: b.note, student_id: b.student_id ?? null,
            hand_id: b.attach !== 'lesson' ? s.hand_id : null, action_id: actionId,
          });
          return json({ ok: true });
        }
      }
      return out;
     })(); }
     catch (e) { if (!(e instanceof Conflict) || attempt === 3) throw e; await sleep(80 + Math.random() * 150); }
     if (out instanceof Response) return out;
    }
    background(runAuto(lesson.id));
    return json({ ok: true, state: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return json({ error: msg.slice(0, 200) }, 400);
  }
});
