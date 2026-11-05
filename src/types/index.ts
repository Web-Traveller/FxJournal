export type AccountType = 'PERSONAL' | 'PROP_FIRM';
export type TradeDirection = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED';
export type TradingSession = 'LONDON' | 'NEW_YORK' | 'ASIA' | 'SYDNEY' | 'OVERLAP';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  starting_balance: number;
  current_balance: number;
  max_total_loss_pct?: number;  // e.g. 10 (%)
  max_daily_loss_pct?: number;  // e.g. 5 (%)
  profit_target_pct?: number;   // e.g. 8 (%)
  consistency_max_trade_pct?: number; // e.g. 30 (%)
  is_active: boolean;
  created_at: string;
}

export interface TradeImage {
  id: string;
  trade_id: string;
  label: string;
  data_url: string; // Base64 or local file path
  created_at: string;
}

export interface Trade {
  id: string;
  account_id: string;
  pair: string;                 // EURUSD, GBPJPY, XAUUSD, etc.
  direction: TradeDirection;
  entry_price: number;
  exit_price?: number | null;   // null = OPEN trade
  stop_loss?: number | null;
  take_profit?: number | null;
  lot_size: number;
  planned_rr?: number | null;
  realized_rr?: number | null;
  pips?: number | null;
  gross_pnl?: number | null;
  net_pnl?: number | null;      // Realized P&L
  commission?: number;
  swap?: number;
  status: TradeStatus;
  entry_time: string;
  exit_time?: string | null;
  session?: TradingSession;
  strategy_tag?: string;
  notes?: string;
  images: TradeImage[];
  parent_trade_id?: string;
  partial_exits?: Array<{
    id: string;
    exit_price: number;
    lot_size: number;
    pips: number;
    net_pnl: number;
    exit_time: string;
  }>;
  created_at: string;
}

export interface ImageLabel {
  name: string;
  usage_count: number;
}

export interface HeartbeatResult {
  allowed: boolean;
  latest_version: string;
  launch_count: number;
  message?: string;
}

export interface FilterState {
  search: string;
  pair: string;
  direction: 'ALL' | 'BUY' | 'SELL';
  status: 'ALL' | 'OPEN' | 'CLOSED';
  session: 'ALL' | TradingSession;
  strategy: string;
  dateRange: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
}

export interface PropFirmStatus {
  startingBalance: number;
  currentBalance: number;
  totalPnl: number;
  totalPnlPct: number;
  dailyPnl: number;
  dailyPnlPct: number;
  maxDailyLossPct: number;
  maxDailyLossAmount: number;
  dailyLossRemaining: number;
  dailyLossBreached: boolean;
  maxTotalLossPct: number;
  maxTotalLossAmount: number;
  totalLossRemaining: number;
  totalLossBreached: boolean;
  profitTargetPct?: number;
  profitTargetAmount?: number;
  profitTargetRemaining?: number;
  profitTargetReached?: boolean;
  consistencyViolation?: boolean;
  maxSingleTradeProfitPct?: number;
}
