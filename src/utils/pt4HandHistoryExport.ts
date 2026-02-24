import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// ---- Types ----

interface HandRow {
  id: string;
  session_id: string;
  table_id: string | null;
  hand_number: number | null;
  hole_cards: string | null;
  position: string | null;
  small_blind: number | null;
  big_blind: number | null;
  hero_stack_bb: number | null;
  preflop_actions: any;
  flop_actions: any;
  turn_actions: any;
  river_actions: any;
  preflop_action: string | null;
  flop_action: string | null;
  turn_action: string | null;
  river_action: string | null;
  flop_cards: string | null;
  turn_card: string | null;
  river_card: string | null;
  pot_size: number | null;
  amount_won: number | null;
  amount_invested: number | null;
  showdown_result: string | null;
  result_value: number | null;
  result_unit: string | null;
  villains: any;
  game_type: string | null;
  created_at: string | null;
}

interface SessionInfo {
  id: string;
  format: string;
  location: string | null;
  currency: string | null;
  small_blind: number | null;
  big_blind: number | null;
  start_time: string;
  game_type: string;
}

interface TableInfo {
  id: string;
  table_name: string | null;
  stakes: string | null;
  game_format: string | null;
}

// ---- Helpers ----

/** Convert UUID to a numeric hand ID for PT4 */
function uuidToNumericId(uuid: string): string {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const c = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash + c) | 0;
  }
  return String(Math.abs(hash));
}

/** Map position abbreviation to seat number */
function positionToSeat(pos: string | null): number {
  const map: Record<string, number> = {
    'BTN': 1, 'BU': 1, 'Button': 1,
    'SB': 2, 'Small Blind': 2,
    'BB': 3, 'Big Blind': 3,
    'UTG': 4, 'Under the Gun': 4,
    'UTG+1': 5, 'UTG1': 5,
    'MP': 6, 'Middle Position': 6, 'UTG+2': 6, 'LJ': 6, 'Lojack': 6,
    'HJ': 7, 'Hijack': 7,
    'CO': 8, 'Cutoff': 8,
  };
  if (!pos) return 4;
  return map[pos] ?? 4;
}

/** Seat number to position label for summary */
function seatToPositionLabel(seat: number): string {
  const map: Record<number, string> = {
    1: 'button', 2: 'small blind', 3: 'big blind',
    4: 'under the gun', 5: 'under the gun +1',
    6: 'middle position', 7: 'hijack', 8: 'cutoff',
  };
  return map[seat] || '';
}

/** Format card notation: convert internal format to PT4 format (e.g., "Ah", "Td") */
function formatCard(card: string): string {
  if (!card || card.length < 2) return '??';
  // Already in correct format like "Ah", "Td", "9c"
  return card.trim();
}

/** Parse hole cards string into array */
function parseCards(cardsStr: string | null): string[] {
  if (!cardsStr) return [];
  // Handle formats like "Ah Kd", "Ah,Kd", "AhKd"
  const cleaned = cardsStr.trim();
  if (cleaned.includes(' ')) return cleaned.split(/\s+/).map(formatCard);
  if (cleaned.includes(',')) return cleaned.split(',').map(c => formatCard(c.trim()));
  // Pairs like "AhKd" - split every 2 chars
  const cards: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    if (i + 1 < cleaned.length) {
      cards.push(formatCard(cleaned.substring(i, i + 2)));
    }
  }
  return cards;
}

/** Parse flop cards */
function parseFlopCards(flopStr: string | null): string[] {
  if (!flopStr) return [];
  return parseCards(flopStr);
}

/** Format game type for PT4 header */
function formatGameType(gameType: string | null): string {
  const gt = (gameType || 'NLH').toUpperCase();
  if (gt.includes('PLO') || gt.includes('OMAHA')) return "Omaha Pot Limit";
  return "Hold'em No Limit";
}

