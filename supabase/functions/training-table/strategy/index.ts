// Strategy registry: picks the bot brain for a seat's mode. Replace an entry to plug in an external solver.
import { decideBot } from '../bots.ts';
import { decidePreflop } from './preflop.ts';
import { decidePostflop } from './postflop.ts';
import { STANDARD_6MAX } from './presets.ts';
import type { BotMode, Strategy, StrategyContext, StrategyDecision } from './types.ts';
export * from './types.ts';

const styleStrategy: Strategy = {
  decide: ({ s, seat, hole, cfg, rnd }) => {
    const d = decideBot(s, seat, hole, cfg, rnd);
    return { ...d, meta: { mode: 'style', street: s.street, note: s.seats[seat].style || 'tight_aggressive' } };
  },
};

const plo = (ctx: StrategyContext): StrategyDecision | null =>
  ctx.cfg.game_type === 'PLO' && ctx.s.street === 'preflop' ? { ...styleStrategy.decide(ctx) as StrategyDecision, meta: { mode: ctx.bot.mode, street: 'preflop', note: 'PLO preflop (style-based)' } } : null;

const rangeStrategy: Strategy = {
  decide: (ctx) => plo(ctx) ?? (ctx.s.street === 'preflop' ? decidePreflop(ctx, ctx.bot.ranges || STANDARD_6MAX) : decidePostflop(ctx)),
};

const gtoStrategy: Strategy = {
  decide: (ctx) => plo(ctx) ?? (ctx.s.street === 'preflop' ? decidePreflop(ctx, STANDARD_6MAX) : decidePostflop(ctx)),
};

export const STRATEGIES: Record<BotMode, Strategy> = { style: styleStrategy, ranges: rangeStrategy, gto: gtoStrategy };

export const decideStrategy = async (ctx: StrategyContext): Promise<StrategyDecision> =>
  await (STRATEGIES[ctx.bot.mode] || styleStrategy).decide(ctx);
