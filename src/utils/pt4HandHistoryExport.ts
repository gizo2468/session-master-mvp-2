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

/** Format card notation */
function formatCard(card: string): string {
  if (!card || card.length < 2) return '??';
  return card.trim();
}

/** Parse hole cards string into array */
function parseCards(cardsStr: string | null): string[] {
  if (!cardsStr) return [];
  const cleaned = cardsStr.trim();
  if (cleaned.includes(' ')) return cleaned.split(/\s+/).map(formatCard);
  if (cleaned.includes(',')) return cleaned.split(',').map(c => formatCard(c.trim()));
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

/** Short game type label */
function formatGameTypeShort(gameType: string | null): string {
  const gt = (gameType || 'NLH').toUpperCase();
  if (gt.includes('PLO') || gt.includes('OMAHA')) return 'PLO';
  return 'NLH';
}

interface ActionEntry {
  actor?: string;
  action?: string;
  size?: number;
  unit?: string;
  customDescription?: string;
}

/** Convert structured actions to plain-text lines — NO JSON, NO IDs, NO UUIDs */
function formatActionsPlainText(actions: any): string[] {
  if (!actions) return [];

  // If it's a string, try to parse as JSON array first
  if (typeof actions === 'string') {
    const trimmed = actions.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '{}') return [];
    // Attempt JSON parse in case it's a serialised array
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return formatActionsPlainText(parsed);
      if (typeof parsed === 'object' && parsed.action) return formatActionsPlainText([parsed]);
    } catch {
      // Not JSON — treat as a plain description line, strip any UUIDs
      return [`  ${stripIds(trimmed)}`];
    }
    return [`  ${stripIds(trimmed)}`];
  }

  if (!Array.isArray(actions) || actions.length === 0) return [];

  const lines: string[] = [];
  for (const a of actions) {
    if (!a || typeof a !== 'object') continue;
    // Skip entries that are just IDs or have no meaningful action
    const action = a.action || a.customDescription;
    if (!action) continue;

    const actor = resolveActorLabel(a.actor);
    const size = a.size;
    const unit = (a.unit || 'BB').toUpperCase();

    let sizeSuffix = '';
    if (size != null && size > 0) {
      sizeSuffix = unit === 'BB' ? ` ${size}BB` : ` ${size} ${unit.toLowerCase()}`;
    }

    lines.push(`  ${actor}: ${action}${sizeSuffix}`);
  }
  return lines;
}

/** Convert a UUID to a deterministic numeric ID */
function uuidToNumericId(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = ((hash << 5) - hash + hex.charCodeAt(i)) & 0x7fffffff;
  }
  return String(hash || 1);
}

/** Strip UUIDs and common internal ID patterns from a string */
function stripIds(str: string): string {
  // Remove UUIDs (8-4-4-4-12 hex)
  return str.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function resolveActorLabel(actor: string | undefined): string {
  if (!actor) return 'Hero';
  const lower = actor.toLowerCase();
  if (lower === 'hero' || lower === 'me') return 'Hero';
  return actor;
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

  const { data: tables } = await supabase
    .from('session_tables')
    .select('id, table_name, stakes, game_format, session_id')
    .in('session_id', sessionIds);

  const tableMap = new Map<string, TableInfo>();
  (tables || []).forEach(t => tableMap.set(t.id, t));

  const { data: allHands, error } = await supabase
    .from('session_hands_new')
    .select('*')
    .eq('user_id', userId)
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!allHands || allHands.length === 0) throw new Error('No hands found');

  // Generate all hands into a single TXT
  const allHandTexts: string[] = [];
  for (const hand of allHands as HandRow[]) {
    const session = sessionMap.get(hand.session_id);
    if (!session) continue;
    const table = hand.table_id ? tableMap.get(hand.table_id) : undefined;
    allHandTexts.push(generateHandHistory(hand, session, table));
  }

  const startStr = format(startDate, 'yyyyMMdd');
  const endStr = format(endDate, 'yyyyMMdd');

  const zip = new JSZip();
  zip.file(`SessionMaster_Hands_${startStr}_to_${endStr}.txt`, allHandTexts.join('\n\n'));

  return zip.generateAsync({ type: 'blob' });
}

export function getExportFileName(startDate: Date, endDate: Date): string {
  const startStr = format(startDate, 'yyyyMMdd');
  const endStr = format(endDate, 'yyyyMMdd');
  return `SessionMaster_Hands_${startStr}_to_${endStr}.zip`;
}

// ---- SessionMaster HH v1 generation ----