/** Format dollar amount */
function fmt$(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

interface ActionEntry {
  actor?: string;
  action?: string;
  size?: number;
  unit?: string;
  customDescription?: string;
}

/** Convert structured action JSON to PT4 action lines */
function formatActions(actions: any, bb: number, players: Map<string, string>): string[] {
  if (!actions) return [];
  
  // Handle string (legacy)
  if (typeof actions === 'string') {
    return actions.trim() ? [actions] : [];
  }
  
  // Handle array of structured actions
  if (!Array.isArray(actions)) return [];

  const lines: string[] = [];
  for (const a of actions as ActionEntry[]) {
    if (!a || !a.action) continue;
    const actorName = resolveActorName(a.actor, players);
    const action = (a.action || '').toLowerCase();
    const size = a.size || 0;
    const unit = (a.unit || 'BB').toUpperCase();
    const dollarSize = unit === 'BB' ? size * bb : size;

    if (action.includes('fold')) {
      lines.push(`${actorName}: folds`);
    } else if (action.includes('check')) {
      lines.push(`${actorName}: checks`);
    } else if (action.includes('call')) {
      lines.push(`${actorName}: calls ${fmt$(dollarSize)}`);
    } else if (action.includes('raise') || action.includes('3bet') || action.includes('3-bet')) {
      lines.push(`${actorName}: raises ${fmt$(dollarSize)} to ${fmt$(dollarSize)}`);
    } else if (action.includes('bet')) {
      lines.push(`${actorName}: bets ${fmt$(dollarSize)}`);
    } else if (action.includes('all-in') || action.includes('allin') || action.includes('all in')) {
      lines.push(`${actorName}: raises ${fmt$(dollarSize)} to ${fmt$(dollarSize)} and is all-in`);
    } else {
      lines.push(`${actorName}: ${action}${dollarSize > 0 ? ' ' + fmt$(dollarSize) : ''}`);
    }
  }
  return lines;
}

function resolveActorName(actor: string | undefined, players: Map<string, string>): string {
  if (!actor) return 'Hero';
  const lower = actor.toLowerCase();
  if (lower === 'hero' || lower === 'me') return 'Hero';
  return players.get(actor) || actor;
}

// ---- Data fetching ----

export interface SessionWithHandCount {
  id: string;
  start_time: string;
  location: string | null;
  game_type: string;
  format: string;
  hand_count: number;
}

export async function fetchSessionsWithHandCounts(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SessionWithHandCount[]> {
  // Get sessions in date range
  const { data: sessions, error: sessError } = await supabase
    .from('sessions')
    .select('id, start_time, location, game_type, format')
    .eq('user_id', userId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: false });

  if (sessError) throw sessError;
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map(s => s.id);

  // Count hands per session
  const { data: hands, error: handsError } = await supabase
    .from('session_hands_new')
    .select('session_id')
    .eq('user_id', userId)
    .in('session_id', sessionIds);

  if (handsError) throw handsError;

  const countMap: Record<string, number> = {};
  (hands || []).forEach(h => {
    countMap[h.session_id] = (countMap[h.session_id] || 0) + 1;
  });

  return sessions
    .filter(s => (countMap[s.id] || 0) > 0)
    .map(s => ({
      id: s.id,
      start_time: s.start_time,
      location: s.location,
      game_type: s.game_type,
      format: s.format,
      hand_count: countMap[s.id] || 0,
    }));
}

// ---- Core export ----

export async function exportHandHistoryZip(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Blob> {
  // 1. Fetch all hands in date range with session + table info
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, start_time, location, game_type, format, currency, small_blind, big_blind')
    .eq('user_id', userId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString());

  if (!sessions || sessions.length === 0) throw new Error('No sessions found');

  const sessionMap = new Map<string, SessionInfo>();
  sessions.forEach(s => sessionMap.set(s.id, s));
  const sessionIds = sessions.map(s => s.id);

  // Fetch tables
  const { data: tables } = await supabase
    .from('session_tables')
    .select('id, table_name, stakes, game_format, session_id')
    .in('session_id', sessionIds);

  const tableMap = new Map<string, TableInfo>();
  (tables || []).forEach(t => tableMap.set(t.id, t));

  // Fetch all hands
  const { data: allHands, error } = await supabase
    .from('session_hands_new')
    .select('*')
    .eq('user_id', userId)
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!allHands || allHands.length === 0) throw new Error('No hands found');

  // Group hands by session
  const handsBySession = new Map<string, HandRow[]>();
  for (const hand of allHands as HandRow[]) {
    const arr = handsBySession.get(hand.session_id) || [];
    arr.push(hand);
    handsBySession.set(hand.session_id, arr);
  }

  // 2. Generate TXT files
  const zip = new JSZip();

  for (const [sessionId, hands] of handsBySession) {
    const session = sessionMap.get(sessionId);
    if (!session) continue;

    const sessionDate = format(new Date(session.start_time), 'yyyyMMdd');
    const locationSlug = (session.location || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileName = `${sessionDate}_${locationSlug}_${sessionId.substring(0, 8)}.txt`;

    const handTexts = hands.map((hand, idx) =>
      generateHandHistory(hand, session, tableMap.get(hand.table_id || ''), idx + 1)
    );

    zip.file(fileName, handTexts.join('\n\n\n'));
  }

  const startStr = format(startDate, 'yyyyMMdd');
  const endStr = format(endDate, 'yyyyMMdd');

  return zip.generateAsync({ type: 'blob' });
}

export function getExportFileName(startDate: Date, endDate: Date): string {
  return `export_hands_${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.zip`;
}

// ---- Hand history generation ----

function generateHandHistory(
  hand: HandRow,
  session: SessionInfo,
  table: TableInfo | undefined,
  fallbackHandNum: number
): string {
  const lines: string[] = [];
  const handId = uuidToNumericId(hand.id);
  const gameTypeStr = formatGameType(hand.game_type || session.game_type);

  // Blinds: only use if actually stored
  const sbRaw = hand.small_blind ?? session.small_blind;
  const bbRaw = hand.big_blind ?? session.big_blind;
  const hasBlinds = sbRaw != null && bbRaw != null;
  const sb = sbRaw ?? 0;
  const bb = bbRaw ?? 1; // fallback for unit conversion only

  const handDate = hand.created_at
    ? format(new Date(hand.created_at), 'yyyy/MM/dd HH:mm:ss')
    : format(new Date(session.start_time), 'yyyy/MM/dd HH:mm:ss');
  const tableName = table?.table_name || session.location || 'Table1';

  // ---- Header ----
  const blindsStr = hasBlinds ? ` (${fmt$(sb)}/${fmt$(bb)})` : '';
  lines.push(
    `PokerStars Hand #${handId}: ${gameTypeStr}${blindsStr} - ${handDate} ET`
  );
  lines.push(`Table '${tableName}'`);

  // ---- Seats: only real recorded players ----
  const players = new Map<string, string>();
  players.set('Hero', 'Hero');
  players.set('hero', 'Hero');
  players.set('Me', 'Hero');

  // Hero seat
  if (hand.hero_stack_bb != null) {
    const heroStack = hand.hero_stack_bb * bb;
    const seatNum = hand.position ? positionToSeat(hand.position) : 1;
    lines.push(`Seat ${seatNum}: Hero (${fmt$(heroStack)} in chips)`);
  } else if (hand.position) {
    lines.push(`Seat ${positionToSeat(hand.position)}: Hero`);
  }

  // Villains: only if actually recorded
  interface VillainInfo { position?: string; hand?: string; bigBlind?: number; name?: string; }
  let villains: VillainInfo[] = [];
  if (hand.villains) {
    if (Array.isArray(hand.villains)) {
      villains = hand.villains;
    } else if (typeof hand.villains === 'object') {
      villains = [hand.villains as VillainInfo];
    }
  }

  const usedSeats = new Set<number>();
  if (hand.position) usedSeats.add(positionToSeat(hand.position));

  villains.forEach((v, i) => {
    const vName = v.name || `Villain${i + 1}`;
    players.set(vName, vName);
    if (v.position) players.set(v.position, vName);

    let vSeat = v.position ? positionToSeat(v.position) : 0;
    if (vSeat === 0 || usedSeats.has(vSeat)) {
      for (let s = 1; s <= 9; s++) {
        if (!usedSeats.has(s)) { vSeat = s; break; }
      }
    }
    usedSeats.add(vSeat);

    if (v.bigBlind != null) {
      const vStack = v.bigBlind * bb;
      lines.push(`Seat ${vSeat}: ${vName} (${fmt$(vStack)} in chips)`);
    } else {
      lines.push(`Seat ${vSeat}: ${vName}`);
    }
  });

  // NO blind posting lines — we don't store who posted blinds

  // ---- Hole Cards ----
  const holeCards = parseCards(hand.hole_cards);
  if (holeCards.length > 0) {
    lines.push('*** HOLE CARDS ***');
    lines.push(`Dealt to Hero [${holeCards.join(' ')}]`);
  }

  // ---- Position / action tag metadata ----
  if (hand.position && !hand.hole_cards) {
    // If we have position but no cards, note position
    lines.push(`** Hero position: ${hand.position} **`);
  }

  // ---- Preflop ----
  const preflopActions = hand.preflop_actions || hand.preflop_action;
  const preflopLines = formatActionsStrict(preflopActions, bb, players);
  if (preflopLines.length > 0) {
    lines.push(...preflopLines);
  }

  // ---- Flop ----
  const flopCards = parseFlopCards(hand.flop_cards);
  if (flopCards.length >= 3) {
    lines.push(`*** FLOP *** [${flopCards.slice(0, 3).join(' ')}]`);
    const flopLines = formatActionsStrict(hand.flop_actions || hand.flop_action, bb, players);
    if (flopLines.length > 0) lines.push(...flopLines);
  }

  // ---- Turn ----
  if (hand.turn_card) {
    const turnCard = formatCard(hand.turn_card);
    const board = flopCards.slice(0, 3).join(' ');
    lines.push(`*** TURN *** [${board}] [${turnCard}]`);
    const turnLines = formatActionsStrict(hand.turn_actions || hand.turn_action, bb, players);
    if (turnLines.length > 0) lines.push(...turnLines);
  }

  // ---- River ----
  if (hand.river_card) {
    const riverCard = formatCard(hand.river_card);
    const board = [...flopCards.slice(0, 3)];
    if (hand.turn_card) board.push(formatCard(hand.turn_card));
    lines.push(`*** RIVER *** [${board.join(' ')}] [${riverCard}]`);
    const riverLines = formatActionsStrict(hand.river_actions || hand.river_action, bb, players);
    if (riverLines.length > 0) lines.push(...riverLines);
  }

  // ---- Showdown: only if stored ----
  if (hand.showdown_result) {
    lines.push('*** SHOW DOWN ***');
    if (holeCards.length > 0) {
      lines.push(`Hero: shows [${holeCards.join(' ')}]`);
    }
    // Show villain hands if actually recorded
    villains.forEach((v, i) => {
      const vName = v.name || `Villain${i + 1}`;
      if (v.hand) {
        const vCards = parseCards(v.hand);
        if (vCards.length > 0) {
          lines.push(`${vName}: shows [${vCards.join(' ')}]`);
        }
      }
    });
  }

  // ---- Result: only if stored ----
  if (hand.result_value != null) {
    const unit = hand.result_unit || 'BB';
    const sign = hand.result_value >= 0 ? '+' : '';
    lines.push(`** Hero result: ${sign}${hand.result_value} ${unit} **`);
  }

  // ---- Summary ----
  const fullBoard: string[] = [...flopCards.slice(0, 3)];
  if (hand.turn_card) fullBoard.push(formatCard(hand.turn_card));
  if (hand.river_card) fullBoard.push(formatCard(hand.river_card));

  const hasSummaryContent = hand.pot_size != null || fullBoard.length > 0;
  if (hasSummaryContent) {
    lines.push('*** SUMMARY ***');
    if (hand.pot_size != null) {
      const potDollar = hand.result_unit === 'BB' ? hand.pot_size * bb : hand.pot_size;
      lines.push(`Total pot ${fmt$(Math.abs(potDollar))}`);
    }
    if (fullBoard.length > 0) {
      lines.push(`Board [${fullBoard.join(' ')}]`);
    }
  }

  // NO fabricated seat summary lines

  return lines.join('\n');
}

/** Format actions strictly — returns empty array if no real actions stored */
function formatActionsStrict(actions: any, bb: number, players: Map<string, string>): string[] {
  if (!actions) return [];
  if (typeof actions === 'string') {
    const trimmed = actions.trim();
    if (!trimmed || trimmed === '[]') return [];
    return [trimmed];
  }
  if (!Array.isArray(actions) || actions.length === 0) return [];
  return formatActions(actions, bb, players);
}
