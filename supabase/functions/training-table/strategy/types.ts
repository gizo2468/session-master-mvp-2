import type { ActionType, Config, TableState } from '../engine.ts';
import type { RangeSet } from './rangeCore.ts';

export type BotMode = 'style' | 'ranges' | 'gto';
export interface BotConfig { mode: BotMode; ranges?: RangeSet | null; template_name?: string | null }
export interface BotMeta { mode: BotMode; street: string; situation?: string; hand?: string; freq?: { r: number; c: number; f: number }; equity?: number; note?: string }
export interface StrategyDecision { action: ActionType; amount: number; meta: BotMeta }
export interface StrategyContext { s: TableState; seat: number; hole: string[]; cfg: Config; bot: BotConfig; rnd: () => number }
/** Pluggable bot brain. Swap an implementation (e.g. an external solver API) without touching the game engine. */
export interface Strategy { decide(ctx: StrategyContext): StrategyDecision | Promise<StrategyDecision> }

/** Cryptographically random 0..1 for mixed strategies. */
export const cryptoRnd = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
