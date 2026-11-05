import { create } from 'zustand';
import { Account, FilterState, ImageLabel, Trade } from '../types';
import { JournalStorage } from '../lib/storage';
import { HubClient } from '../lib/hub';
import { calculatePips, calculateRealizedRR, estimateGrossPnl } from '../lib/calculations';

export type NavigationTab = 'dashboard' | 'journal' | 'calendar' | 'open-trades' | 'propfirm' | 'analytics' | 'settings';

interface JournalState {
  accounts: Account[];
  activeAccountId: string;
  trades: Trade[];
  labels: ImageLabel[];
  activeTab: NavigationTab;
  filters: FilterState;

  // Modals
  isTradeDialogOpen: boolean;
  editingTrade: Trade | null;
  isAccountModalOpen: boolean;
  editingAccount: Account | null;
  isBackupModalOpen: boolean;
  lightboxImage: { url: string; label: string; tradeId?: string } | null;
  isCloseTradeModalOpen: boolean;
  tradeToClose: Trade | null;

  // System & Hub
  isKillSwitched: boolean;
  killSwitchMessage: string;
  updateAvailable: boolean;
  latestVersion: string;

  // Actions
  initialize: () => Promise<void>;
  setActiveAccount: (id: string) => void;
  setActiveTab: (tab: NavigationTab) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  openTradeDialog: (trade?: Trade) => void;
  closeTradeDialog: () => void;
  saveTrade: (trade: Trade) => void;
  deleteTrade: (id: string) => void;

  openCloseTradeModal: (trade: Trade) => void;
  closeCloseTradeModal: () => void;
  confirmCloseTrade: (
    params: number | { exitPrice: number; closedLots?: number; exitTime?: string; customNetPnl?: number },
    legacyExitTime?: string
  ) => void;

  openAccountModal: (account?: Account) => void;
  closeAccountModal: () => void;
  saveAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;

  openLightbox: (img: { url: string; label: string; tradeId?: string }) => void;
  closeLightbox: () => void;
  setBackupModalOpen: (open: boolean) => void;

  toggleKillSwitchSimulation: () => void;
  clearAllData: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  pair: 'ALL',
  direction: 'ALL',
  status: 'ALL',
  session: 'ALL',
  strategy: 'ALL',
  dateRange: 'ALL',
};

