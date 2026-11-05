import React from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { formatCurrency, calculatePropFirmStatus } from '../../lib/calculations';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { KpiBlock } from '../ui/KpiBlock';
import { MetricBar } from '../ui/MetricBar';
import { 
  Plus, 
  ArrowRight, 
  Radio, 
  Image as ImageIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { 
    accounts, 
    activeAccountId, 
    trades, 
    openTradeDialog, 
    openAccountModal,
    setActiveTab, 
    openLightbox
  } = useJournalStore();

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  if (!activeAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[#131417] border border-[#26282f] rounded-[6px] max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-[4px] bg-[#181a1e] border border-[#26282f] flex items-center justify-center mb-3">
          <Radio className="w-6 h-6 text-[#10b981]" />
        </div>
        <h2 className="text-base font-semibold text-[#fafafa] mb-1.5">No Trading Accounts Configured</h2>
        <p className="text-xs text-[#71717a] max-w-md mb-5 leading-relaxed">
          Create your first prop firm evaluation challenge (FTMO, FundedNext, Apex) or live brokerage account to start logging executions and tracking equity metrics.
        </p>
        <Button
          variant="primary"
          onClick={() => openAccountModal()}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Trading Account
        </Button>
      </div>
    );
  }

  const accountTrades = trades.filter((t) => t.account_id === activeAccountId);
  const openTrades = accountTrades.filter((t) => t.status === 'OPEN');
  const closedTrades = accountTrades.filter((t) => t.status === 'CLOSED');

  const propStatus = activeAccount ? calculatePropFirmStatus(activeAccount, trades) : null;
  const recentTrades = [...accountTrades].slice(0, 6);

  // Key metrics
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => (t.net_pnl ?? 0) > 0);
  const losingTrades = closedTrades.filter((t) => (t.net_pnl ?? 0) < 0);
  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  const winRate = totalTrades > 0 ? ((winCount / totalTrades) * 100).toFixed(1) : '0';

  const grossWins = winningTrades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
  const grossLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : grossWins > 0 ? '∞' : '0.00';
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);

  const startingBal = activeAccount?.starting_balance || 100000;
  let runningBalance = startingBal;
  const equityData = closedTrades.length === 0
    ? [
        { tradeIndex: 0, name: 'Starting Capital', balance: startingBal, pnl: 0 },
        { tradeIndex: 1, name: 'Current', balance: startingBal, pnl: 0 },
      ]
    : [
        {
          tradeIndex: 0,
          name: 'Start',
          balance: startingBal,
          pnl: 0,
        },
        ...[...closedTrades]
          .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime())
          .map((t, i) => {
            runningBalance += t.net_pnl ?? 0;
            return {
              tradeIndex: i + 1,
              name: `#${i + 1} ${t.pair}`,
              balance: Number(runningBalance.toFixed(2)),
              pnl: t.net_pnl ?? 0,
            };
          }),
      ];

  return (
    <div className="space-y-3.5 font-sans">
      {/* Top Bar: Operational Status & Fast CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-[#26282f]">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-[#fafafa] tracking-tight">
            Terminal Overview
          </h1>
          <span className="text-xs font-mono text-[#71717a]">
            {activeAccount?.name} ({activeAccount?.currency})
          </span>
          {openTrades.length > 0 && (
            <Badge variant="caution" size="xs" pulse>
              {openTrades.length} OPEN POSITION{openTrades.length > 1 ? 'S' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {openTrades.length > 0 && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setActiveTab('open-trades')}
              icon={<Radio className="w-3.5 h-3.5 text-[#f59e0b]" />}
            >
              Open Positions
            </Button>
          )}
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

      {/* Top 4 Precision KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KpiBlock
          label="Net Realized P&L"
          value={formatCurrency(totalPnl, activeAccount?.currency)}
          status={totalPnl >= 0 ? 'profit' : 'loss'}
          subtitle={
            <span>
              <span className="text-[#10b981] font-mono font-medium">{winCount}W</span>
              <span className="text-[#71717a] mx-1">/</span>
              <span className="text-[#f43f5e] font-mono font-medium">{lossCount}L</span>
              <span className="text-[#71717a] ml-1.5 font-mono">({totalTrades} trades)</span>
            </span>
          }
        />

        <KpiBlock
          label="Win Rate"
          value={`${winRate}%`}
          status={Number(winRate) >= 50 ? 'profit' : 'neutral'}
          subtitle={
            <span>
              Gross Wins: <span className="font-mono text-[#ededed] font-medium">{formatCurrency(grossWins, activeAccount?.currency)}</span>
            </span>
          }
        />

        <KpiBlock
          label="Profit Factor"
          value={profitFactor}
          status={Number(profitFactor) >= 1.5 ? 'profit' : 'neutral'}
          subtitle={
            <span>
              Gross Losses: <span className="font-mono text-[#ededed] font-medium">{formatCurrency(grossLosses, activeAccount?.currency)}</span>
            </span>
          }
        />

        <KpiBlock
          label={activeAccount?.type === 'PROP_FIRM' ? 'Daily Loss Buffer' : 'Current Balance'}
          value={
            activeAccount?.type === 'PROP_FIRM' && propStatus
              ? formatCurrency(propStatus.dailyLossRemaining, activeAccount?.currency)
              : formatCurrency(activeAccount?.current_balance || 0, activeAccount?.currency)
          }
          status={
            activeAccount?.type === 'PROP_FIRM' && propStatus?.dailyLossBreached
              ? 'loss'
              : 'profit'
          }
          subtitle={
            activeAccount?.type === 'PROP_FIRM' && propStatus ? (
              <span>
                Total DD Buffer: <span className="font-mono text-[#ededed] font-medium">{formatCurrency(propStatus.totalLossRemaining, activeAccount?.currency)}</span>
              </span>
            ) : (
              <span>
                Initial: <span className="font-mono text-[#ededed] font-medium">{formatCurrency(activeAccount?.starting_balance || 0, activeAccount?.currency)}</span>
              </span>
            )
          }
        />
      </div>

      {/* Main Grid: Equity Chart + Prop Firm Guard Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Equity Curve (2 cols) */}
        <Card
          className="lg:col-span-2"
          header="Equity Growth Trajectory"
          action={
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#71717a]">
                Balance: <span className="text-[#fafafa] font-medium">{formatCurrency(activeAccount?.current_balance || 0, activeAccount?.currency)}</span>
              </span>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-xs text-[#a1a1aa] hover:text-[#fafafa] flex items-center gap-1 font-mono transition"
              >
                Analytics <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          }
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#26282f" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#26282f' }}
                  fontFamily="Geist Mono"
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#26282f' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  domain={['dataMin - 500', 'dataMax + 500']}
                  fontFamily="Geist Mono"
                />
                <ReferenceLine 
                  y={startingBal} 
                  stroke="#3f4247" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Baseline', fill: '#71717a', fontSize: 10, position: 'right' }} 
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#131417] border border-[#26282f] p-2.5 rounded-[4px] shadow-xl text-xs font-mono">
                          <div className="text-[#71717a] mb-0.5">{data.name}</div>
                          <div className="text-[#fafafa] font-bold text-sm">
                            Balance: {formatCurrency(data.balance, activeAccount?.currency)}
                          </div>
                          {data.tradeIndex > 0 && (
                            <div className={`mt-0.5 font-medium ${data.pnl >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                              Trade P&L: {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl, activeAccount?.currency)}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#10b981" 
                  strokeWidth={1.5} 
                  fillOpacity={1} 
                  fill="url(#equityFill)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Prop Firm Rule Status / Safety Cockpit (1 col) */}
        <Card
          header={activeAccount?.type === 'PROP_FIRM' ? 'Prop Firm Risk Guards' : 'Account Parameters'}
          action={
            activeAccount?.type === 'PROP_FIRM' ? (
              <Badge variant={propStatus?.dailyLossBreached || propStatus?.totalLossBreached ? 'loss' : propStatus?.profitTargetReached ? 'profit' : 'caution'} size="xs">
                {propStatus?.dailyLossBreached || propStatus?.totalLossBreached ? 'BREACHED' : propStatus?.profitTargetReached ? 'PASSED' : 'ACTIVE'}
              </Badge>
            ) : null
          }
        >
          {activeAccount?.type === 'PROP_FIRM' && propStatus ? (
            <div className="space-y-3.5">
              {/* Daily Loss Guard */}
              <MetricBar
                label="Daily Drawdown Used"
                currentValue={Math.max(0, -propStatus.dailyPnl)}
                maxValue={propStatus.maxDailyLossAmount}
                formattedCurrent={formatCurrency(Math.max(0, -propStatus.dailyPnl), activeAccount.currency)}
                formattedMax={formatCurrency(propStatus.maxDailyLossAmount, activeAccount.currency)}
                variant={propStatus.dailyLossBreached ? 'loss' : 'profit'}
                helperText={`Buffer left: ${formatCurrency(propStatus.dailyLossRemaining, activeAccount.currency)}`}
              />

              {/* Total Drawdown Guard */}
              <MetricBar
                label="Max Drawdown Used"
                currentValue={Math.max(0, activeAccount.starting_balance - activeAccount.current_balance)}
                maxValue={propStatus.maxTotalLossAmount}
                formattedCurrent={formatCurrency(Math.max(0, activeAccount.starting_balance - activeAccount.current_balance), activeAccount.currency)}
                formattedMax={formatCurrency(propStatus.maxTotalLossAmount, activeAccount.currency)}
                variant={propStatus.totalLossBreached ? 'loss' : 'profit'}
                helperText={`Buffer left: ${formatCurrency(propStatus.totalLossRemaining, activeAccount.currency)}`}
              />

              {/* Target progress */}
              {propStatus.profitTargetAmount && (
                <MetricBar
                  label="Evaluation Target"
                  currentValue={Math.max(0, activeAccount.current_balance - activeAccount.starting_balance)}
                  maxValue={propStatus.profitTargetAmount}
                  formattedCurrent={formatCurrency(Math.max(0, activeAccount.current_balance - activeAccount.starting_balance), activeAccount.currency)}
                  formattedMax={formatCurrency(propStatus.profitTargetAmount, activeAccount.currency)}
                  variant="profit"
                  helperText={
                    propStatus.profitTargetReached
                      ? 'Target Achieved! Ready for Payout / Phase 2'
                      : `${formatCurrency(propStatus.profitTargetRemaining, activeAccount.currency)} remaining`
                  }
                />
              )}

              <div className="pt-2 border-t border-[#26282f] flex items-center justify-between text-xs">
                <span className="text-[#71717a]">Consistency Limit:</span>
                <span className="font-mono text-[#ededed]">
                  Max Trade: {propStatus.maxSingleTradeProfitPct}% / {activeAccount.consistency_max_trade_pct || 50}%
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#26282f]">
                <span className="text-[#71717a]">Account Type</span>
                <span className="text-[#ededed]">{activeAccount?.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#26282f]">
                <span className="text-[#71717a]">Starting Capital</span>
                <span className="text-[#ededed]">
                  {formatCurrency(activeAccount?.starting_balance || 0, activeAccount?.currency)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#26282f]">
                <span className="text-[#71717a]">Current Balance</span>
                <span className="text-[#fafafa] font-bold">
                  {formatCurrency(activeAccount?.current_balance || 0, activeAccount?.currency)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#71717a]">Total P&L</span>
                <span className={`font-bold ${totalPnl >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                  {formatCurrency(totalPnl, activeAccount?.currency)}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Grid: Recent Activity Ledger */}
      <Card
        header="Recent Executions Ledger"
        action={
          <button
            onClick={() => setActiveTab('journal')}
            className="text-xs text-[#a1a1aa] hover:text-[#fafafa] font-mono flex items-center gap-1 transition"
          >
            All Trades ({accountTrades.length}) <ArrowRight className="w-3 h-3" />
          </button>
        }
        noPadding
      >
        {recentTrades.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#71717a] font-mono">
            No trades logged for this account yet. Click "Log Trade" [N] to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#26282f] bg-[#0f1013] text-[#71717a] text-[11px] font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 font-medium">Instrument</th>
                  <th className="py-2.5 px-3.5 font-medium">Side</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Lots</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Entry</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Exit</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Pips</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">R:R</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Profit ($)</th>
                  <th className="py-2.5 px-3.5 font-medium text-center">Status</th>
                  <th className="py-2.5 px-3.5 font-medium text-center">Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1e22] font-mono">
                {recentTrades.map((t) => {
                  const isClosed = t.status === 'CLOSED';
                  const isWin = (t.net_pnl ?? 0) > 0;
                  const isLoss = (t.net_pnl ?? 0) < 0;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-[#181a1e] transition-colors group cursor-pointer"
                      onClick={() => setActiveTab('journal')}
                    >
                      <td className="py-2 px-3.5 font-sans font-semibold text-[#fafafa]">
                        {t.pair}
                        {t.strategy_tag && (
                          <span className="ml-2 font-mono font-normal text-[10px] text-[#71717a] px-1 py-0.2 rounded-[2px] bg-[#181a1e] border border-[#26282f]">
                            {t.strategy_tag}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3.5">
                        <Badge variant={t.direction === 'BUY' ? 'profit' : 'loss'} size="xs">
                          {t.direction}
                        </Badge>
                      </td>
                      <td className="py-2 px-3.5 text-right text-[#ededed] tabular-nums">
                        {t.lot_size.toFixed(2)}
                      </td>
                      <td className="py-2 px-3.5 text-right text-[#a1a1aa] tabular-nums">
                        {t.entry_price}
                      </td>
                      <td className="py-2 px-3.5 text-right text-[#a1a1aa] tabular-nums">
                        {t.exit_price ?? '—'}
                      </td>
                      <td className="py-2 px-3.5 text-right tabular-nums">
                        {t.pips != null ? (
                          <span className={t.pips >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}>
                            {t.pips > 0 ? `+${t.pips.toFixed(1)}` : t.pips.toFixed(1)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 px-3.5 text-right text-[#ededed] tabular-nums">
                        {t.realized_rr ? `${t.realized_rr.toFixed(2)}R` : t.planned_rr ? `${t.planned_rr.toFixed(2)}R` : '—'}
                      </td>
                      <td className="py-2 px-3.5 text-right font-bold tabular-nums">
                        {t.net_pnl !== undefined && t.net_pnl !== null ? (
                          <span className={isWin ? 'text-[#10b981]' : isLoss ? 'text-[#f43f5e]' : 'text-[#71717a]'}>
                            {t.net_pnl >= 0 ? '+' : ''}{formatCurrency(t.net_pnl, activeAccount?.currency)}
                          </span>
                        ) : (
                          <span className="text-[#f59e0b] font-normal">Active</span>
                        )}
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <Badge
                          variant={t.status === 'OPEN' ? 'caution' : isWin ? 'profit' : 'loss'}
                          size="xs"
                          pulse={t.status === 'OPEN'}
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        {t.images && t.images.length > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox({
                                url: t.images[0].data_url,
                                label: t.images[0].label,
                                tradeId: t.id,
                              });
                            }}
                            className="p-1 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#181a1e] transition"
                            title="View Chart Screenshot"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[#71717a]">—</span>
                        )}
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
