import React, { useState, useEffect } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { Account, AccountType } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { X, Trash2 } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'];

export const AccountModal: React.FC = () => {
  const { isAccountModalOpen, editingAccount, closeAccountModal, saveAccount, deleteAccount } = useJournalStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('PROP_FIRM');
  const [currency, setCurrency] = useState('USD');
  const [startingBalance, setStartingBalance] = useState('100000');
  const [maxTotalLossPct, setMaxTotalLossPct] = useState('10');
  const [maxDailyLossPct, setMaxDailyLossPct] = useState('5');
  const [profitTargetPct, setProfitTargetPct] = useState('8');
  const [hasConsistency, setHasConsistency] = useState(true);
  const [consistencyPct, setConsistencyPct] = useState('30');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setCurrency(editingAccount.currency);
      setStartingBalance(editingAccount.starting_balance.toString());
      setMaxTotalLossPct(editingAccount.max_total_loss_pct?.toString() || '10');
      setMaxDailyLossPct(editingAccount.max_daily_loss_pct?.toString() || '5');
      setProfitTargetPct(editingAccount.profit_target_pct?.toString() || '8');
      setHasConsistency(!!editingAccount.consistency_max_trade_pct);
      setConsistencyPct(editingAccount.consistency_max_trade_pct?.toString() || '30');
    } else {
      setName('');
      setType('PROP_FIRM');
      setCurrency('USD');
      setStartingBalance('100000');
      setMaxTotalLossPct('10');
      setMaxDailyLossPct('5');
      setProfitTargetPct('8');
      setHasConsistency(true);
      setConsistencyPct('30');
    }
  }, [editingAccount, isAccountModalOpen]);

  if (!isAccountModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const startBal = parseFloat(startingBalance) || 100000;

    const accToSave: Account = {
      id: editingAccount ? editingAccount.id : 'acc_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      type,
      currency,
      starting_balance: startBal,
      current_balance: editingAccount ? editingAccount.current_balance : startBal,
      max_total_loss_pct: parseFloat(maxTotalLossPct) || undefined,
      max_daily_loss_pct: parseFloat(maxDailyLossPct) || undefined,
      profit_target_pct: profitTargetPct ? parseFloat(profitTargetPct) : undefined,
      consistency_max_trade_pct: hasConsistency && consistencyPct ? parseFloat(consistencyPct) : undefined,
      is_active: true,
      created_at: editingAccount ? editingAccount.created_at : new Date().toISOString(),
    };

    saveAccount(accToSave);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131417] border border-[#26282f] rounded-[6px] w-full max-w-lg shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#26282f] flex items-center justify-between bg-[#0f1013]">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[#fafafa]">
              {editingAccount ? 'Edit Account Parameters' : 'Create Trading Account'}
            </h3>
            <Badge variant={type === 'PROP_FIRM' ? 'caution' : 'neutral'} size="xs">
              {type === 'PROP_FIRM' ? 'PROP FIRM' : 'PERSONAL'}
            </Badge>
          </div>
          <button
            onClick={closeAccountModal}
            className="p-1 rounded-[4px] text-[#71717a] hover:text-[#ededed] hover:bg-[#181a1e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#71717a] mb-1">
              Account Label *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FTMO $100K Phase 1, FundedNext..."
              className="w-full bg-[#0f1013] border border-[#26282f] rounded-[4px] px-2.5 py-1.5 text-xs font-semibold text-[#fafafa] focus:outline-none focus:border-[#363943] font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#71717a] mb-1">
                Account Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-[#0f1013] border border-[#26282f] rounded-[4px] px-2.5 py-1.5 text-xs font-medium text-[#ededed]"
              >
                <option value="PROP_FIRM">Prop Firm Challenge</option>
                <option value="PERSONAL">Personal Brokerage</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#71717a] mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#0f1013] border border-[#26282f] rounded-[4px] px-2.5 py-1.5 text-xs font-mono text-[#ededed]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#71717a] mb-1">
              Starting Capital *
            </label>
            <input
              type="number"
              step="any"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              placeholder="100000"
              className="w-full bg-[#0f1013] border border-[#26282f] rounded-[4px] px-2.5 py-1.5 text-xs font-mono font-bold text-[#fafafa] focus:outline-none focus:border-[#363943] tabular-nums"
              required
            />
          </div>

          {/* Prop Firm specific parameters */}
          {type === 'PROP_FIRM' && (
            <div className="border border-[#26282f] rounded-[4px] p-3 bg-[#0f1013] space-y-2.5 font-mono">
              <span className="text-[11px] font-semibold text-[#f59e0b] uppercase tracking-wider block font-sans">
                Evaluation Drawdown Rules
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-[#71717a] uppercase mb-1">Max Daily Loss (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxDailyLossPct}
                    onChange={(e) => setMaxDailyLossPct(e.target.value)}
                    placeholder="5.0"
                    className="w-full bg-[#131417] border border-[#26282f] rounded-[4px] px-2.5 py-1 text-xs text-[#f43f5e] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#71717a] uppercase mb-1">Max Overall Loss (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxTotalLossPct}
                    onChange={(e) => setMaxTotalLossPct(e.target.value)}
                    placeholder="10.0"
                    className="w-full bg-[#131417] border border-[#26282f] rounded-[4px] px-2.5 py-1 text-xs text-[#f43f5e] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#71717a] uppercase mb-1">
                  Profit Target (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={profitTargetPct}
                  onChange={(e) => setProfitTargetPct(e.target.value)}
                  placeholder="8.0"
                  className="w-full bg-[#131417] border border-[#26282f] rounded-[4px] px-2.5 py-1 text-xs text-[#10b981] tabular-nums"
                />
              </div>

              {/* Consistency rule */}
              <div className="pt-2 border-t border-[#26282f] font-sans">
                <label className="flex items-center gap-2 text-xs text-[#a1a1aa] cursor-pointer mb-1.5">
                  <input
                    type="checkbox"
                    checked={hasConsistency}
                    onChange={(e) => setHasConsistency(e.target.checked)}
                    className="rounded bg-[#131417] text-[#fafafa] border-[#26282f] focus:ring-0"
                  />
                  <span>Enforce Single-Trade Consistency Rule</span>
                </label>
                {hasConsistency && (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-[#71717a]">Max Single Win Cap:</span>
                    <input
                      type="number"
                      value={consistencyPct}
                      onChange={(e) => setConsistencyPct(e.target.value)}
                      placeholder="30"
                      className="w-16 bg-[#131417] border border-[#26282f] rounded-[4px] px-2 py-0.5 text-xs text-white text-center tabular-nums"
                    />
                    <span className="text-[#71717a]">%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer CTAs */}
          <div className="pt-3 border-t border-[#26282f] flex items-center justify-between">
            {editingAccount ? (
              <Button
                type="button"
                variant="danger"
                size="xs"
                onClick={() => deleteAccount(editingAccount.id)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Account
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={closeAccountModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                {editingAccount ? 'Save Changes' : 'Create Account'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
