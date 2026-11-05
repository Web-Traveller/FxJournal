import { Account, ImageLabel, Trade } from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'fxjournal_accounts',
  TRADES: 'fxjournal_trades',
  LABELS: 'fxjournal_labels',
  ACTIVE_ACCOUNT: 'fxjournal_active_account_id',
};

const INITIAL_ACCOUNTS: Account[] = [];

const INITIAL_TRADES: Trade[] = [];

const INITIAL_LABELS: ImageLabel[] = [];

export class JournalStorage {
  // Accounts
  static getAccounts(): Account[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ACCOUNTS;
    }
  }

  static saveAccounts(accounts: Account[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  static getActiveAccountId(): string {
    const accounts = this.getAccounts();
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
    if (active && accounts.some(a => a.id === active)) {
      return active;
    }
    const fallback = accounts[0]?.id || '';
    if (fallback) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, fallback);
    }
    return fallback;
  }

  static setActiveAccountId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, id);
  }

  static addAccount(account: Account): void {
    const accounts = this.getAccounts();
    accounts.push(account);
    this.saveAccounts(accounts);
  }

  static updateAccount(account: Account): void {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    if (index !== -1) {
      accounts[index] = account;
      this.saveAccounts(accounts);
    }
  }

  static deleteAccount(id: string): void {
    let accounts = this.getAccounts();
    accounts = accounts.filter(a => a.id !== id);
    this.saveAccounts(accounts);

    // Also delete trades belonging to that account
    let trades = this.getTrades();
    trades = trades.filter(t => t.account_id !== id);
    this.saveTrades(trades);

    if (this.getActiveAccountId() === id && accounts.length > 0) {
      this.setActiveAccountId(accounts[0].id);
    }
  }

  // Trades
  static getTrades(): Trade[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRADES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(INITIAL_TRADES));
      return INITIAL_TRADES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRADES;
    }
  }

  static saveTrades(trades: Trade[]): void {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    // Recalculate account balances
    this.recomputeAccountBalances(trades);
  }

  static addTrade(trade: Trade): void {
    const trades = this.getTrades();
    trades.unshift(trade);
    this.saveTrades(trades);

    // Record label usages
    if (trade.images) {
      trade.images.forEach(img => {
        if (img.label) this.recordLabelUsage(img.label);
      });
    }
  }

  static updateTrade(trade: Trade): void {
    const trades = this.getTrades();
    const idx = trades.findIndex(t => t.id === trade.id);
    if (idx !== -1) {
      trades[idx] = trade;
      this.saveTrades(trades);

      if (trade.images) {
        trade.images.forEach(img => {
          if (img.label) this.recordLabelUsage(img.label);
        });
      }
    }
  }

  static deleteTrade(id: string): void {
    let trades = this.getTrades();
    trades = trades.filter(t => t.id !== id);
    this.saveTrades(trades);
  }

  // Labels Autocomplete & Tracking
  static getLabels(): ImageLabel[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LABELS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(INITIAL_LABELS));
      return INITIAL_LABELS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LABELS;
    }
  }

  static recordLabelUsage(labelName: string): void {
    const clean = labelName.trim();
    if (!clean) return;
    const labels = this.getLabels();
    const existing = labels.find(l => l.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      existing.usage_count += 1;
    } else {
      labels.push({ name: clean, usage_count: 1 });
    }
    labels.sort((a, b) => b.usage_count - a.usage_count);
    localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
  }

  // Automatically sync account current_balance from closed trades net_pnl
  static recomputeAccountBalances(trades: Trade[]): void {
    const accounts = this.getAccounts();
    accounts.forEach(acc => {
      const closedTrades = trades.filter(t => t.account_id === acc.id && t.status === 'CLOSED');
      const totalPnl = closedTrades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
      acc.current_balance = Number((acc.starting_balance + totalPnl).toFixed(2));
    });
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  // 1-Click Backup Export
  static exportFullBackup(): string {
    const data = {
      app: 'FxJournal',
      version: '0.1.0',
      exported_at: new Date().toISOString(),
      accounts: this.getAccounts(),
      trades: this.getTrades(),
      labels: this.getLabels(),
    };
    return JSON.stringify(data, null, 2);
  }

  // 1-Click Backup Import / Restore
  static importFullBackup(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.accounts || !parsed.trades) {
        throw new Error('Invalid backup file format');
      }
      this.saveAccounts(parsed.accounts);
      this.saveTrades(parsed.trades);
      if (parsed.accounts && parsed.accounts.length > 0) {
        this.setActiveAccountId(parsed.accounts[0].id);
      }
      this.recomputeAccountBalances(parsed.trades);
      if (parsed.labels) {
        localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(parsed.labels));
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }

  // Wipe all data cleanly
  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.TRADES);
    localStorage.removeItem(STORAGE_KEYS.LABELS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
  }
}
