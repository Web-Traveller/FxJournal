import React from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { formatCurrency } from '../../lib/calculations';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { KpiBlock } from '../ui/KpiBlock';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { trades, accounts, activeAccountId } = useJournalStore();
  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  const closedTrades = trades
    .filter((t) => t.account_id === activeAccountId && t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime());

  // Metrics calculations
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => (t.net_pnl ?? 0) > 0);
  const losingTrades = closedTrades.filter((t) => (t.net_pnl ?? 0) < 0);
  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  const winRate = totalTrades > 0 ? ((winCount / totalTrades) * 100).toFixed(1) : '0';

  const grossWins = winningTrades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
  const grossLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : grossWins > 0 ? '∞' : '0.00';

  const avgWin = winCount > 0 ? grossWins / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLosses / lossCount : 0;
  const winLossRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '0.00';

  const bestTrade = closedTrades.reduce((max, t) => Math.max(max, t.net_pnl ?? 0), 0);
  const worstTrade = closedTrades.reduce((min, t) => Math.min(min, t.net_pnl ?? 0), 0);

  const winRateDec = totalTrades > 0 ? winCount / totalTrades : 0;
  const lossRateDec = totalTrades > 0 ? lossCount / totalTrades : 0;
  const expectancy = winRateDec * avgWin - lossRateDec * avgLoss;

  const longTrades = closedTrades.filter((t) => t.direction === 'BUY');
  const longWins = longTrades.filter((t) => (t.net_pnl ?? 0) > 0).length;
  const longWinRate = longTrades.length > 0 ? ((longWins / longTrades.length) * 100).toFixed(0) : '0';

  const shortTrades = closedTrades.filter((t) => t.direction === 'SELL');
  const shortWins = shortTrades.filter((t) => (t.net_pnl ?? 0) > 0).length;
  const shortWinRate = shortTrades.length > 0 ? ((shortWins / shortTrades.length) * 100).toFixed(0) : '0';

  // Build Equity Curve Data
  const startingBal = activeAccount ? activeAccount.starting_balance : 100000;
  let runningBalance = startingBal;
  const equityCurveData = closedTrades.length === 0
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
        ...closedTrades.map((t, i) => {
          runningBalance += t.net_pnl ?? 0;
          return {
            tradeIndex: i + 1,
            name: `#${i + 1} ${t.pair}`,
            balance: Number(runningBalance.toFixed(2)),
            pnl: t.net_pnl ?? 0,
          };
        }),
      ];

  // Pair Performance Data
  const pairMap: Record<string, number> = {};
  closedTrades.forEach((t) => {
    pairMap[t.pair] = (pairMap[t.pair] || 0) + (t.net_pnl ?? 0);
  });
  const pairData = Object.entries(pairMap).map(([pair, pnl]) => ({
    pair,
    pnl: Number(pnl.toFixed(2)),
  }));

  // Session Performance Data
  const sessionMap: Record<string, number> = {
    LONDON: 0,
    NEW_YORK: 0,
    ASIA: 0,
    SYDNEY: 0,
  };
  closedTrades.forEach((t) => {
    const s = t.session || 'LONDON';
    sessionMap[s] = (sessionMap[s] || 0) + (t.net_pnl ?? 0);
  });
  const sessionData = Object.entries(sessionMap).map(([session, pnl]) => ({
    session,
    pnl: Number(pnl.toFixed(2)),
  }));

  return (
    <div className="space-y-3.5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-[#26282f]">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-[#fafafa] tracking-tight">
            Performance Analytics & Statistical Edge
          </h1>
          <Badge variant="neutral" size="xs">
            {totalTrades} EXECUTIONS
          </Badge>
          <span className="text-xs text-[#71717a] font-mono">
            {activeAccount?.name}
          </span>
        </div>
      </div>

      {/* KPI Blocks Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <KpiBlock
          label="Win Rate"
          value={`${winRate}%`}
          status={Number(winRate) >= 50 ? 'profit' : 'neutral'}
          subtitle={
            <span className="font-mono">
              <span className="text-[#10b981]">{winCount}W</span> /{' '}
              <span className="text-[#f43f5e]">{lossCount}L</span>
            </span>
          }
        />

        <KpiBlock
          label="Profit Factor"
          value={profitFactor}
          status={Number(profitFactor) >= 1.5 ? 'profit' : 'neutral'}
          subtitle={<span className="font-mono text-[#71717a]">Ratio of gross gains/losses</span>}
        />

        <KpiBlock
          label="Expectancy"
          value={`${expectancy >= 0 ? '+' : ''}${formatCurrency(expectancy, activeAccount?.currency)}`}
          status={expectancy >= 0 ? 'profit' : 'loss'}
          subtitle={<span className="font-mono text-[#71717a]">Expected dollar return / trade</span>}
        />

        <KpiBlock
          label="Win / Loss Ratio"
          value={`${winLossRatio} : 1`}
          status={Number(winLossRatio) >= 1.5 ? 'profit' : 'neutral'}
          subtitle={
            <span className="font-mono text-[#71717a]">
              Avg Win: <span className="text-[#10b981]">{formatCurrency(avgWin, activeAccount?.currency)}</span>
            </span>
          }
        />
      </div>

      {/* Secondary Edge Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 bg-[#131417] border border-[#26282f] rounded-[4px] text-xs font-mono">
        <div>
          <span className="text-[#71717a] text-[10px] uppercase block">Best Execution</span>
          <div className="text-[#10b981] font-bold text-sm mt-0.5 tabular-nums">
            +{formatCurrency(bestTrade, activeAccount?.currency)}
          </div>
        </div>
        <div>
          <span className="text-[#71717a] text-[10px] uppercase block">Worst Execution</span>
          <div className="text-[#f43f5e] font-bold text-sm mt-0.5 tabular-nums">
            {formatCurrency(worstTrade, activeAccount?.currency)}
          </div>
        </div>
        <div>
          <span className="text-[#71717a] text-[10px] uppercase block">Long (BUY) Win Rate</span>
          <div className="text-[#ededed] font-bold text-sm mt-0.5 tabular-nums">
            {longWinRate}% <span className="text-[#71717a] text-xs font-normal">({longTrades.length} trades)</span>
          </div>
        </div>
        <div>
          <span className="text-[#71717a] text-[10px] uppercase block">Short (SELL) Win Rate</span>
          <div className="text-[#ededed] font-bold text-sm mt-0.5 tabular-nums">
            {shortWinRate}% <span className="text-[#71717a] text-xs font-normal">({shortTrades.length} trades)</span>
          </div>
        </div>
      </div>

      {/* Cumulative Equity Growth Curve */}
      <Card
        header="Cumulative Equity Trajectory"
        action={
          <span className="text-xs font-mono text-[#71717a]">
            Current Balance: <span className="text-[#fafafa] font-bold">{formatCurrency(activeAccount?.current_balance, activeAccount?.currency)}</span>
          </span>
        }
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurveData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#26282f" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#26282f' }} fontFamily="Geist Mono" />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#26282f' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                fontFamily="Geist Mono"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#131417] border border-[#26282f] p-2.5 rounded-[4px] shadow-xl text-xs font-mono">
                        <div className="text-[#71717a] mb-1">{data.name}</div>
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
                fill="url(#equityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid: Pair Breakdown & Session Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pair Performance */}
        <Card header="Net Realized P&L By Symbol">
          {pairData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs font-mono text-[#71717a]">
              No closed executions to compute pair performance.
            </div>
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pairData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26282f" vertical={false} />
                  <XAxis dataKey="pair" stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#26282f' }} fontFamily="Geist Mono" />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#26282f' }} fontFamily="Geist Mono" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-[#131417] border border-[#26282f] p-2 rounded-[4px] text-xs font-mono">
                            <span className="text-[#71717a]">{item.pair}: </span>
                            <span className={`font-bold ${item.pnl >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                              {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl, activeAccount?.currency)}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {pairData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Session Breakdown */}
        <Card header="Session P&L Edge Distribution">
          {totalTrades === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs font-mono text-[#71717a]">
              No closed executions to compute session performance.
            </div>
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26282f" vertical={false} />
                  <XAxis dataKey="session" stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#26282f' }} fontFamily="Geist Mono" />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#26282f' }} fontFamily="Geist Mono" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-[#131417] border border-[#26282f] p-2 rounded-[4px] text-xs font-mono">
                            <span className="text-[#71717a]">{item.session}: </span>
                            <span className={`font-bold ${item.pnl >= 0 ? 'text-[#ededed]' : 'text-[#f43f5e]'}`}>
                              {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl, activeAccount?.currency)}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {sessionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
