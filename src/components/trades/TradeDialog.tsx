import React, { useState, useEffect, useRef } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { Trade, TradeDirection, TradeImage, TradeStatus, TradingSession } from '../../types';
import { 
  calculatePips, 
  calculatePlannedRR, 
  calculateRealizedRR, 
  estimateGrossPnl,
  formatCurrency 
} from '../../lib/calculations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Maximize2,
  Zap,
  FileText,
  Camera,
  DollarSign
} from 'lucide-react';

type EntryMethod = 'quick' | 'detailed' | 'visual';

const COMMON_PAIRS = ['EURUSD', 'GBPJPY', 'XAUUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'US30', 'NAS100', 'BTCUSD'];
const SESSIONS: TradingSession[] = ['LONDON', 'NEW_YORK', 'ASIA', 'SYDNEY', 'OVERLAP'];
const STRATEGIES = ['SMC Liquidity Sweep', 'Fair Value Gap', 'Break & Retest', 'Trend Continuation', 'Order Block', 'News Fade'];
const QUICK_IMAGE_LABELS = ['15m Entry Setup', '1h HTF Bias', '4h Market Structure', 'Daily Order Block', 'Trade Execution Slip'];

export const TradeDialog: React.FC = () => {
  const { 
    isTradeDialogOpen, 
    editingTrade, 
    closeTradeDialog, 
    saveTrade, 
    accounts, 
    activeAccountId, 
    openLightbox,
    openAccountModal
  } = useJournalStore();

  const [entryMethod, setEntryMethod] = useState<EntryMethod>('detailed');

  const [accountId, setAccountId] = useState(activeAccountId);
  const [pair, setPair] = useState('EURUSD');
  const [direction, setDirection] = useState<TradeDirection>('BUY');
  const [status, setStatus] = useState<TradeStatus>('CLOSED');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [lotSize, setLotSize] = useState<string>('1.0');
  const [commission, setCommission] = useState<string>('0.00');
  const [swap, setSwap] = useState<string>('0.00');
  
  // Direct PnL Override
  const [isManualPnlOverride, setIsManualPnlOverride] = useState(false);
  const [manualNetPnl, setManualNetPnl] = useState<string>('');

  const [entryTime, setEntryTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [exitTime, setExitTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [session, setSession] = useState<TradingSession>('LONDON');
  const [strategyTag, setStrategyTag] = useState('SMC Liquidity Sweep');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<TradeImage[]>([]);

  // Current screenshot label input state
  const [currentLabelInput, setCurrentLabelInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or populate form
  useEffect(() => {
    if (editingTrade) {
      setAccountId(editingTrade.account_id);
      setPair(editingTrade.pair);
      setDirection(editingTrade.direction);
      setStatus(editingTrade.status);
      setEntryPrice(editingTrade.entry_price.toString());
      setExitPrice(editingTrade.exit_price ? editingTrade.exit_price.toString() : '');
      setStopLoss(editingTrade.stop_loss ? editingTrade.stop_loss.toString() : '');
      setTakeProfit(editingTrade.take_profit ? editingTrade.take_profit.toString() : '');
      setLotSize(editingTrade.lot_size.toString());
      setCommission(editingTrade.commission ? editingTrade.commission.toString() : '0');
      setSwap(editingTrade.swap ? editingTrade.swap.toString() : '0');
      
      if (editingTrade.net_pnl != null) {
        setManualNetPnl(editingTrade.net_pnl.toString());
        setIsManualPnlOverride(true);
      }
      setEntryTime(editingTrade.entry_time.slice(0, 16));
      setExitTime(editingTrade.exit_time ? editingTrade.exit_time.slice(0, 16) : '');
      setSession(editingTrade.session || 'LONDON');
      setStrategyTag(editingTrade.strategy_tag || '');
      setNotes(editingTrade.notes || '');
      setImages(editingTrade.images || []);
      setEntryMethod('detailed');
    } else {
      setAccountId(activeAccountId || accounts[0]?.id || '');
      setPair('EURUSD');
      setDirection('BUY');
      setStatus('CLOSED');
      setEntryPrice('');
      setExitPrice('');
      setStopLoss('');
      setTakeProfit('');
      setLotSize('1.0');
      setCommission('0.00');
      setSwap('0.00');
      setIsManualPnlOverride(false);
      setManualNetPnl('');
      setEntryTime(new Date().toISOString().slice(0, 16));
      setExitTime(new Date().toISOString().slice(0, 16));
      setSession('LONDON');
      setStrategyTag('');
      setNotes('');
      setImages([]);
    }
  }, [editingTrade, isTradeDialogOpen, activeAccountId, accounts]);

  // If exit price is cleared, status automatically switches to OPEN
  useEffect(() => {
    if (!exitPrice.trim() && !isManualPnlOverride) {
      setStatus('OPEN');
    }
  }, [exitPrice, isManualPnlOverride]);

  const activeAccount = accounts.find((a) => a.id === accountId) || accounts[0];

  // Derived Calculations
  const numEntry = parseFloat(entryPrice) || 0;
  const numExit = exitPrice ? parseFloat(exitPrice) : null;
  const numSL = stopLoss ? parseFloat(stopLoss) : null;
  const numTP = takeProfit ? parseFloat(takeProfit) : null;
  const numLots = parseFloat(lotSize) || 0;
  const numComm = parseFloat(commission) || 0;
  const numSwap = parseFloat(swap) || 0;

  const calculatedPips = numExit != null ? calculatePips(pair, direction, numEntry, numExit) : null;
  const calculatedPlannedRR = calculatePlannedRR(direction, numEntry, numSL, numTP);
  const calculatedRealizedRR = numExit != null ? calculateRealizedRR(direction, numEntry, numSL, numExit) : null;
  const calculatedGross = numExit != null ? estimateGrossPnl(pair, direction, numLots, numEntry, numExit) : null;
  const calculatedNet = calculatedGross != null ? Number((calculatedGross - numComm - numSwap).toFixed(2)) : null;

  const displayNetPnl = isManualPnlOverride && manualNetPnl !== ''
    ? parseFloat(manualNetPnl) || 0
    : calculatedNet != null
    ? calculatedNet
    : 0;

  // Handle Clipboard Paste (Ctrl+V) for screenshots
  useEffect(() => {
    if (!isTradeDialogOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                const newImg: TradeImage = {
                  id: 'img_' + Math.random().toString(36).substr(2, 9),
                  trade_id: editingTrade?.id || 'temp',
                  label: currentLabelInput.trim() || 'Trade Execution Chart',
                  data_url: dataUrl,
                  created_at: new Date().toISOString(),
                };
                setImages((prev) => [...prev, newImg]);
                setCurrentLabelInput('');
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isTradeDialogOpen, currentLabelInput, editingTrade]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const defaultLabel = file.name.replace(/\.[^/.]+$/, '') || `Screenshot ${index + 1}`;
          const newImg: TradeImage = {
            id: 'img_' + Math.random().toString(36).substr(2, 9),
            trade_id: editingTrade?.id || 'temp',
            label: currentLabelInput.trim() || defaultLabel,
            data_url: dataUrl,
            created_at: new Date().toISOString(),
          };
          setImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setCurrentLabelInput('');
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair.trim() || !numLots) return;

    // In visual or quick mode, if entry price was omitted but net PnL was typed, default entry to 1.00000
    const finalEntryPrice = numEntry || 1.0;
    const finalStatus: TradeStatus = status === 'OPEN' || (numExit == null && !isManualPnlOverride) ? 'OPEN' : 'CLOSED';
    const finalNetPnl = isManualPnlOverride && manualNetPnl !== ''
      ? parseFloat(manualNetPnl)
      : calculatedNet;

    const tradeToSave: Trade = {
      id: editingTrade ? editingTrade.id : 'tr_' + Math.random().toString(36).substr(2, 9),
      account_id: accountId || activeAccountId,
      pair: pair.toUpperCase().trim(),
      direction,
      entry_price: finalEntryPrice,
      exit_price: finalStatus === 'OPEN' ? null : numExit,
      stop_loss: numSL,
      take_profit: numTP,
      lot_size: numLots,
      planned_rr: calculatedPlannedRR,
      realized_rr: finalStatus === 'OPEN' ? null : calculatedRealizedRR,
      pips: finalStatus === 'OPEN' ? null : calculatedPips,
      gross_pnl: finalStatus === 'OPEN' ? null : calculatedGross,
      net_pnl: finalStatus === 'OPEN' ? null : finalNetPnl,
      commission: numComm,
      swap: numSwap,
      status: finalStatus,
      entry_time: new Date(entryTime).toISOString(),
      exit_time: finalStatus === 'CLOSED' && exitTime ? new Date(exitTime).toISOString() : null,
      session,
      strategy_tag: strategyTag.trim(),
      notes: notes.trim(),
      images,
      created_at: editingTrade ? editingTrade.created_at : new Date().toISOString(),
    };

    saveTrade(tradeToSave);
  };

  if (!isTradeDialogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-[#131417] border border-[#26282f] rounded-[6px] w-full max-w-4xl max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col select-none">
        {/* Top Header & 3 Method Switchers */}
        <div className="px-4 py-3 border-b border-[#26282f] flex flex-wrap items-center justify-between sticky top-0 bg-[#0c0d0e] z-20 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#fafafa] font-mono tracking-tight">
              {editingTrade ? 'Edit Trade' : 'New Trade Entry'}
            </span>

            {/* 3 Entry Methods Segmented Controller */}
            <div className="flex items-center gap-1 p-0.5 bg-[#181a1e] border border-[#26282f] rounded-[4px]">
              <button
                type="button"
                onClick={() => setEntryMethod('quick')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-[3px] transition cursor-pointer ${
                  entryMethod === 'quick'
                    ? 'bg-[#fafafa] text-[#0c0d0e] font-bold shadow-sm'
                    : 'text-[#a1a1aa] hover:text-[#ededed]'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Quick Log</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryMethod('detailed')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-[3px] transition cursor-pointer ${
                  entryMethod === 'detailed'
                    ? 'bg-[#fafafa] text-[#0c0d0e] font-bold shadow-sm'
                    : 'text-[#a1a1aa] hover:text-[#ededed]'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Detailed</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryMethod('visual')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-[3px] transition cursor-pointer ${
                  entryMethod === 'visual'
                    ? 'bg-[#fafafa] text-[#0c0d0e] font-bold shadow-sm'
                    : 'text-[#a1a1aa] hover:text-[#ededed]'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>Visual / Paste</span>
              </button>
            </div>
          </div>

          <button
            onClick={closeTradeDialog}
            className="p-1 rounded-[3px] text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#181a1e] border border-transparent hover:border-[#26282f] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning if no accounts configured */}
        {accounts.length === 0 && (
          <div className="bg-[#f59e0b]/10 border-b border-[#f59e0b]/20 px-4 py-2 flex items-center justify-between text-xs text-[#f59e0b]">
            <span>No trading accounts found. Please create an account first.</span>
            <button
              onClick={() => {
                closeTradeDialog();
                openAccountModal();
              }}
              className="underline font-semibold cursor-pointer"
            >
              Create Account
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ========================================================= */}
          {/* METHOD 1: QUICK LOG FORM (Minimalist, 3-second logging) */}
          {/* ========================================================= */}
          {entryMethod === 'quick' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Account & Status Header Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Execution Status</label>
                  <div className="grid grid-cols-2 gap-1.5 h-8">
                    <button
                      type="button"
                      onClick={() => setStatus('OPEN')}
                      className={`text-xs font-mono font-medium rounded-[4px] border transition cursor-pointer ${
                        status === 'OPEN'
                          ? 'bg-[#181a1e] text-[#f59e0b] border-[#f59e0b]'
                          : 'bg-[#131417] text-[#71717a] border-[#26282f]'
                      }`}
                    >
                      Running (Open)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('CLOSED')}
                      className={`text-xs font-mono font-medium rounded-[4px] border transition cursor-pointer ${
                        status === 'CLOSED'
                          ? 'bg-[#181a1e] text-[#10b981] border-[#10b981]'
                          : 'bg-[#131417] text-[#71717a] border-[#26282f]'
                      }`}
                    >
                      Closed
                    </button>
                  </div>
                </div>
              </div>

              {/* Pair & Direction */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Symbol / Pair</label>
                  <input
                    type="text"
                    required
                    value={pair}
                    onChange={(e) => setPair(e.target.value.toUpperCase())}
                    placeholder="e.g. EURUSD, XAUUSD"
                    className="w-full h-9 px-3 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#fafafa] font-mono font-bold uppercase focus:border-[#fafafa] focus:outline-none mb-1.5"
                  />
                  {/* Quick Select Chips */}
                  <div className="flex flex-wrap gap-1">
                    {COMMON_PAIRS.slice(0, 6).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPair(p)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-[3px] border transition cursor-pointer ${
                          pair === p
                            ? 'bg-[#fafafa] text-[#0c0d0e] font-bold border-[#fafafa]'
                            : 'bg-[#181a1e] text-[#71717a] border-[#26282f] hover:text-[#ededed]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Direction</label>
                  <div className="grid grid-cols-2 gap-1.5 h-9">
                    <button
                      type="button"
                      onClick={() => setDirection('BUY')}
                      className={`text-xs font-mono font-bold rounded-[4px] border transition cursor-pointer ${
                        direction === 'BUY'
                          ? 'bg-[#10b981] text-[#0c0d0e] border-[#10b981]'
                          : 'bg-[#181a1e] text-[#71717a] border-[#26282f]'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('SELL')}
                      className={`text-xs font-mono font-bold rounded-[4px] border transition cursor-pointer ${
                        direction === 'SELL'
                          ? 'bg-[#f43f5e] text-[#fafafa] border-[#f43f5e]'
                          : 'bg-[#181a1e] text-[#71717a] border-[#26282f]'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                </div>
              </div>

              {/* Lot Size, Entry Price & Exit Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Lot Size</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                    placeholder="1.0"
                    className="w-full h-9 px-3 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="e.g. 1.08500"
                    className="w-full h-9 px-3 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">
                    {status === 'OPEN' ? 'Target Price (Optional)' : 'Exit Price'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder={status === 'OPEN' ? 'Leave empty if running' : 'e.g. 1.08950'}
                    className="w-full h-9 px-3 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dollar Profit ($) Direct Input or Live Calculated Outcome */}
              <div className="p-3.5 bg-[#0f1013] border border-[#26282f] rounded-[4px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#a1a1aa]" />
                    <span className="text-xs font-mono font-medium text-[#ededed]">Profit / Loss (in Dollars)</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] font-mono text-[#71717a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isManualPnlOverride}
                      onChange={(e) => setIsManualPnlOverride(e.target.checked)}
                      className="rounded bg-[#181a1e] border-[#26282f] accent-[#fafafa]"
                    />
                    <span>Manual $ Override</span>
                  </label>
                </div>

                {isManualPnlOverride ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-[#71717a]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={manualNetPnl}
                      onChange={(e) => setManualNetPnl(e.target.value)}
                      placeholder="e.g. 450.00 or -120.00"
                      className="w-full h-8 pl-7 pr-3 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#fafafa] font-mono font-bold focus:border-[#fafafa] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#71717a]">Calculated Net Return:</span>
                    <span className={`text-sm font-bold tabular-nums ${
                      displayNetPnl > 0 ? 'text-[#10b981]' : displayNetPnl < 0 ? 'text-[#f43f5e]' : 'text-[#a1a1aa]'
                    }`}>
                      {formatCurrency(displayNetPnl, activeAccount?.currency)}
                      {calculatedPips != null && (
                        <span className="text-xs text-[#71717a] ml-1.5 font-normal">
                          ({calculatedPips >= 0 ? `+${calculatedPips}` : calculatedPips} pips)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Note */}
              <div>
                <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Quick Note (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Fast scalp on 1m rejection of daily open"
                  className="w-full h-8 px-3 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-sans focus:border-[#fafafa] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* METHOD 2: DETAILED INSTITUTIONAL FORM (Full SMC Confluence) */}
          {/* ========================================================= */}
          {entryMethod === 'detailed' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column (7 cols): Parameters & Pricing */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* Account & Session */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Target Account</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full h-8 px-2.5 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type === 'PROP_FIRM' ? 'Prop' : 'Live'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Market Session</label>
                    <select
                      value={session}
                      onChange={(e) => setSession(e.target.value as TradingSession)}
                      className="w-full h-8 px-2.5 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                    >
                      {SESSIONS.map((s) => (
                        <option key={s} value={s}>{s} SESSION</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pair & Direction */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Pair / Ticker</label>
                    <input
                      type="text"
                      required
                      value={pair}
                      onChange={(e) => setPair(e.target.value.toUpperCase())}
                      className="w-full h-8 px-3 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#fafafa] font-mono font-bold uppercase focus:border-[#fafafa] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Direction</label>
                    <div className="grid grid-cols-2 gap-1.5 h-8">
                      <button
                        type="button"
                        onClick={() => setDirection('BUY')}
                        className={`text-xs font-mono font-bold rounded-[3px] border transition cursor-pointer ${
                          direction === 'BUY'
                            ? 'bg-[#10b981] text-[#0c0d0e] border-[#10b981]'
                            : 'bg-[#181a1e] text-[#71717a] border-[#26282f]'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirection('SELL')}
                        className={`text-xs font-mono font-bold rounded-[3px] border transition cursor-pointer ${
                          direction === 'SELL'
                            ? 'bg-[#f43f5e] text-[#fafafa] border-[#f43f5e]'
                            : 'bg-[#181a1e] text-[#71717a] border-[#26282f]'
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Execution Price Matrix */}
                <div className="p-3 bg-[#0c0d0e] border border-[#26282f] rounded-[4px] space-y-2.5">
                  <div className="text-[10px] font-mono uppercase text-[#71717a] tracking-wider font-semibold">
                    Price Matrix & Execution
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-[#71717a] mb-0.5">Entry Price</label>
                      <input
                        type="number"
                        step="any"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        placeholder="1.0850"
                        className="w-full h-7 px-2 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#71717a] mb-0.5">Stop Loss</label>
                      <input
                        type="number"
                        step="any"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        placeholder="1.0830"
                        className="w-full h-7 px-2 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#71717a] mb-0.5">Take Profit</label>
                      <input
                        type="number"
                        step="any"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        placeholder="1.0910"
                        className="w-full h-7 px-2 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#71717a] mb-0.5">Exit Price</label>
                      <input
                        type="number"
                        step="any"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        placeholder="Optional"
                        className="w-full h-7 px-2 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Lot size, commission, swap */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#181a1e]">
                    <div>
                      <label className="block text-[10px] font-mono text-[#71717a] mb-0.5">Lot Volume</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lotSize}
                        onChange={(e) => setLotSize(e.target.value)}
                        className="w-full h-7 px-2 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#71717a] mb-0.5">Commission ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        className="w-full h-7 px-2 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#71717a] mb-0.5">Swap ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={swap}
                        onChange={(e) => setSwap(e.target.value)}
                        className="w-full h-7 px-2 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Strategy Model & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Strategy / Model</label>
                    <input
                      type="text"
                      list="strategy-options-list"
                      placeholder="e.g. SMC Liquidity Sweep, FVG..."
                      value={strategyTag}
                      onChange={(e) => setStrategyTag(e.target.value)}
                      className="w-full h-8 px-2.5 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-sans focus:border-[#fafafa] focus:outline-none placeholder:text-[#52525b]"
                    />
                    <datalist id="strategy-options-list">
                      {STRATEGIES.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Entry Timestamp</label>
                    <input
                      type="datetime-local"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="w-full h-8 px-2 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-mono focus:border-[#fafafa] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Detailed Notes */}
                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Trade Rationale & Confluences</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="HTF liquidity pool swept, 15m MSS with displacement..."
                    className="w-full p-2.5 bg-[#181a1e] border border-[#26282f] rounded-[4px] text-xs text-[#ededed] font-sans focus:border-[#fafafa] focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Right Column (5 cols): Live Telemetry & Screenshot Manager */}
              <div className="lg:col-span-5 space-y-3.5">
                {/* Live Calculated Stats HUD */}
                <div className="p-3 bg-[#0c0d0e] border border-[#26282f] rounded-[4px] space-y-2 font-mono text-xs">
                  <div className="text-[10px] uppercase text-[#71717a] tracking-wider font-semibold">
                    Live Trade Analytics
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#71717a]">Planned R:R</span>
                    <span className="text-[#ededed] font-semibold">{calculatedPlannedRR != null ? `${calculatedPlannedRR}R` : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#71717a]">Realized R:R</span>
                    <span className={`font-semibold ${
                      (calculatedRealizedRR ?? 0) >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'
                    }`}>
                      {calculatedRealizedRR != null ? `${calculatedRealizedRR}R` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#71717a]">Pips Made</span>
                    <span className="text-[#ededed] font-semibold">
                      {calculatedPips != null ? `${calculatedPips >= 0 ? `+${calculatedPips}` : calculatedPips} pips` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-[#181a1e]">
                    <span className="text-[#a1a1aa] font-semibold">Net P&L ($)</span>
                    <span className={`text-sm font-bold tabular-nums ${
                      displayNetPnl >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'
                    }`}>
                      {formatCurrency(displayNetPnl, activeAccount?.currency)}
                    </span>
                  </div>
                </div>

                {/* Screenshots Manager */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-[#a1a1aa]">Attached Screenshots</label>
                    <span className="text-[10px] font-mono text-[#71717a]">{images.length} images</span>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-[#26282f] hover:border-[#ededed]/50 bg-[#0c0d0e] hover:bg-[#131417] p-3 rounded-[4px] text-center cursor-pointer transition select-none group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 mx-auto text-[#71717a] group-hover:text-[#fafafa] mb-1 transition-colors" />
                    <span className="text-xs text-[#fafafa] font-mono group-hover:underline">
                      Browse Images
                    </span>
                    <span className="text-xs text-[#71717a]"> or paste (Ctrl+V)</span>
                    <p className="text-[10px] text-[#71717a] mt-0.5">Click anywhere to select one or more images</p>
                  </div>

                  {/* Thumbnail Previews */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                      {images.map((img) => (
                        <div key={img.id} className="relative group rounded-[3px] overflow-hidden border border-[#26282f] bg-[#0c0d0e]">
                          <img src={img.data_url} alt={img.label} className="w-full h-16 object-cover" />
                          
                          {/* Centered Fullscreen Button */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox({ url: img.data_url, label: img.label });
                              }}
                              className="p-1.5 rounded-[4px] bg-[#181a1e]/95 text-[#fafafa] hover:bg-[#26282f] border border-[#26282f] shadow-lg transition transform hover:scale-110"
                              title="Fullscreen Preview"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Delete Button in Top-Right Corner */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(img.id);
                            }}
                            className="absolute top-1 right-1 p-1 rounded-[3px] bg-[#0c0d0e]/90 text-[#f43f5e] hover:bg-[#f43f5e]/25 border border-[#26282f] opacity-0 group-hover:opacity-100 transition z-10"
                            title="Delete Screenshot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          <div className="px-1.5 py-0.5 text-[9px] font-mono text-[#a1a1aa] truncate bg-[#131417] relative z-10">
                            {img.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* METHOD 3: VISUAL / PASTE FIRST FORM (Screenshot & Slip) */}
          {/* ========================================================= */}
          {entryMethod === 'visual' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Primary Screenshot Drag & Drop / Paste Target */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#363943] hover:border-[#ededed] bg-[#0c0d0e] hover:bg-[#131417] p-6 rounded-[6px] text-center transition cursor-pointer"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <Camera className="w-8 h-8 text-[#a1a1aa] mx-auto mb-2" />
                <h3 className="text-xs font-mono font-semibold text-[#fafafa] mb-1">
                  Paste Trade Screenshot (Ctrl + V) or Click to Upload
                </h3>
                <p className="text-[11px] text-[#71717a] max-w-sm mx-auto">
                  Drag and drop TradingView markups, MetaTrader slips, or cTrader execution receipts directly here.
                </p>
              </div>

              {/* Uploaded Gallery Thumbnails with Label Tagger */}
              {images.length > 0 && (
                <div className="space-y-2 p-3 bg-[#0c0d0e] border border-[#26282f] rounded-[4px]">
                  <div className="flex items-center justify-between text-xs font-mono text-[#a1a1aa]">
                    <span>Attached Charts ({images.length})</span>
                    <span className="text-[10px] text-[#71717a]">Click image to inspect full size</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative group rounded-[4px] border border-[#26282f] bg-[#181a1e] overflow-hidden">
                        <img
                          src={img.data_url}
                          alt={img.label}
                          onClick={() => openLightbox({ url: img.data_url, label: img.label })}
                          className="w-full h-24 object-cover cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 p-1 rounded bg-[#0c0d0e]/80 text-[#f43f5e] opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="p-1 text-[10px] font-mono text-[#ededed] truncate">
                          {img.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rapid Slip Fields */}
              <div className="p-4 bg-[#0f1013] border border-[#26282f] rounded-[4px] space-y-3 font-mono">
                <div className="text-[10px] uppercase tracking-wider text-[#71717a] font-semibold">
                  Ticket Data from Slip
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] mb-1">Symbol</label>
                    <input
                      type="text"
                      required
                      value={pair}
                      onChange={(e) => setPair(e.target.value.toUpperCase())}
                      className="w-full h-8 px-2.5 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#fafafa] font-bold uppercase focus:border-[#fafafa] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] mb-1">Direction</label>
                    <div className="grid grid-cols-2 gap-1 h-8">
                      <button
                        type="button"
                        onClick={() => setDirection('BUY')}
                        className={`text-xs font-bold rounded-[3px] border transition cursor-pointer ${
                          direction === 'BUY'
                            ? 'bg-[#10b981] text-[#0c0d0e] border-[#10b981]'
                            : 'bg-[#181a1e] text-[#71717a] border-[#26282f]'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirection('SELL')}
                        className={`text-xs font-bold rounded-[3px] border transition cursor-pointer ${
                          direction === 'SELL'
                            ? 'bg-[#f43f5e] text-[#fafafa] border-[#f43f5e]'
                            : 'bg-[#181a1e] text-[#71717a] border-[#26282f]'
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] mb-1">Net Profit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualNetPnl}
                      onChange={(e) => {
                        setManualNetPnl(e.target.value);
                        setIsManualPnlOverride(true);
                        setStatus('CLOSED');
                      }}
                      placeholder="e.g. 540.00"
                      className="w-full h-8 px-2.5 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#fafafa] font-bold focus:border-[#fafafa] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] mb-1">Lot Size</label>
                    <input
                      type="number"
                      step="0.01"
                      value={lotSize}
                      onChange={(e) => setLotSize(e.target.value)}
                      className="w-full h-8 px-2.5 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] focus:border-[#fafafa] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] mb-1">Chart Label Tag</label>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_IMAGE_LABELS.slice(0, 3).map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setCurrentLabelInput(lbl)}
                          className="text-[10px] px-2 py-0.5 rounded-[3px] bg-[#181a1e] text-[#71717a] hover:text-[#ededed] border border-[#26282f]"
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1">Slip Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Clean TP hit during NY Open continuation"
                    className="w-full h-8 px-2.5 bg-[#181a1e] border border-[#26282f] rounded-[3px] text-xs text-[#ededed] font-sans focus:border-[#fafafa] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="pt-3 border-t border-[#26282f] flex items-center justify-between sticky bottom-0 bg-[#131417] py-2">
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="xs">
                MODE: {entryMethod.toUpperCase()}
              </Badge>
              {displayNetPnl !== 0 && (
                <span className={`text-xs font-mono font-bold ${
                  displayNetPnl > 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'
                }`}>
                  {formatCurrency(displayNetPnl, activeAccount?.currency)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={closeTradeDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="xs"
              >
                {editingTrade ? 'Update Trade' : 'Log Trade'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