function generateHandHistory(
  hand: HandRow,
  session: SessionInfo,
  table: TableInfo | undefined,
): string {
  const lines: string[] = [];

  // ---- Header ----
  const handId = uuidToNumericId(hand.id);
  lines.push(`SessionMaster Hand #${handId}`);

  // Metadata — only if stored
  if (session.location) {
    lines.push(`Session: ${session.location} (${session.format || 'Unknown'})`);
  }
  if (table?.table_name) {
    lines.push(`Table: ${table.table_name}`);
  }

  const gameLabel = formatGameTypeShort(hand.game_type || session.game_type);
  lines.push(`Game: ${gameLabel}`);

  const sb = hand.small_blind ?? session.small_blind;
  const bb = hand.big_blind ?? session.big_blind;
  if (sb != null && bb != null) {
    lines.push(`Blinds: ${sb}/${bb}`);
  }

  if (hand.hero_stack_bb != null && bb != null) {
    lines.push(`Buy-in: ${hand.hero_stack_bb} BB`);
  }

  if (hand.created_at) {
    lines.push(`Date: ${format(new Date(hand.created_at), 'yyyy-MM-dd HH:mm')}`);
  } else {
    lines.push(`Date: ${format(new Date(session.start_time), 'yyyy-MM-dd HH:mm')}`);
  }

  lines.push(''); // blank line after metadata

  // ---- Hero ----
  const holeCards = parseCards(hand.hole_cards);
  const heroParts: string[] = ['Hero:'];
  if (holeCards.length > 0) heroParts.push(`[${holeCards.join(' ')}]`);
  if (hand.position) heroParts.push(`(${hand.position})`);
  if (hand.hero_stack_bb != null) heroParts.push(`${hand.hero_stack_bb} BB`);
  if (heroParts.length > 1) {
    lines.push(heroParts.join(' '));
  }

  // ---- Villains ----
  interface VillainInfo { position?: string; hand?: string; bigBlind?: number; name?: string; }
  let villains: VillainInfo[] = [];
  if (hand.villains) {
    if (Array.isArray(hand.villains)) {
      villains = hand.villains;
    } else if (typeof hand.villains === 'object') {
      villains = [hand.villains as VillainInfo];
    }
  }

  villains.forEach((v, i) => {
    const vName = v.name || `Villain${villains.length > 1 ? i + 1 : ''}`;
    const parts: string[] = [`${vName}:`];
    if (v.hand) {
      const vCards = parseCards(v.hand);
      if (vCards.length > 0) parts.push(`[${vCards.join(' ')}]`);
    }
    if (v.position) parts.push(`(${v.position})`);
    if (v.bigBlind != null) parts.push(`${v.bigBlind} BB`);
    if (parts.length > 1) {
      lines.push(parts.join(' '));
    }
  });

  // ---- Streets ----
  const preflopLines = formatActionsPlainText(hand.preflop_actions || hand.preflop_action);
  const flopCards = parseFlopCards(hand.flop_cards);
  const flopLines = formatActionsPlainText(hand.flop_actions || hand.flop_action);
  const turnLines = formatActionsPlainText(hand.turn_actions || hand.turn_action);
  const riverLines = formatActionsPlainText(hand.river_actions || hand.river_action);

  const hasAnyActions = preflopLines.length > 0 || flopLines.length > 0 || turnLines.length > 0 || riverLines.length > 0;

  if (!hasAnyActions) {
    lines.push('');
    lines.push('NOTE: No actions were recorded for this hand.');
  } else {
    if (preflopLines.length > 0) {
      lines.push('');
      lines.push('PRE-FLOP');
      lines.push(...preflopLines);
    }
    if (flopCards.length >= 3 && flopLines.length > 0) {
      lines.push(`FLOP [${flopCards.slice(0, 3).join(' ')}]`);
      lines.push(...flopLines);
    } else if (flopCards.length >= 3) {
      lines.push(`FLOP [${flopCards.slice(0, 3).join(' ')}]`);
    }
    if (hand.turn_card) {
      const board = flopCards.slice(0, 3).join(' ');
      const turnCard = formatCard(hand.turn_card);
      if (turnLines.length > 0) {
        lines.push(`TURN [${board}] [${turnCard}]`);
        lines.push(...turnLines);
      } else {
        lines.push(`TURN [${board}] [${turnCard}]`);
      }
    }
    if (hand.river_card) {
      const boardParts = [...flopCards.slice(0, 3)];
      if (hand.turn_card) boardParts.push(formatCard(hand.turn_card));
      const riverCard = formatCard(hand.river_card);
      if (riverLines.length > 0) {
        lines.push(`RIVER [${boardParts.join(' ')}] [${riverCard}]`);
        lines.push(...riverLines);
      } else {
        lines.push(`RIVER [${boardParts.join(' ')}] [${riverCard}]`);
      }
    }
  }

  // ---- Showdown ----
  if (hand.showdown_result && (holeCards.length > 0 || villains.some(v => v.hand))) {
    lines.push('');
    lines.push('SHOWDOWN');
    if (holeCards.length > 0) {
      lines.push(`  Hero: [${holeCards.join(' ')}]`);
    }
    villains.forEach((v, i) => {
      if (v.hand) {
        const vCards = parseCards(v.hand);
        if (vCards.length > 0) {
          const vName = v.name || `Villain${villains.length > 1 ? i + 1 : ''}`;
          lines.push(`  ${vName}: [${vCards.join(' ')}]`);
        }
      }
    });
  }

  // ---- Result ----
  if (hand.result_value != null) {
    const unit = hand.result_unit || 'BB';
    const sign = hand.result_value >= 0 ? '+' : '';
    lines.push('');
    lines.push(`Result: ${sign}${hand.result_value} ${unit}`);
  }

  lines.push('');
  lines.push('---- END HAND ----');

  return lines.join('\n');
}
