import React from 'react';
import { useJournalStore, NavigationTab } from '../../stores/useJournalStore';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar,
  Radio, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../../lib/calculations';
import { Badge } from '../ui/Badge';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, accounts, activeAccountId, trades } = useJournalStore();
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const accountTrades = trades.filter(t => t.account_id === activeAccountId);
  const openTradesCount = accountTrades.filter(t => t.status === 'OPEN').length;
  const closedTrades = accountTrades.filter(t => t.status === 'CLOSED');
  const wins = closedTrades.filter(t => (t.net_pnl ?? 0) > 0).length;
  const winRate = closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(0) : '0';
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);

  const isPropFirm = activeAccount?.type === 'PROP_FIRM';

  const navItems: { id: NavigationTab; label: string; icon: React.ElementType; badge?: number | string; badgeVariant?: 'caution' | 'neutral' }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'journal', label: 'Trade Journal', icon: BookOpen, badge: closedTrades.length, badgeVariant: 'neutral' },
    { id: 'calendar', label: 'P&L Calendar', icon: Calendar },
    { id: 'open-trades', label: 'Open Positions', icon: Radio, badge: openTradesCount > 0 ? openTradesCount : undefined, badgeVariant: 'caution' },
    ...(isPropFirm ? [{ id: 'propfirm' as NavigationTab, label: 'Prop Firm Rules', icon: ShieldCheck }] : []),
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-52 bg-[#0c0d0e] border-r border-[#26282f] flex flex-col justify-between shrink-0 select-none font-sans">
      {/* Navigation List */}
      <div className="p-2.5 space-y-0.5">
        <div className="px-2.5 py-1.5 text-[10px] font-medium text-[#71717a] uppercase tracking-wider font-mono">
          Terminal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#181a1e] text-[#fafafa] font-semibold border border-[#26282f]'
                  : 'text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#131417]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#fafafa]' : 'text-[#71717a]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <Badge 
                  variant={item.badgeVariant || 'neutral'} 
                  size="xs"
                  pulse={item.id === 'open-trades' && openTradesCount > 0}
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Account Performance Mini Card */}
      {activeAccount && (
        <div className="p-3 m-2.5 rounded-[4px] bg-[#131417] border border-[#26282f] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#71717a] font-medium truncate max-w-[110px]">
              {activeAccount.name}
            </span>
            <span className="text-[10px] font-mono text-[#a1a1aa]">
              {activeAccount.currency}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-[#71717a]">Realized:</span>
              <span className={`font-mono font-bold tabular-nums flex items-center text-xs ${
                totalPnl >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'
              }`}>
                {totalPnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {formatCurrency(totalPnl, activeAccount.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#71717a]">Win Rate:</span>
              <span className="font-mono text-[#ededed] font-semibold">{winRate}%</span>
            </div>

            <div className="w-full bg-[#0c0d0e] h-1 rounded-[1px] overflow-hidden border border-[#26282f]">
              <div 
                className="bg-[#10b981] h-full rounded-[1px] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, Number(winRate)))}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
