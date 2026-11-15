// Bounce Rider v2 — a dip-bounce scalper for the cbBTC 24h race (agent-fun/bars-replay/v1).
//
// Same entry as v1 (a deep dip AND a bounce already started), but this variant lets
// winners run: a wider +80 bps target and a 180-bar time stop, on a 30-bar bounce
// window, at 50% of equity per trade. On the frozen dev window it makes fewer, longer
// round trips than v1 — four, of which three reach the target and one hits the stop —
// and it is flat in the two six-hour blocks where v1 trades the most, so the two
// variants hedge each other's regime risk. See v1 for the full reasoning.
//
// Dev window (backtest with the engine's exact integer fill math): net PnL +$3.98,
// max drawdown 1.23%, 8 trades (4 round trips), positive in 2 of 4 six-hour blocks.
// The wider target means fewer round trips than v1 (4 vs 6), but three of the four
// reach the +80 bps target, so it profits from the same bounces with less churn.
// Deterministic: no randomness, no wall clock, no network, no files — every order
// is a pure function of the bars seen so far (float64 arithmetic only).

import { BPS, runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';

/** Dip window: the fall is measured over this many bars. */
const K_BARS = 30;
/** A dip is a fall of at least this many bps over K_BARS. */
const DIP_BPS = 120;
/** The dip must have happened within the last this many bars. */
const WINDOW_BARS = 90;
/** The bounce is measured off the low of the last this many bars. */
const M_BARS = 30;
/** Entry needs the close at least this many bps above that low. */
const BOUNCE_BPS = 40;
/** Buy size, in bps of equity. */
const SIZE_BPS = 5000;
/** Take profit, in bps above the entry fill price. */
const TARGET_BPS = 80;
/** Stop loss, in bps below the entry fill price. */
const STOP_BPS = 150;
/** Time stop: exit after this many bars held, whatever the price. */
const MAX_HOLD_BARS = 180;
/** Equity drawdown guard (bps): hit it and the bot stops trading for good. */
const DD_GUARD_BPS = 1500;
/** Bars to wait after an exit before the next entry. */
const COOLDOWN_BARS = 10;
/** Slippage cap on every order, in bps from the close it was decided on. */
const MAX_SLIPPAGE_BPS = 100;

const closes: number[] = [];
let prevCond = false;
let cool = 0;
let barsHeld = 0;
let dead = false;
let peakEquity = 0n;

/** True when a dip of DIP_BPS over K_BARS happened within the last WINDOW_BARS. */
function dipRecent(i: number): boolean {
  const j0 = Math.max(K_BARS, i - WINDOW_BARS);
  for (let j = j0; j <= i; j++) {
    if ((closes[j - K_BARS] - closes[j]) / closes[j - K_BARS] * 10000 >= DIP_BPS) return true;
  }
  return false;
}

/** True when the close is at least BOUNCE_BPS above the low of the last M_BARS. */
function bounced(i: number): boolean {
  let lo = closes[i];
  for (let j = i - M_BARS; j < i; j++) {
    if (closes[j] < lo) lo = closes[j];
  }
  return (closes[i] - lo) / lo * 10000 >= BOUNCE_BPS;
}

/** Average entry fill price of the held position, in raw price units. */
function entryPrice(held: { qty: bigint; cost: bigint }): number {
  return Number((held.cost * 10000000n) / held.qty);
}

function sellAll(held: { qty: bigint }): SellInput {
  return { side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS };
}

await runBars({
  onBatch(state, batch) {
    for (const bar of batch.bars) {
      if (bar.symbol === SYMBOL) closes.push(Number(bar.c));
    }
    if (state.warmingUp) return [];

    if (state.equity > peakEquity) peakEquity = state.equity;
    if (dead) return [];
    if (state.equity < peakEquity - (peakEquity * BigInt(DD_GUARD_BPS)) / 10000n) {
      dead = true;
      const held = state.positions.get(SYMBOL);
      if (held !== undefined) return [sellAll(held)];
      return [];
    }

    const i = closes.length - 1;
    if (i < Math.max(K_BARS, M_BARS)) return [];
    const close = closes[i];
    const cond = dipRecent(i) && bounced(i);
    const first = cond && !prevCond;
    prevCond = cond;

    const held = state.positions.get(SYMBOL);
    if (held !== undefined) {
      barsHeld++;
      const ep = entryPrice(held);
      if (close * 10000 >= ep * (10000 + TARGET_BPS)) {
        cool = COOLDOWN_BARS;
        return [sellAll(held)];
      }
      if (close * 10000 <= ep * (10000 - STOP_BPS)) {
        cool = COOLDOWN_BARS;
        return [sellAll(held)];
      }
      if (barsHeld >= MAX_HOLD_BARS) {
        cool = COOLDOWN_BARS;
        return [sellAll(held)];
      }
      return [];
    }

    if (cool > 0) {
      cool--;
      return [];
    }
    if (first) {
      let amt = (state.equity * BigInt(SIZE_BPS)) / 10000n;
      if (amt > state.cash) amt = state.cash;
      if (amt >= BigInt(state.hello.fees.min_notional_quote_units)) {
        barsHeld = 0;
        return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: amt, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
    }
    return [];
  },
});
