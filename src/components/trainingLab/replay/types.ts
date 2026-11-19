export interface RHand {
  id: string; lesson_id?: string; hand_number: number; dealer_seat: number | null; board_cards: string | null;
  pot_total: number; winners: { seat: number; amount: number; desc: string }[] | null;
}
export interface RAction {
  id: string; hand_id: string; seat_number: number; player_id: string | null; street: string; action: string;
  amount: number; pot_after: number | null; sequence: number; revealed_cards: string | null;
}
export interface RNote {
  id: string; hand_id: string | null; action_id: string | null; student_id: string | null; note: string; flag: 'mistake' | 'good_play' | null; created_at: string;
}
export interface RSeatInfo { seat: number; name: string; type: 'student' | 'bot' | 'coach' | 'closed'; player_id: string | null }
export const splitCards = (c?: string | null) => (c || '').match(/../g) || [];
export const r2 = (n: number) => Math.round(n * 100) / 100;
