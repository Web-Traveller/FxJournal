import React, { useState, useRef, useEffect } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { calculatePropFirmStatus, formatCurrency } from '../../lib/calculations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Plus, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle,
  Activity
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    accounts, 
    activeAccountId, 
    setActiveAccount, 
    openAccountModal, 
    openTradeDialog, 
    trades
  } = useJournalStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];
  const propStatus = activeAccount ? calculatePropFirmStatus(activeAccount, trades) : null;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-12 bg-[#0c0d0e] border-b border-[#26282f] px-4 flex items-center justify-between select-none z-30 shrink-0 font-sans">
      {/* Brand & Account Selector */}
      <div className="flex items-center gap-3">
        {/* Brand Mark with Concept 1 Institutional Monogram */}
        <div className="flex items-center gap-2">
          <img 
            src="/favicon.svg" 
            alt="FxJournal" 
            className="w-5 h-5 rounded-[4px] shadow-sm shrink-0 object-contain" 
          />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[13px] tracking-tight text-[#fafafa]">
              FxJournal
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[3px] bg-[#181a1e] text-[#a1a1aa] border border-[#26282f]">
              PRO
            </span>
          </div>
        </div>

        <div className="h-3.5 w-px bg-[#26282f] mx-1" />

        {/* Account Selector Pill */}
        {!activeAccount ? (
          <button
            onClick={() => openAccountModal()}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#131417] hover:bg-[#181a1e] border border-dashed border-[#363943] hover:border-[#ededed] rounded-[4px] cursor-pointer transition text-left"
          >
            <Plus className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="text-xs font-medium text-[#ededed]">Create Trading Account</span>
          </button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 bg-[#131417] hover:bg-[#181a1e] border border-[#26282f] hover:border-[#363943] rounded-[4px] cursor-pointer transition text-left"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#ededed]">
                  {activeAccount.name}
                </span>
                <Badge 
                  variant={activeAccount.type === 'PROP_FIRM' ? 'caution' : 'neutral'} 
                  size="xs"
                >
                  {activeAccount.type === 'PROP_FIRM' ? 'PROP' : 'LIVE'}
                </Badge>
              </div>
              <div className="text-xs font-mono font-semibold text-[#fafafa] ml-1 tabular-nums">
                {formatCurrency(activeAccount.current_balance, activeAccount.currency)}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-[#131417] border border-[#26282f] rounded-[6px] shadow-2xl py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#71717a] uppercase tracking-wider font-mono">
                  Switch Account
                </div>
                {accounts.map(acc => (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setActiveAccount(acc.id);
                      setDropdownOpen(false);
                    }}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-[#181a1e] transition ${
                      acc.id === activeAccount.id ? 'bg-[#181a1e] border-l-2 border-[#ededed]' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium text-[#ededed]">{acc.name}</div>
                      <div className="text-[11px] font-mono text-[#71717a]">
                        {formatCurrency(acc.current_balance, acc.currency)} · {acc.type === 'PROP_FIRM' ? 'Prop Firm' : 'Personal'}
                      </div>
                    </div>
                    {acc.id === activeAccount.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ededed]" />
                    )}
                  </div>
                ))}
                <div className="border-t border-[#26282f] mt-1 pt-1 px-1">
                  <button
                    onClick={() => {
                      openAccountModal();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#181a1e] rounded-[3px] flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prop Firm Fast Risk HUD */}
      {propStatus && activeAccount?.type === 'PROP_FIRM' && (
        <div className="hidden lg:flex items-center gap-5 bg-[#0f1013] px-3 py-1 rounded-[4px] border border-[#26282f] font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[#71717a]">Daily Buffer:</span>
            <span className={`font-semibold tabular-nums ${
              propStatus.dailyLossBreached ? 'text-[#f43f5e]' : 'text-[#10b981]'
            }`}>
              {formatCurrency(propStatus.dailyLossRemaining, activeAccount.currency)}
            </span>
            {propStatus.dailyLossBreached && <AlertTriangle className="w-3 h-3 text-[#f43f5e]" />}
          </div>

          <div className="w-px h-3 bg-[#26282f]" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[#71717a]">Max DD Buffer:</span>
            <span className={`font-semibold tabular-nums ${
              propStatus.totalLossBreached ? 'text-[#f43f5e]' : 'text-[#10b981]'
            }`}>
              {formatCurrency(propStatus.totalLossRemaining, activeAccount.currency)}
            </span>
          </div>

          {propStatus.profitTargetAmount && (
            <>
              <div className="w-px h-3 bg-[#26282f]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#71717a]">Target:</span>
                <span className={`font-semibold tabular-nums ${
                  propStatus.profitTargetReached ? 'text-[#10b981]' : 'text-[#f59e0b]'
                }`}>
                  {propStatus.profitTargetReached ? 'PASSED' : formatCurrency(propStatus.profitTargetRemaining, activeAccount.currency)}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Real Primary CTA (No simulation or backup buttons) */}
      <div className="flex items-center gap-2">
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
    </header>
  );
};
