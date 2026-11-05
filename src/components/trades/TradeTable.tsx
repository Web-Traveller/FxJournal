import React from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { formatCurrency } from '../../lib/calculations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { 
  Search, 
  Image as ImageIcon, 
  Edit3, 
  Trash2, 
  Plus,
  RotateCcw
} from 'lucide-react';

export const TradeTable: React.FC = () => {
  const { 
    trades, 
    activeAccountId, 
    accounts, 
    filters, 
    setFilters, 
    resetFilters, 
    openTradeDialog, 
    deleteTrade, 
    openLightbox,
    openCloseTradeModal
  } = useJournalStore();

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  // Filter trades
  const accountTrades = trades.filter((t) => t.account_id === activeAccountId);
  const filteredTrades = accountTrades.filter((t) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchPair = t.pair.toLowerCase().includes(q);
      const matchStrat = t.strategy_tag?.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      if (!matchPair && !matchStrat && !matchNotes) return false;
    }

    // Direction
    if (filters.direction !== 'ALL' && t.direction !== filters.direction) return false;

    // Status
    if (filters.status !== 'ALL' && t.status !== filters.status) return false;

    // Session
    if (filters.session !== 'ALL' && t.session !== filters.session) return false;

    return true;
  });

  const totalFilteredPnl = filteredTrades
    .filter((t) => t.status === 'CLOSED')
    .reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);

  const closedFiltered = filteredTrades.filter((t) => t.status === 'CLOSED');
  const wins = closedFiltered.filter((t) => (t.net_pnl ?? 0) > 0).length;
  const filteredWinRate = closedFiltered.length > 0 ? ((wins / closedFiltered.length) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-3 font-sans">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#131417] border border-[#26282f] rounded-[4px] p-2.5 flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Filter by symbol, setup strategy, notes..."
            className="w-full bg-[#0c0d0e] border border-[#26282f] rounded-[4px] pl-8 pr-3 py-1 text-xs text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#363943] font-mono transition"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Direction Filter */}
          <select
            value={filters.direction}
            onChange={(e) => setFilters({ direction: e.target.value as any })}
            className="bg-[#0c0d0e] border border-[#26282f] rounded-[4px] px-2 py-1 text-xs font-mono text-[#ededed] focus:outline-none"
          >
            <option value="ALL">All Sides</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as any })}
            className="bg-[#0c0d0e] border border-[#26282f] rounded-[4px] px-2 py-1 text-xs font-mono text-[#ededed] focus:outline-none"
          >
            <option value="ALL">All States</option>
            <option value="OPEN">Open Positions</option>
            <option value="CLOSED">Closed Trades</option>
          </select>

          {/* Session Filter */}
          <select
            value={filters.session}
            onChange={(e) => setFilters({ session: e.target.value as any })}
            className="bg-[#0c0d0e] border border-[#26282f] rounded-[4px] px-2 py-1 text-xs font-mono text-[#ededed] focus:outline-none"
          >
            <option value="ALL">All Sessions</option>
            <option value="LONDON">London</option>
            <option value="NEW_YORK">New York</option>
            <option value="ASIA">Asia</option>
            <option value="SYDNEY">Sydney</option>
          </select>

          {/* Reset Filters button */}
          {(filters.search || filters.direction !== 'ALL' || filters.status !== 'ALL' || filters.session !== 'ALL') && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="px-2 py-1 text-xs font-mono text-[#71717a] hover:text-[#ededed] bg-[#181a1e] border border-[#26282f] rounded-[4px] flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* New Trade button */}
          <Button
            variant="primary"
            size="xs"
            onClick={() => openTradeDialog()}
            icon={<Plus className="w-3.5 h-3.5" />}
            shortcut="N"
          >
            Log Trade
          </Button>
        </div>
      </div>

      {/* Filtered Summary Strip */}
      <div className="px-3 py-1.5 bg-[#131417] border border-[#26282f] rounded-[4px] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3 text-[#71717a]">
          <span>
            <strong className="text-[#fafafa]">{filteredTrades.length}</strong> of {accountTrades.length} executions
          </span>
          <span>·</span>
          <span>
            Win Rate: <strong className="text-[#ededed]">{filteredWinRate}%</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#71717a] text-[11px] uppercase tracking-wider">Filtered Profit:</span>
          <span className={`font-bold tabular-nums ${totalFilteredPnl >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
            {totalFilteredPnl >= 0 ? '+' : ''}{formatCurrency(totalFilteredPnl, activeAccount?.currency)}
          </span>
        </div>
      </div>

      {/* Financial Ledger Table */}
      <Card noPadding>
        {filteredTrades.length === 0 ? (
          <div className="p-10 text-center text-xs font-mono text-[#71717a]">
            No trades match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#26282f] bg-[#0f1013] text-[#71717a] text-[11px] font-mono uppercase tracking-wider">
                  <th className="py-2 px-3 font-medium">Timestamp</th>
                  <th className="py-2 px-3 font-medium">Instrument</th>
                  <th className="py-2 px-3 font-medium">Side</th>
                  <th className="py-2 px-3 font-medium text-right">Lots</th>
                  <th className="py-2 px-3 font-medium text-right">Entry</th>
                  <th className="py-2 px-3 font-medium text-right">SL</th>
                  <th className="py-2 px-3 font-medium text-right">TP</th>
                  <th className="py-2 px-3 font-medium text-right">Exit</th>
                  <th className="py-2 px-3 font-medium text-right">Pips</th>
                  <th className="py-2 px-3 font-medium text-right">R:R</th>
                  <th className="py-2 px-3 font-medium text-right">Profit ($)</th>
                  <th className="py-2 px-3 font-medium text-center">Status</th>
                  <th className="py-2 px-3 font-medium text-center">Charts</th>
                  <th className="py-2 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1e22] font-mono">
                {filteredTrades.map((t) => {
                  const isClosed = t.status === 'CLOSED';
                  const isWin = (t.net_pnl ?? 0) > 0;
                  const isLoss = (t.net_pnl ?? 0) < 0;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-[#181a1e] transition-colors group"
                    >
                      {/* Entry Time */}
                      <td className="py-2 px-3 text-[#71717a] whitespace-nowrap text-[11px]">
                        {new Date(t.entry_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} {' '}
                        <span className="text-[#a1a1aa]">
                          {new Date(t.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </td>

                      {/* Pair & Strategy Tag */}
                      <td className="py-2 px-3 font-sans font-semibold text-[#fafafa] whitespace-nowrap">
                        <span>{t.pair}</span>
                        {t.session && (
                          <span className="ml-1 text-[10px] font-mono text-[#71717a] uppercase">
                            [{t.session.slice(0, 2)}]
                          </span>
                        )}
                        {t.strategy_tag && (
                          <div className="text-[10px] font-mono font-normal text-[#a1a1aa] truncate max-w-[130px]">
                            {t.strategy_tag}
                          </div>
                        )}
                      </td>

                      {/* Direction */}
                      <td className="py-2 px-3">
                        <Badge variant={t.direction === 'BUY' ? 'profit' : 'loss'} size="xs">
                          {t.direction}
                        </Badge>
                      </td>

                      {/* Lots */}
                      <td className="py-2 px-3 text-right text-[#ededed] tabular-nums">
                        {t.lot_size.toFixed(2)}
                      </td>

                      {/* Entry Price */}
                      <td className="py-2 px-3 text-right text-[#a1a1aa] tabular-nums">
                        {t.entry_price}
                      </td>

                      {/* Stop Loss */}
                      <td className="py-2 px-3 text-right text-[#f43f5e]/80 tabular-nums">
                        {t.stop_loss ?? '—'}
                      </td>

                      {/* Take Profit */}
                      <td className="py-2 px-3 text-right text-[#10b981]/80 tabular-nums">
                        {t.take_profit ?? '—'}
                      </td>

                      {/* Exit Price */}
                      <td className="py-2 px-3 text-right text-[#a1a1aa] tabular-nums">
                        {t.exit_price ?? '—'}
                      </td>

                      {/* Pips */}
                      <td className="py-2 px-3 text-right tabular-nums">
                        {t.pips != null ? (
                          <span className={t.pips >= 0 ? 'text-[#10b981] font-semibold' : 'text-[#f43f5e] font-semibold'}>
                            {t.pips > 0 ? `+${t.pips.toFixed(1)}` : t.pips.toFixed(1)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* R:R */}
                      <td className="py-2 px-3 text-right text-[#ededed] tabular-nums">
                        {t.realized_rr ? `${t.realized_rr.toFixed(2)}R` : t.planned_rr ? `${t.planned_rr.toFixed(2)}R` : '—'}
                      </td>

                      {/* Net Profit in Dollars ($) */}
                      <td className="py-2 px-3 text-right font-bold tabular-nums">
                        {t.net_pnl !== undefined && t.net_pnl !== null ? (
                          <span className={isWin ? 'text-[#10b981]' : isLoss ? 'text-[#f43f5e]' : 'text-[#71717a]'}>
                            {t.net_pnl >= 0 ? '+' : ''}{formatCurrency(t.net_pnl, activeAccount?.currency)}
                          </span>
                        ) : (
                          <span className="text-[#f59e0b] font-normal">Active</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        <Badge
                          variant={t.status === 'OPEN' ? 'caution' : isWin ? 'profit' : 'loss'}
                          size="xs"
                          pulse={t.status === 'OPEN'}
                        >
                          {t.status}
                        </Badge>
                      </td>

                      {/* Chart Screenshots */}
                      <td className="py-2 px-3 text-center">
                        {t.images && t.images.length > 0 ? (
                          <button
                            onClick={() => openLightbox({
                              url: t.images[0].data_url,
                              label: t.images[0].label,
                              tradeId: t.id,
                            })}
                            className="inline-flex items-center gap-1 text-[11px] text-[#a1a1aa] hover:text-[#fafafa] transition"
                            title="Click to view chart screenshot"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{t.images.length}</span>
                          </button>
                        ) : (
                          <span className="text-[#71717a]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {t.status === 'OPEN' && (
                            <button
                              onClick={() => openCloseTradeModal(t)}
                              title="Close or Partial Scale-Out"
                              className="px-2 py-0.5 rounded-[3px] text-[11px] font-mono text-[#f59e0b] hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer"
                            >
                              Exit
                            </button>
                          )}
                          <button
                            onClick={() => openTradeDialog(t)}
                            title="Edit Trade"
                            className="p-1 rounded-[3px] text-[#71717a] hover:text-[#ededed] hover:bg-[#181a1e] transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete trade #${t.id} (${t.pair})?`)) {
                                deleteTrade(t.id);
                              }
                            }}
                            title="Delete Trade"
                            className="p-1 rounded-[3px] text-[#71717a] hover:text-[#f43f5e] hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
