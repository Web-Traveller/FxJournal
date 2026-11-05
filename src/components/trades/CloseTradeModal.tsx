import React, { useState, useEffect } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { calculatePips, calculateRealizedRR, estimateGrossPnl, formatCurrency } from '../../lib/calculations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { X, CheckCircle2, DollarSign, Split } from 'lucide-react';

export const CloseTradeModal: React.FC = () => {
  const { isCloseTradeModalOpen, tradeToClose, closeCloseTradeModal, confirmCloseTrade, accounts } = useJournalStore();
  const [exitPrice, setExitPrice] = useState<string>('');
  const [exitTime, setExitTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [isPartial, setIsPartial] = useState(false);
  const [closedLots, setClosedLots] = useState<string>('1.00');
  const [customNetPnl, setCustomNetPnl] = useState<string>('');
  const [isCustomPnl, setIsCustomPnl] = useState(false);

  useEffect(() => {
    if (tradeToClose) {
      setExitPrice(tradeToClose.take_profit ? tradeToClose.take_profit.toString() : '');
      setExitTime(new Date().toISOString().slice(0, 16));
      setIsPartial(false);
      // Default partial lots to half
      const half = (tradeToClose.lot_size / 2).toFixed(2);
      setClosedLots(half === '0.00' ? tradeToClose.lot_size.toString() : half);
      setIsCustomPnl(false);
      setCustomNetPnl('');
    }
  }, [tradeToClose, isCloseTradeModalOpen]);

  if (!isCloseTradeModalOpen || !tradeToClose) return null;

  const activeAccount = accounts.find((a) => a.id === tradeToClose.account_id);
  const numExit = parseFloat(exitPrice);
  const lotsToClose = isPartial ? (parseFloat(closedLots) || tradeToClose.lot_size) : tradeToClose.lot_size;

  const pips = !isNaN(numExit)
    ? calculatePips(tradeToClose.pair, tradeToClose.direction, tradeToClose.entry_price, numExit)
    : null;
  const rr = !isNaN(numExit)
    ? calculateRealizedRR(tradeToClose.direction, tradeToClose.entry_price, tradeToClose.stop_loss, numExit)
    : null;
  const gross = !isNaN(numExit)
    ? estimateGrossPnl(tradeToClose.pair, tradeToClose.direction, lotsToClose, tradeToClose.entry_price, numExit)
    : null;
  
  const propComm = (tradeToClose.commission || 0) * (lotsToClose / tradeToClose.lot_size);
  const propSwap = (tradeToClose.swap || 0) * (lotsToClose / tradeToClose.lot_size);
  const calculatedNet = gross != null ? Number((gross - propComm - propSwap).toFixed(2)) : null;

  const finalProfitInDollars = isCustomPnl && customNetPnl !== '' 
    ? parseFloat(customNetPnl) 
    : calculatedNet;

  const remainingLots = Math.max(0, Number((tradeToClose.lot_size - lotsToClose).toFixed(2)));

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numExit) || !numExit) return;

    confirmCloseTrade({
      exitPrice: numExit,
      closedLots: lotsToClose,
      exitTime: new Date(exitTime).toISOString(),
      customNetPnl: isCustomPnl && customNetPnl !== '' ? parseFloat(customNetPnl) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131417] border border-[#26282f] rounded-[6px] w-full max-w-md shadow-2xl overflow-hidden font-sans">
        {/* Header matching getdesign.md */}
        <div className="px-4 py-3 border-b border-[#26282f] flex items-center justify-between bg-[#0f1013]">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[#fafafa]">
              {isPartial ? 'Execute Partial Exit (Scale-Out)' : 'Close Position'}
            </h3>
            <Badge variant={isPartial ? 'caution' : 'neutral'} size="xs">
              {isPartial ? 'PARTIAL EXIT' : 'FULL EXIT'}
            </Badge>
          </div>
          <button
            onClick={closeCloseTradeModal}
            className="p-1 rounded-[4px] text-[#71717a] hover:text-[#ededed] hover:bg-[#181a1e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleClose} className="p-4 space-y-3.5">
          {/* Position details banner */}
          <div className="p-3 bg-[#0f1013] rounded-[4px] border border-[#26282f] flex items-center justify-between font-mono text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#fafafa]">{tradeToClose.pair}</span>
                <Badge variant={tradeToClose.direction === 'BUY' ? 'profit' : 'loss'} size="xs">
                  {tradeToClose.direction}
                </Badge>
                <span className="text-[#a1a1aa] font-medium">{tradeToClose.lot_size.toFixed(2)} lots open</span>
              </div>
              <div className="text-[11px] text-[#71717a] mt-1">
                Entry: <span className="text-[#ededed]">{tradeToClose.entry_price}</span>
              </div>
            </div>

            {tradeToClose.stop_loss && (
              <div className="text-right text-[11px]">
                <div className="text-[#f43f5e]">SL: {tradeToClose.stop_loss}</div>
                {tradeToClose.take_profit && (
                  <div className="text-[#10b981]">TP: {tradeToClose.take_profit}</div>
                )}
              </div>
            )}
          </div>

          {/* Full vs Partial Toggle */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#71717a] mb-1.5">
              Exit Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPartial(false)}
                className={`py-1.5 px-3 rounded-[4px] text-xs font-medium border transition-colors cursor-pointer ${
                  !isPartial
                    ? 'bg-[#fafafa] text-[#0c0d0e] font-semibold border-[#fafafa]'
                    : 'bg-[#181a1e] text-[#a1a1aa] border-[#26282f] hover:text-[#ededed]'
                }`}
              >
                Close Full ({tradeToClose.lot_size.toFixed(2)} lots)
              </button>
              <button
                type="button"
                onClick={() => setIsPartial(true)}
                className={`py-1.5 px-3 rounded-[4px] text-xs font-medium border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  isPartial
                    ? 'bg-[#fafafa] text-[#0c0d0e] font-semibold border-[#fafafa]'
                    : 'bg-[#181a1e] text-[#a1a1aa] border-[#26282f] hover:text-[#ededed]'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>Partial Exit (Scale Out)</span>
              </button>
            </div>
          </div>

          {/* Partial Lot Size Input */}
          {isPartial && (
            <div className="p-3 bg-[#0f1013] rounded-[4px] border border-[#26282f] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#71717a] uppercase">Lots to close now:</span>
                <span className="font-mono text-[11px] text-[#a1a1aa]">
                  Remaining: <strong className="text-[#fafafa]">{remainingLots.toFixed(2)}</strong> lots
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  max={tradeToClose.lot_size}
                  min={0.01}
                  value={closedLots}
                  onChange={(e) => setClosedLots(e.target.value)}
                  className="w-full bg-[#131417] border border-[#26282f] rounded-[4px] px-3 py-1.5 text-xs font-mono font-bold text-[#fafafa] focus:outline-none focus:border-[#363943] tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setClosedLots((tradeToClose.lot_size * 0.5).toFixed(2))}
                  className="px-2 py-1 bg-[#1c1d21] hover:bg-[#26282f] text-[#a1a1aa] hover:text-white rounded-[3px] text-[10px] font-mono border border-[#26282f] transition"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setClosedLots((tradeToClose.lot_size * 0.25).toFixed(2))}
                  className="px-2 py-1 bg-[#1c1d21] hover:bg-[#26282f] text-[#a1a1aa] hover:text-white rounded-[3px] text-[10px] font-mono border border-[#26282f] transition"
                >
                  25%
                </button>
              </div>
            </div>
          )}

          {/* Exit Price */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#71717a] mb-1">
              Actual Exit Price *
            </label>
            <input
              type="number"
              step="any"
              autoFocus
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="e.g. 1.08650"
              className="w-full bg-[#0f1013] border border-[#363943] rounded-[4px] px-3 py-2 text-xs font-mono font-bold text-[#fafafa] focus:outline-none tabular-nums"
              required
            />
          </div>

          {/* Exit Timestamp */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#71717a] mb-1">
              Exit Timestamp
            </label>
            <input
              type="datetime-local"
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
              className="w-full bg-[#0f1013] border border-[#26282f] rounded-[4px] px-2.5 py-1.5 text-xs font-mono text-[#ededed]"
            />
          </div>

          {/* Real-time Profit In Dollars & Performance Breakdown */}
          {!isNaN(numExit) && numExit > 0 && (
            <div className="p-3 bg-[#0f1013] rounded-[4px] border border-[#26282f] space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#71717a] uppercase font-sans font-medium">
                  Realized Return on {lotsToClose.toFixed(2)} lots
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomPnl(!isCustomPnl)}
                  className="text-[10px] text-[#9ca3af] hover:text-[#fafafa] transition underline font-mono"
                >
                  {isCustomPnl ? 'Auto Calculate' : 'Override $ Profit'}
                </button>
              </div>

              {/* Big Prominent Dollar Profit Metric */}
              <div className="p-2.5 bg-[#131417] rounded-[4px] border border-[#26282f] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#71717a] uppercase block">Profit Made in Dollars ($)</span>
                  {isCustomPnl ? (
                    <input
                      type="number"
                      step="0.01"
                      value={customNetPnl}
                      onChange={(e) => setCustomNetPnl(e.target.value)}
                      placeholder="e.g. 450.00"
                      className="bg-[#0c0d0e] border border-[#363943] rounded px-2 py-0.5 text-sm font-bold text-white mt-1 tabular-nums"
                    />
                  ) : (
                    <div className={`text-lg font-bold tabular-nums mt-0.5 ${
                      (finalProfitInDollars ?? 0) >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'
                    }`}>
                      {finalProfitInDollars != null
                        ? `${finalProfitInDollars >= 0 ? '+' : ''}${formatCurrency(finalProfitInDollars, activeAccount?.currency)}`
                        : '—'}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#71717a] uppercase block">Pip Gain / Loss</span>
                  <div className={`text-sm font-bold tabular-nums mt-0.5 ${
                    (pips ?? 0) >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'
                  }`}>
                    {pips != null ? `${pips >= 0 ? '+' : ''}${pips.toFixed(1)} pips` : '—'}
                  </div>
                  <div className="text-[10px] text-[#71717a]">
                    {rr != null ? `(${rr >= 0 ? '+' : ''}${rr.toFixed(2)}R)` : ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#26282f]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeCloseTradeModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              {isPartial ? `Close ${lotsToClose.toFixed(2)} Lots` : 'Confirm Full Close'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