export const useJournalStore = create<JournalState>((set, get) => ({
  accounts: [],
  activeAccountId: '',
  trades: [],
  labels: [],
  activeTab: 'dashboard',
  filters: DEFAULT_FILTERS,

  isTradeDialogOpen: false,
  editingTrade: null,
  isAccountModalOpen: false,
  editingAccount: null,
  isBackupModalOpen: false,
  lightboxImage: null,
  isCloseTradeModalOpen: false,
  tradeToClose: null,

  isKillSwitched: false,
  killSwitchMessage: '',
  updateAvailable: false,
  latestVersion: '0.1.0',

  initialize: async () => {
    HubClient.initGlobalErrorHooks();

    // Load data from persistent storage
    const accounts = JournalStorage.getAccounts();
    const activeAccountId = JournalStorage.getActiveAccountId();
    const trades = JournalStorage.getTrades();
    const labels = JournalStorage.getLabels();

    set({ accounts, activeAccountId, trades, labels });

    // Check heartbeat with Central Hub
    try {
      const result = await HubClient.checkHeartbeat();
      if (!result.allowed) {
        set({
          isKillSwitched: true,
          killSwitchMessage: result.message || 'Application Error: The software encountered an unexpected initialization failure (Error 0x8004100E). Please contact developer support.',
        });
      } else {
        set({
          latestVersion: result.latest_version,
          updateAvailable: result.latest_version !== '0.1.0',
        });
      }
    } catch (e) {
      console.warn('Heartbeat check offline:', e);
    }
  },

  setActiveAccount: (id: string) => {
    JournalStorage.setActiveAccountId(id);
    set({ activeAccountId: id });
  },

  setActiveTab: (tab: NavigationTab) => {
    set({ activeTab: tab });
  },

  setFilters: (newFilters: Partial<FilterState>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
  },

  openTradeDialog: (trade?: Trade) => {
    set({
      isTradeDialogOpen: true,
      editingTrade: trade || null,
    });
  },

  closeTradeDialog: () => {
    set({
      isTradeDialogOpen: false,
      editingTrade: null,
    });
  },

  saveTrade: (trade: Trade) => {
    const { trades } = get();
    const isEdit = trades.some((t) => t.id === trade.id);

    if (isEdit) {
      JournalStorage.updateTrade(trade);
    } else {
      JournalStorage.addTrade(trade);
    }

    // Refresh state
    const updatedTrades = JournalStorage.getTrades();
    const updatedAccounts = JournalStorage.getAccounts();
    const updatedLabels = JournalStorage.getLabels();

    set({
      trades: updatedTrades,
      accounts: updatedAccounts,
      labels: updatedLabels,
      isTradeDialogOpen: false,
      editingTrade: null,
    });
  },

  deleteTrade: (id: string) => {
    JournalStorage.deleteTrade(id);
    const updatedTrades = JournalStorage.getTrades();
    const updatedAccounts = JournalStorage.getAccounts();
    set({ trades: updatedTrades, accounts: updatedAccounts });
  },

  openCloseTradeModal: (trade: Trade) => {
    set({ isCloseTradeModalOpen: true, tradeToClose: trade });
  },

  closeCloseTradeModal: () => {
    set({ isCloseTradeModalOpen: false, tradeToClose: null });
  },

  confirmCloseTrade: (
    params: number | { exitPrice: number; closedLots?: number; exitTime?: string; customNetPnl?: number },
    legacyExitTime?: string
  ) => {
    const { tradeToClose } = get();
    if (!tradeToClose) return;

    let exitPrice: number;
    let closedLots: number = tradeToClose.lot_size;
    let exitTime: string = new Date().toISOString();
    let customNetPnl: number | undefined;

    if (typeof params === 'number') {
      exitPrice = params;
      if (legacyExitTime) exitTime = legacyExitTime;
    } else {
      exitPrice = params.exitPrice;
      if (params.closedLots && params.closedLots > 0) closedLots = params.closedLots;
      if (params.exitTime) exitTime = params.exitTime;
      customNetPnl = params.customNetPnl;
    }

    const isPartial = closedLots < tradeToClose.lot_size;
    const pips = calculatePips(tradeToClose.pair, tradeToClose.direction, tradeToClose.entry_price, exitPrice);
    const realized_rr = calculateRealizedRR(
      tradeToClose.direction,
      tradeToClose.entry_price,
      tradeToClose.stop_loss,
      exitPrice
    );
    const gross = estimateGrossPnl(
      tradeToClose.pair,
      tradeToClose.direction,
      closedLots,
      tradeToClose.entry_price,
      exitPrice
    );
    const propCommission = (tradeToClose.commission || 0) * (closedLots / tradeToClose.lot_size);
    const propSwap = (tradeToClose.swap || 0) * (closedLots / tradeToClose.lot_size);
    const net_pnl = customNetPnl !== undefined 
      ? customNetPnl 
      : (gross != null ? Number((gross - propCommission - propSwap).toFixed(2)) : null);

    if (isPartial) {
      // 1. Record the partial exit as a closed trade record
      const partialTrade: Trade = {
        ...tradeToClose,
        id: 'tr_p_' + Math.random().toString(36).substr(2, 9),
        parent_trade_id: tradeToClose.id,
        lot_size: Number(closedLots.toFixed(2)),
        exit_price: exitPrice,
        exit_time: exitTime,
        status: 'CLOSED',
        pips,
        realized_rr,
        gross_pnl: gross,
        net_pnl,
        commission: Number(propCommission.toFixed(2)),
        swap: Number(propSwap.toFixed(2)),
        strategy_tag: tradeToClose.strategy_tag ? `${tradeToClose.strategy_tag} (Partial TP)` : 'Partial TP',
      };
      JournalStorage.addTrade(partialTrade);

      // 2. Reduce the open position remaining lot size
      const remainingLots = Number((tradeToClose.lot_size - closedLots).toFixed(2));
      const updatedOpenTrade: Trade = {
        ...tradeToClose,
        lot_size: remainingLots,
        commission: Number(((tradeToClose.commission || 0) - propCommission).toFixed(2)),
        swap: Number(((tradeToClose.swap || 0) - propSwap).toFixed(2)),
        partial_exits: [
          ...(tradeToClose.partial_exits || []),
          {
            id: partialTrade.id,
            exit_price: exitPrice,
            lot_size: closedLots,
            pips: pips || 0,
            net_pnl: net_pnl || 0,
            exit_time: exitTime,
          }
        ]
      };
      JournalStorage.updateTrade(updatedOpenTrade);
    } else {
      // Full Position Close
      const closedTrade: Trade = {
        ...tradeToClose,
        exit_price: exitPrice,
        exit_time: exitTime,
        status: 'CLOSED',
        pips,
        realized_rr,
        gross_pnl: gross,
        net_pnl,
      };
      JournalStorage.updateTrade(closedTrade);
    }

    const updatedTrades = JournalStorage.getTrades();
    const updatedAccounts = JournalStorage.getAccounts();

    set({
      trades: updatedTrades,
      accounts: updatedAccounts,
      isCloseTradeModalOpen: false,
      tradeToClose: null,
    });
  },

  openAccountModal: (account?: Account) => {
    set({
      isAccountModalOpen: true,
      editingAccount: account || null,
    });
  },

  closeAccountModal: () => {
    set({
      isAccountModalOpen: false,
      editingAccount: null,
    });
  },

  saveAccount: (account: Account) => {
    const { accounts } = get();
    const isEdit = accounts.some((a) => a.id === account.id);

    if (isEdit) {
      JournalStorage.updateAccount(account);
    } else {
      JournalStorage.addAccount(account);
      JournalStorage.setActiveAccountId(account.id);
    }

    set({
      accounts: JournalStorage.getAccounts(),
      activeAccountId: isEdit ? get().activeAccountId : account.id,
      isAccountModalOpen: false,
      editingAccount: null,
    });
  },

  deleteAccount: (id: string) => {
    JournalStorage.deleteAccount(id);
    set({
      accounts: JournalStorage.getAccounts(),
      activeAccountId: JournalStorage.getActiveAccountId(),
      trades: JournalStorage.getTrades(),
    });
  },

  openLightbox: (img: { url: string; label: string; tradeId?: string }) => {
    set({ lightboxImage: img });
  },

  closeLightbox: () => {
    set({ lightboxImage: null });
  },

  setBackupModalOpen: (open: boolean) => {
    set({ isBackupModalOpen: open });
  },

  toggleKillSwitchSimulation: () => {
    const current = HubClient.isSimulatedBlocked();
    HubClient.setSimulatedBlocked(!current);
    const blocked = !current;
    set({
      isKillSwitched: blocked,
      killSwitchMessage: blocked
        ? 'Application Error: The software encountered an unexpected initialization failure (Error 0x8004100E). Please contact developer support.'
        : '',
    });
  },

  clearAllData: () => {
    JournalStorage.clearAllData();
    set({
      accounts: [],
      activeAccountId: '',
      trades: [],
      labels: [],
    });
  },
}));
