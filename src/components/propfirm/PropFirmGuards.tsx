import React from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { calculatePropFirmStatus, formatCurrency } from '../../lib/calculations';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { KpiBlock } from '../ui/KpiBlock';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Target, 
  Scale, 
  Settings
} from 'lucide-react';

export const PropFirmGuards: React.FC = () => {
  const { accounts, activeAccountId, trades, openAccountModal } = useJournalStore();
  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  if (!activeAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-[#131417] border border-[#26282f] rounded-[6px]">
        <ShieldCheck className="w-8 h-8 text-[#71717a] mb-2" />
        <h2 className="text-sm font-semibold text-[#fafafa] mb-1">No Active Account Selected</h2>
        <p className="text-xs text-[#71717a] max-w-sm mb-4">Create or select a prop firm evaluation account to view risk guard telemetry.</p>
        <Button variant="primary" size="xs" onClick={() => openAccountModal()}>
          Add Account
        </Button>
      </div>
    );
  }

  if (activeAccount.type !== 'PROP_FIRM') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-[#131417] border border-[#26282f] rounded-[6px]">
        <div className="w-10 h-10 rounded-[4px] bg-[#181a1e] border border-[#26282f] flex items-center justify-center mb-3">
          <ShieldCheck className="w-5 h-5 text-[#a1a1aa]" />
        </div>
        <h2 className="text-sm font-semibold text-[#fafafa] mb-1">Personal Brokerage Account Active</h2>
        <p className="text-xs text-[#71717a] max-w-md mb-4">
          Prop Firm Risk Cockpit is exclusively available for Evaluation / Challenge accounts. Your active account ({activeAccount.name}) is configured as a Personal Brokerage account without artificial prop firm drawdown rules.
        </p>
        <Button variant="secondary" size="xs" onClick={() => openAccountModal(activeAccount)}>
          Configure Account
        </Button>
      </div>
    );
  }

  const status = calculatePropFirmStatus(activeAccount, trades);
  const isPropFirm = activeAccount.type === 'PROP_FIRM';

  const dailySafetyPct = Math.max(
    0,
    Math.min(100, (status.dailyLossRemaining / status.maxDailyLossAmount) * 100)
  );

  const totalSafetyPct = Math.max(
    0,
    Math.min(100, (status.totalLossRemaining / status.maxTotalLossAmount) * 100)
  );

  const targetProgressPct = status.profitTargetAmount
    ? Math.max(0, Math.min(100, (status.totalPnl / status.profitTargetAmount) * 100))
    : 0;

  return (
    <div className="space-y-3.5 font-sans">
      {/* Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-[#26282f]">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-[#fafafa] tracking-tight">
            Prop Firm Risk Cockpit
          </h1>
          <Badge variant={isPropFirm ? 'caution' : 'neutral'} size="xs">
            {isPropFirm ? 'EVALUATION RULES' : 'PERSONAL TRADING'}
          </Badge>
          <span className="text-xs text-[#71717a] font-mono">
            {activeAccount.name}
          </span>
        </div>

        <Button
          variant="secondary"
          size="xs"
          onClick={() => openAccountModal(activeAccount)}
          icon={<Settings className="w-3.5 h-3.5" />}
        >
          Account Parameters
        </Button>
      </div>

      {/* Account Telemetry Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <KpiBlock
          label="Starting Baseline"
          value={formatCurrency(status.startingBalance, activeAccount.currency)}
          subtitle={<span className="text-[#71717a] font-mono">Account Capital</span>}
        />
        <KpiBlock
          label="Current Balance"
          value={formatCurrency(status.currentBalance, activeAccount.currency)}
          status={status.currentBalance >= status.startingBalance ? 'profit' : 'loss'}
          subtitle={
            <span className="font-mono">
              Net Gain: {status.totalPnl >= 0 ? '+' : ''}{formatCurrency(status.totalPnl, activeAccount.currency)}
            </span>
          }
        />
        <KpiBlock
          label="Today's Realized"
          value={formatCurrency(status.dailyPnl, activeAccount.currency)}
          status={status.dailyPnl >= 0 ? 'profit' : 'loss'}
          subtitle={
            <span className="font-mono">
              Max Daily Loss: -{formatCurrency(status.maxDailyLossAmount, activeAccount.currency)}
            </span>
          }
        />
        <KpiBlock
          label="Evaluation Guard Status"
          value={
            status.dailyLossBreached || status.totalLossBreached
              ? 'BREACHED'
              : status.profitTargetReached
              ? 'PASSED'
              : 'COMPLIANT'
          }
          status={
            status.dailyLossBreached || status.totalLossBreached
              ? 'loss'
              : status.profitTargetReached
              ? 'profit'
              : 'profit'
          }
          subtitle={
            <span className="font-mono text-[#a1a1aa]">
              {status.dailyLossBreached || status.totalLossBreached
                ? 'Violates firm parameters'
                : 'All safety limits compliant'}
            </span>
          }
        />
      </div>

      {/* 4 Compliance Guard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Daily Drawdown Guard */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#71717a]" />
              <span>Daily Drawdown Limit ({status.maxDailyLossPct}%)</span>
            </div>
          }
          action={
            <Badge variant={status.dailyLossBreached ? 'loss' : 'profit'} size="xs">
              {status.dailyLossBreached ? 'VIOLATED' : 'PASSING'}
            </Badge>
          }
          footer={
            <div className="flex items-center justify-between font-mono">
              <span>Remaining safety buffer:</span>
              <span className="text-[#fafafa] font-bold">{dailySafetyPct.toFixed(0)}% safe</span>
            </div>
          }
        >
          <div className="space-y-2.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#71717a]">Loss Buffer Remaining:</span>
              <span className={`font-bold tabular-nums ${status.dailyLossBreached ? 'text-[#f43f5e]' : 'text-[#10b981]'}`}>
                {formatCurrency(status.dailyLossRemaining, activeAccount.currency)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#71717a]">Max Allowed Daily Cutoff:</span>
              <span className="text-[#ededed] tabular-nums">
                -{formatCurrency(status.maxDailyLossAmount, activeAccount.currency)}
              </span>
            </div>

            <div className="w-full bg-[#0c0d0e] h-2 rounded-[2px] overflow-hidden border border-[#26282f]">
              <div
                className={`h-full transition-all duration-300 rounded-[2px] ${
                  status.dailyLossBreached
                    ? 'bg-[#f43f5e]'
                    : dailySafetyPct < 30
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#10b981]'
                }`}
                style={{ width: `${dailySafetyPct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* 2. Maximum Total Drawdown */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#71717a]" />
              <span>Max Account Loss ({status.maxTotalLossPct}%)</span>
            </div>
          }
          action={
            <Badge variant={status.totalLossBreached ? 'loss' : 'profit'} size="xs">
              {status.totalLossBreached ? 'VIOLATED' : 'PASSING'}
            </Badge>
          }
          footer={
            <div className="flex items-center justify-between font-mono">
              <span>Overall safety headroom:</span>
              <span className="text-[#fafafa] font-bold">{totalSafetyPct.toFixed(0)}% safe</span>
            </div>
          }
        >
          <div className="space-y-2.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#71717a]">Total Buffer Remaining:</span>
              <span className={`font-bold tabular-nums ${status.totalLossBreached ? 'text-[#f43f5e]' : 'text-[#10b981]'}`}>
                {formatCurrency(status.totalLossRemaining, activeAccount.currency)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#71717a]">Hard Cutoff Equity:</span>
              <span className="text-[#ededed] tabular-nums">
                {formatCurrency(status.startingBalance - status.maxTotalLossAmount, activeAccount.currency)}
              </span>
            </div>

            <div className="w-full bg-[#0c0d0e] h-2 rounded-[2px] overflow-hidden border border-[#26282f]">
              <div
                className={`h-full transition-all duration-300 rounded-[2px] ${
                  status.totalLossBreached
                    ? 'bg-[#f43f5e]'
                    : totalSafetyPct < 30
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#10b981]'
                }`}
                style={{ width: `${totalSafetyPct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* 3. Profit Target */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#71717a]" />
              <span>Profit Target ({status.profitTargetPct || 0}%)</span>
            </div>
          }
          action={
            status.profitTargetAmount ? (
              <Badge variant={status.profitTargetReached ? 'profit' : 'caution'} size="xs">
                {status.profitTargetReached ? 'TARGET ACHIEVED' : 'IN PROGRESS'}
              </Badge>
            ) : null
          }
          footer={
            <div className="flex items-center justify-between font-mono">
              <span>Milestone completion:</span>
              <span className="text-[#fafafa] font-bold">{targetProgressPct.toFixed(1)}%</span>
            </div>
          }
        >
          {status.profitTargetAmount ? (
            <div className="space-y-2.5 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-[#71717a]">Target Profit Goal:</span>
                <span className="font-bold text-[#10b981] tabular-nums">
                  +{formatCurrency(status.profitTargetAmount, activeAccount.currency)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#71717a]">Remaining to Target:</span>
                <span className="text-[#ededed] tabular-nums">
                  {status.profitTargetRemaining != null && status.profitTargetRemaining > 0
                    ? formatCurrency(status.profitTargetRemaining, activeAccount.currency)
                    : '$0.00 (Ready for Payout / Phase 2)'}
                </span>
              </div>

              <div className="w-full bg-[#0c0d0e] h-2 rounded-[2px] overflow-hidden border border-[#26282f]">
                <div
                  className="h-full bg-[#10b981] transition-all duration-300 rounded-[2px]"
                  style={{ width: `${targetProgressPct}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#71717a] font-mono italic py-2">
              No profit target configured. Set a target percentage in account rules to track evaluation pacing.
            </p>
          )}
        </Card>

        {/* 4. Consistency Rule */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#71717a]" />
              <span>Trade Consistency Rule</span>
            </div>
          }
          action={
            activeAccount.consistency_max_trade_pct ? (
              <Badge variant={status.consistencyViolation ? 'caution' : 'profit'} size="xs">
                {status.consistencyViolation ? 'VIOLATION' : 'BALANCED'}
              </Badge>
            ) : null
          }
          footer={
            <div className="flex items-center justify-between font-mono">
              <span>Risk concentration:</span>
              <span className="text-[#fafafa] font-bold">
                {status.consistencyViolation ? 'Exceeds single trade cap' : 'Well distributed'}
              </span>
            </div>
          }
        >
          {activeAccount.consistency_max_trade_pct ? (
            <div className="space-y-2.5 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-[#71717a]">Largest Single Win:</span>
                <span className={`font-bold tabular-nums ${status.consistencyViolation ? 'text-[#f59e0b]' : 'text-[#ededed]'}`}>
                  {status.maxSingleTradeProfitPct}% of total profit
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#71717a]">Maximum Allowed Ceiling:</span>
                <span className="text-[#ededed] tabular-nums">
                  ≤ {activeAccount.consistency_max_trade_pct}%
                </span>
              </div>

              <div className="w-full bg-[#0c0d0e] h-2 rounded-[2px] overflow-hidden border border-[#26282f]">
                <div
                  className={`h-full transition-all duration-300 rounded-[2px] ${
                    status.consistencyViolation ? 'bg-[#f59e0b]' : 'bg-[#ededed]'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      ((status.maxSingleTradeProfitPct || 0) / activeAccount.consistency_max_trade_pct) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#71717a] font-mono italic py-2">
              Configure consistency rule limit if your firm restricts single-trade windfall profit percentages.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
