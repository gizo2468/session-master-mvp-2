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
  const sb = hand.small_blind ?? session.small_blind ?? 0.5;
  const bb = hand.big_blind ?? session.big_blind ?? 1;
  const handDate = hand.created_at
    ? format(new Date(hand.created_at), 'yyyy/MM/dd HH:mm:ss')
    : format(new Date(session.start_time), 'yyyy/MM/dd HH:mm:ss');
  const tableName = table?.table_name || session.location || 'Table1';
  const handNum = hand.hand_number ?? fallbackHandNum;

  // Build player list
  const heroSeat = positionToSeat(hand.position);
  const heroStack = hand.hero_stack_bb ? hand.hero_stack_bb * bb : 100 * bb;

  // Parse villains
  interface VillainInfo { position?: string; hand?: string; bigBlind?: number; name?: string; }
  let villains: VillainInfo[] = [];
  if (hand.villains) {
    if (Array.isArray(hand.villains)) {
      villains = hand.villains;
    } else if (typeof hand.villains === 'object') {
      villains = [hand.villains as VillainInfo];
    }
  }

  // Build seat assignments
  const players = new Map<string, string>(); // actor key -> display name
  const seats: { seat: number; name: string; stack: number }[] = [];
  seats.push({ seat: heroSeat, name: 'Hero', stack: heroStack });
  players.set('Hero', 'Hero');
  players.set('hero', 'Hero');
  players.set('Me', 'Hero');

  const usedSeats = new Set([heroSeat]);
  villains.forEach((v, i) => {
    const vName = v.name || `Player${i + 2}`;
    let vSeat = v.position ? positionToSeat(v.position) : 0;
    if (vSeat === 0 || usedSeats.has(vSeat)) {
      // Find next available seat
      for (let s = 1; s <= 9; s++) {
        if (!usedSeats.has(s)) { vSeat = s; break; }
      }
    }
    usedSeats.add(vSeat);
    const vStack = v.bigBlind ? v.bigBlind * bb : 100 * bb;
    seats.push({ seat: vSeat, name: vName, stack: vStack });
    players.set(vName, vName);
    if (v.position) players.set(v.position, vName);
  });

  // If no villains, add placeholder opponents
  if (villains.length === 0) {
    for (let i = 2; i <= 6; i++) {
      let seat = i;
      while (usedSeats.has(seat)) seat++;
      if (seat > 9) break;
      usedSeats.add(seat);
      const name = `Player${i}`;
      seats.push({ seat, name, stack: 100 * bb });
      players.set(name, name);
    }
  }

  seats.sort((a, b) => a.seat - b.seat);
  const maxPlayers = Math.max(6, seats.length);

  // Determine button seat (BTN = seat with that position, or first seat)
  const btnSeat = heroSeat === positionToSeat('BTN') ? heroSeat : seats[0].seat;

  // ---- Header ----
  lines.push(
    `PokerStars Hand #${handId}: ${gameTypeStr} (${fmt$(sb)}/${fmt$(bb)}) - ${handDate} ET`
  );
  lines.push(
    `Table '${tableName}' ${maxPlayers}-max Seat #${btnSeat} is the button`
  );

  // Seat lines
  for (const s of seats) {
    lines.push(`Seat ${s.seat}: ${s.name} (${fmt$(s.stack)} in chips)`);
  }

  // Post blinds - find SB and BB players
  const sbPlayer = seats.find(s => s.seat === positionToSeat('SB'))?.name
    || seats.find(s => s.seat !== heroSeat)?.name || 'Player2';
  const bbPlayer = seats.find(s => s.seat === positionToSeat('BB'))?.name
    || seats.find(s => s.name === 'Hero' && heroSeat === 3)?.name || 'Player3';

  lines.push(`${sbPlayer}: posts small blind ${fmt$(sb)}`);
  lines.push(`${bbPlayer}: posts big blind ${fmt$(bb)}`);

  // ---- Hole Cards ----
  lines.push('*** HOLE CARDS ***');
  const holeCards = parseCards(hand.hole_cards);
  const holeStr = holeCards.length > 0 ? holeCards.join(' ') : '?? ??';
  lines.push(`Dealt to Hero [${holeStr}]`);

  // ---- Preflop ----
  const preflopLines = formatActions(hand.preflop_actions || hand.preflop_action, bb, players);
  lines.push(...preflopLines);

  // ---- Flop ----
  const flopCards = parseFlopCards(hand.flop_cards);
  if (flopCards.length >= 3) {
    lines.push(`*** FLOP *** [${flopCards.slice(0, 3).join(' ')}]`);
    const flopLines = formatActions(hand.flop_actions || hand.flop_action, bb, players);
    lines.push(...flopLines);
  }

  // ---- Turn ----
  if (hand.turn_card) {
    const turnCard = formatCard(hand.turn_card);
    const board = flopCards.slice(0, 3).join(' ');
    lines.push(`*** TURN *** [${board}] [${turnCard}]`);
    const turnLines = formatActions(hand.turn_actions || hand.turn_action, bb, players);
    lines.push(...turnLines);
  }

  // ---- River ----
  if (hand.river_card) {
    const riverCard = formatCard(hand.river_card);
    const board = [...flopCards.slice(0, 3)];
    if (hand.turn_card) board.push(formatCard(hand.turn_card));
    lines.push(`*** RIVER *** [${board.join(' ')}] [${riverCard}]`);
    const riverLines = formatActions(hand.river_actions || hand.river_action, bb, players);
    lines.push(...riverLines);
  }

  // ---- Showdown ----
  if (hand.showdown_result) {
    lines.push('*** SHOW DOWN ***');
    const wonAmount = hand.amount_won ?? hand.result_value ?? 0;
    const resultUnit = hand.result_unit || 'BB';
    const wonDollar = resultUnit === 'BB' ? wonAmount * bb : wonAmount;
    
    if (hand.showdown_result.toLowerCase().includes('won') || wonDollar > 0) {
      lines.push(`Hero: shows [${holeStr}]`);
      lines.push(`Hero collected ${fmt$(Math.abs(wonDollar))} from pot`);
    } else {
      lines.push(`Hero: shows [${holeStr}]`);
      lines.push(`Hero lost`);
    }

    // Show villain hands if available
    villains.forEach((v, i) => {
      const vName = v.name || `Player${i + 2}`;
      if (v.hand) {
        const vCards = parseCards(v.hand);
        if (vCards.length > 0) {
          lines.push(`${vName}: shows [${vCards.join(' ')}]`);
        }
      }
    });
  }

  // ---- Summary ----
  const totalPot = hand.pot_size
    ? (hand.result_unit === 'BB' ? (hand.pot_size * bb) : hand.pot_size)
    : (hand.amount_invested ?? 0) + (hand.amount_won ?? 0);
  const fullBoard: string[] = [...flopCards.slice(0, 3)];
  if (hand.turn_card) fullBoard.push(formatCard(hand.turn_card));
  if (hand.river_card) fullBoard.push(formatCard(hand.river_card));

  lines.push('*** SUMMARY ***');
  lines.push(`Total pot ${fmt$(Math.abs(totalPot))} | Rake $0.00`);
  if (fullBoard.length > 0) {
    lines.push(`Board [${fullBoard.join(' ')}]`);
  }

  // Seat summary
  for (const s of seats) {
    const posLabel = seatToPositionLabel(s.seat);
    const posStr = posLabel ? ` (${posLabel})` : '';
    if (s.name === 'Hero') {
      const resultStr = hand.showdown_result?.toLowerCase().includes('won')
        ? `showed [${holeStr}] and won`
        : hand.showdown_result
          ? `showed [${holeStr}] and lost`
          : 'folded';
      lines.push(`Seat ${s.seat}: ${s.name}${posStr} ${resultStr}`);
    } else {
      lines.push(`Seat ${s.seat}: ${s.name}${posStr} folded`);
    }
  }

  return lines.join('\n');
}
