import { Account, PropFirmStatus, Trade, TradeDirection } from '../types';

/**
 * Returns multiplier to convert price difference into standard pips.
 * - JPY pairs: 2 decimals -> 1 pip = 0.01 (mult = 100)
 * - Gold / XAU: 1 pip = 0.10 (mult = 10)
 * - US30 / NAS100 / Indices: 1 pip = 1.0 (mult = 1)
 * - Standard FX (EURUSD, GBPUSD): 4 decimals -> 1 pip = 0.0001 (mult = 10000)
 */
export function getPipMultiplier(pair: string): number {
  const clean = pair.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.includes('JPY')) return 100;
  if (clean.includes('XAU') || clean.includes('GOLD')) return 10;
  if (clean.includes('US30') || clean.includes('NAS100') || clean.includes('SPX500') || clean.includes('DAX')) return 1;
  if (clean.includes('BTC') || clean.includes('ETH')) return 1;
  return 10000;
}

/**
 * Calculates pip value per lot (rough estimate for 1 standard lot = $10/pip on USD quoted pairs).
 */
export function getPipValuePerLot(pair: string): number {
  const clean = pair.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.includes('XAU') || clean.includes('GOLD')) return 10;
  if (clean.includes('US30') || clean.includes('NAS100')) return 1;
  return 10; // Standard 1 lot ~ $10/pip
}

/**
 * Calculates pips gained or lost based on direction and prices.
 */
export function calculatePips(
  pair: string,
  direction: TradeDirection,
  entry: number,
  exit?: number | null
): number | null {
  if (exit == null || isNaN(exit) || !entry || isNaN(entry)) return null;
  const mult = getPipMultiplier(pair);
  const diff = direction === 'BUY' ? exit - entry : entry - exit;
  return Number((diff * mult).toFixed(1));
}

/**
 * Planned Risk:Reward ratio based on Entry, Stop Loss, and Take Profit.
 */
export function calculatePlannedRR(
  direction: TradeDirection,
  entry: number,
  sl?: number | null,
  tp?: number | null
): number | null {
  if (sl == null || tp == null || !entry) return null;
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk <= 0) return null;

  // Validate that SL is on correct side of trade
  if (direction === 'BUY' && sl >= entry) return null;
  if (direction === 'SELL' && sl <= entry) return null;

  return Number((reward / risk).toFixed(2));
}

/**
 * Realized R:R (R-Multiple) based on actual exit price.
 */
export function calculateRealizedRR(
  direction: TradeDirection,
  entry: number,
  sl?: number | null,
  exit?: number | null
): number | null {
  if (sl == null || exit == null || !entry) return null;
  const risk = Math.abs(entry - sl);
  if (risk <= 0) return null;
  const realizedDiff = direction === 'BUY' ? exit - entry : entry - exit;
  return Number((realizedDiff / risk).toFixed(2));
}

/**
 * Estimate Gross PnL from pips and lot size.
 */
export function estimateGrossPnl(
  pair: string,
  direction: TradeDirection,
  lotSize: number,
  entry: number,
  exit?: number | null
): number | null {
  const pips = calculatePips(pair, direction, entry, exit);
  if (pips == null || !lotSize) return null;
  const pipVal = getPipValuePerLot(pair);
  return Number((pips * pipVal * lotSize).toFixed(2));
}

/**
 * Calculates Prop Firm risk and performance rules for an account.
 */
export function calculatePropFirmStatus(account: Account, trades: Trade[]): PropFirmStatus {
  const starting = account.starting_balance;
  const current = account.current_balance;
  const totalPnl = current - starting;
  const totalPnlPct = Number(((totalPnl / starting) * 100).toFixed(2));

  // Closed trades belonging to this account
  const closedTrades = trades.filter(t => t.account_id === account.id && t.status === 'CLOSED');

  // Daily PnL: trades closed today (local day)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayClosedTrades = closedTrades.filter(t => {
    const time = t.exit_time || t.entry_time;
    return time && time.slice(0, 10) === todayStr;
  });

  const dailyPnl = todayClosedTrades.reduce((acc, t) => acc + (t.net_pnl ?? 0), 0);
  const dailyPnlPct = Number(((dailyPnl / starting) * 100).toFixed(2));

  // Max Daily Loss
  const maxDailyLossPct = account.max_daily_loss_pct ?? 5;
  const maxDailyLossAmount = starting * (maxDailyLossPct / 100);
  // dailyLossRemaining is positive if within limit, negative if breached
  const dailyLossRemaining = maxDailyLossAmount + dailyPnl; // dailyPnl is negative if losing
  const dailyLossBreached = dailyPnl < -maxDailyLossAmount;

  // Max Total Drawdown (relative to starting balance)
  const maxTotalLossPct = account.max_total_loss_pct ?? 10;
  const maxTotalLossAmount = starting * (maxTotalLossPct / 100);
  const totalLossRemaining = maxTotalLossAmount + totalPnl;
  const totalLossBreached = totalPnl < -maxTotalLossAmount;

  // Profit target
  const profitTargetPct = account.profit_target_pct;
  const profitTargetAmount = profitTargetPct ? starting * (profitTargetPct / 100) : undefined;
  const profitTargetRemaining = profitTargetAmount ? Math.max(0, profitTargetAmount - totalPnl) : undefined;
  const profitTargetReached = profitTargetAmount ? totalPnl >= profitTargetAmount : false;

  // Consistency rule: if any single winning trade makes up > consistency_max_trade_pct of total profits
  let consistencyViolation = false;
  let maxSingleTradeProfitPct = 0;
  if (account.consistency_max_trade_pct && totalPnl > 0) {
    const winningTrades = closedTrades.filter(t => (t.net_pnl ?? 0) > 0);
    const maxWin = winningTrades.reduce((max, t) => Math.max(max, t.net_pnl ?? 0), 0);
    if (maxWin > 0) {
      maxSingleTradeProfitPct = Number(((maxWin / totalPnl) * 100).toFixed(1));
      if (maxSingleTradeProfitPct > account.consistency_max_trade_pct) {
        consistencyViolation = true;
      }
    }
  }

  return {
    startingBalance: starting,
    currentBalance: current,
    totalPnl,
    totalPnlPct,
    dailyPnl,
    dailyPnlPct,
    maxDailyLossPct,
    maxDailyLossAmount,
    dailyLossRemaining,
    dailyLossBreached,
    maxTotalLossPct,
    maxTotalLossAmount,
    totalLossRemaining,
    totalLossBreached,
    profitTargetPct,
    profitTargetAmount,
    profitTargetRemaining,
    profitTargetReached,
    consistencyViolation,
    maxSingleTradeProfitPct,
  };
}

/**
 * Format currency with symbol.
 */
export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null || isNaN(amount)) return '$0.00';
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF ',
  };
  const sym = symbols[currency] || '$';
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${sym}${formatted}` : `${sym}${formatted}`;
}
