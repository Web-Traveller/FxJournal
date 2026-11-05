import React from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { formatCurrency } from '../../lib/calculations';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Radio, Image as ImageIcon, Clock, Plus, Split } from 'lucide-react';

export const OpenPositionsView: React.FC = () => {
  const { trades, activeAccountId, accounts, openCloseTradeModal, openLightbox, openTradeDialog } = useJournalStore();
  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  const openTrades = trades.filter((t) => t.account_id === activeAccountId && t.status === 'OPEN');

  return (
    <div className="space-y-3.5 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-[#26282f]">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-[#fafafa] tracking-tight">
            Active Open Positions
          </h1>
          <Badge variant={openTrades.length > 0 ? 'caution' : 'neutral'} size="xs" pulse={openTrades.length > 0}>
            {openTrades.length} RUNNING
          </Badge>
          <span className="text-xs text-[#71717a] font-mono">
            {activeAccount?.name}
          </span>
        </div>

        <Button
          variant="primary"
          size="xs"
          onClick={() => openTradeDialog()}
          icon={<Plus className="w-3.5 h-3.5" />}
          shortcut="N"
        >
          Open Position
        </Button>
      </div>

      {/* Positions Grid */}
      {openTrades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {openTrades.map((trade) => {
            return (
              <Card
                key={trade.id}
                header={
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#fafafa]">{trade.pair}</span>
                    <Badge variant={trade.direction === 'BUY' ? 'profit' : 'loss'} size="xs">
                      {trade.direction}
                    </Badge>
                    <span className="text-xs font-mono text-[#ededed] font-semibold">
                      {trade.lot_size.toFixed(2)} lots active
                    </span>
                  </div>
                }
                action={
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => openCloseTradeModal(trade)}
                    icon={<Split className="w-3 h-3" />}
                  >
                    Close / Partial Exit
                  </Button>
                }
              >
                <div className="space-y-3 font-sans">
                  {/* Meta Strip */}
                  <div className="flex items-center justify-between text-xs font-mono text-[#71717a]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#71717a]" />
                      <span>
                        Opened: {new Date(trade.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {trade.session && (
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded-[3px] bg-[#181a1e] text-[#a1a1aa] border border-[#26282f]">
                        {trade.session} SESSION
                      </span>
                    )}
                  </div>

                  {/* Price Parameters Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#0f1013] rounded-[4px] border border-[#26282f] text-center font-mono">
                    <div>
                      <div className="text-[10px] text-[#71717a] uppercase tracking-wider">Entry</div>
                      <div className="text-xs font-bold text-[#fafafa] mt-0.5 tabular-nums">
                        {trade.entry_price}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#71717a] uppercase tracking-wider">Stop Loss</div>
                      <div className="text-xs font-bold text-[#f43f5e] mt-0.5 tabular-nums">
                        {trade.stop_loss || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#71717a] uppercase tracking-wider">Take Profit</div>
                      <div className="text-xs font-bold text-[#10b981] mt-0.5 tabular-nums">
                        {trade.take_profit || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Partial Exits History if any */}
                  {trade.partial_exits && trade.partial_exits.length > 0 && (
                    <div className="p-2 bg-[#0f1013] border border-[#26282f] rounded-[4px] text-xs font-mono space-y-1">
                      <span className="text-[10px] uppercase text-[#71717a] block">Prior Partial Scale-Outs:</span>
                      {trade.partial_exits.map((pe) => (
                        <div key={pe.id} className="flex items-center justify-between text-[11px] text-[#ededed]">
                          <span>Closed {pe.lot_size.toFixed(2)}L @ {pe.exit_price}</span>
                          <span className={pe.net_pnl >= 0 ? 'text-[#10b981] font-bold' : 'text-[#f43f5e] font-bold'}>
                            {pe.net_pnl >= 0 ? '+' : ''}{formatCurrency(pe.net_pnl, activeAccount?.currency)} ({pe.pips > 0 ? `+${pe.pips}` : pe.pips} pips)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Strategy and Notes */}
                  {trade.strategy_tag && (
                    <div className="text-xs">
                      <span className="text-[#71717a] font-mono">Setup: </span>
                      <span className="text-[#ededed] font-medium">{trade.strategy_tag}</span>
                    </div>
                  )}

                  {trade.notes && (
                    <p className="text-xs text-[#a1a1aa] bg-[#0f1013] p-2 rounded-[4px] border border-[#26282f] italic">
                      "{trade.notes}"
                    </p>
                  )}

                  {/* Screenshots */}
                  {trade.images && trade.images.length > 0 && (
                    <div className="pt-2 border-t border-[#26282f] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#a1a1aa] font-mono">
                        <ImageIcon className="w-3.5 h-3.5 text-[#71717a]" />
                        <span>{trade.images[0].label || 'Markup'}</span>
                      </div>
                      <button
                        onClick={() =>
                          openLightbox({
                            url: trade.images[0].data_url,
                            label: trade.images[0].label,
                            tradeId: trade.id,
                          })
                        }
                        className="text-xs font-mono text-[#ededed] hover:text-[#fafafa] underline transition cursor-pointer"
                      >
                        Inspect Chart
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-10">
          <Radio className="w-6 h-6 mx-auto mb-2 text-[#71717a]" />
          <h3 className="text-xs font-semibold text-[#fafafa] uppercase tracking-wider">
            No Active Positions
          </h3>
          <p className="text-xs text-[#71717a] mt-1 max-w-sm mx-auto font-mono">
            Positions opened without an exit price will be tracked here until fully or partially closed.
          </p>
        </Card>
      )}
    </div>
  );
};
