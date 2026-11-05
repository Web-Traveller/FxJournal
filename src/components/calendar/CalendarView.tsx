import React, { useState, useMemo } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { Trade } from '../../types';
import { formatCurrency } from '../../lib/calculations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Camera, 
  X, 
  ArrowUpRight, 
  ArrowDownRight,
  Maximize2,
  DollarSign,
  Percent,
  Layers,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type MetricDisplayMode = 'dollar' | 'rr' | 'pips';

interface DayAggregate {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  closedTrades: Trade[];
  openTrades: Trade[];
  netPnl: number;
  grossWins: number;
  grossLosses: number;
  totalPips: number;
  totalRR: number;
  totalLots: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  pairs: string[];
  hasImages: boolean;
}

interface WeekAggregate {
  weekNumber: number;
  days: DayAggregate[];
  netPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalLots: number;
  totalRR: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarView: React.FC = () => {
  const { 
    accounts, 
    activeAccountId, 
    trades, 
    openTradeDialog,
    openLightbox 
  } = useJournalStore();

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  // Selected Year & Month state
  const [currentDate, setCurrentDate] = useState(() => {
    // If there are trades, initialize to the latest trade's month; otherwise current date
    const accountTrades = trades.filter((t) => t.account_id === activeAccountId);
    if (accountTrades.length > 0) {
      const dates = accountTrades
        .map((t) => new Date(t.exit_time || t.entry_time))
        .filter((d) => !isNaN(d.getTime()))
        .sort((a, b) => b.getTime() - a.getTime());
      if (dates.length > 0) {
        return new Date(dates[0].getFullYear(), dates[0].getMonth(), 1);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [metricMode, setMetricMode] = useState<MetricDisplayMode>('dollar');
  const [selectedDayData, setSelectedDayData] = useState<DayAggregate | null>(null);

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(selectedYear, selectedMonth - 1, 1));
    setSelectedDayData(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(selectedYear, selectedMonth + 1, 1));
    setSelectedDayData(null);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDayData(null);
  };

  // Filter trades for the active account
  const accountTrades = useMemo(() => {
    return trades.filter((t) => t.account_id === activeAccountId);
  }, [trades, activeAccountId]);

  // Aggregate trades by YYYY-MM-DD
  const tradesByDateMap = useMemo(() => {
    const map = new Map<string, { closed: Trade[]; open: Trade[] }>();

    accountTrades.forEach((t) => {
      // For closed trades, realized P&L is booked on exit_time (falling back to entry_time)
      const targetTime = t.status === 'CLOSED' ? (t.exit_time || t.entry_time) : t.entry_time;
      if (!targetTime) return;
      const dateStr = targetTime.slice(0, 10);

      if (!map.has(dateStr)) {
        map.set(dateStr, { closed: [], open: [] });
      }

      const entry = map.get(dateStr)!;
      if (t.status === 'CLOSED') {
        entry.closed.push(t);
      } else {
        entry.open.push(t);
      }
    });

    return map;
  }, [accountTrades]);

  // Construct Calendar Weeks & Days
  const { weeks, monthlyMetrics } = useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Monday-first calculation: JS 0 is Sunday, 1 is Monday... 6 is Saturday
    const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const prevMonthLastDay = new Date(selectedYear, selectedMonth, 0).getDate();

    const todayStr = new Date().toISOString().slice(0, 10);

    const allDays: DayAggregate[] = [];

    // 1. Leading days from previous month
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(selectedYear, selectedMonth - 1, dayNum);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const weekday = (d.getDay() + 6) % 7;
      const tradesForDay = tradesByDateMap.get(dateStr) || { closed: [], open: [] };

      allDays.push(buildDayAggregate(d, dateStr, dayNum, false, dateStr === todayStr, weekday >= 5, tradesForDay));
    }

    // 2. Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(selectedYear, selectedMonth, i);
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const weekday = (d.getDay() + 6) % 7;
      const tradesForDay = tradesByDateMap.get(dateStr) || { closed: [], open: [] };

      allDays.push(buildDayAggregate(d, dateStr, i, true, dateStr === todayStr, weekday >= 5, tradesForDay));
    }

    // 3. Trailing days to finish full week grid (multiple of 7)
    const totalRemaining = (7 - (allDays.length % 7)) % 7;
    for (let i = 1; i <= totalRemaining; i++) {
      const d = new Date(selectedYear, selectedMonth + 1, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const weekday = (d.getDay() + 6) % 7;
      const tradesForDay = tradesByDateMap.get(dateStr) || { closed: [], open: [] };

      allDays.push(buildDayAggregate(d, dateStr, i, false, dateStr === todayStr, weekday >= 5, tradesForDay));
    }

    // Chunk into 7-day weeks and compute weekly totals
    const weekChunks: WeekAggregate[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7);
      
      const closedInWeek = weekDays.flatMap((d) => d.closedTrades);
      const weekNetPnl = closedInWeek.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
      const weekWins = closedInWeek.filter((t) => (t.net_pnl ?? 0) > 0).length;
      const weekLosses = closedInWeek.filter((t) => (t.net_pnl ?? 0) < 0).length;
      const weekLots = closedInWeek.reduce((sum, t) => sum + t.lot_size, 0);
      const weekRR = closedInWeek.reduce((sum, t) => sum + (t.realized_rr ?? 0), 0);
      const winRate = closedInWeek.length > 0 ? (weekWins / closedInWeek.length) * 100 : 0;

      weekChunks.push({
        weekNumber: Math.floor(i / 7) + 1,
        days: weekDays,
        netPnl: weekNetPnl,
        tradeCount: closedInWeek.length,
        winCount: weekWins,
        lossCount: weekLosses,
        winRate,
        totalLots: weekLots,
        totalRR: weekRR,
      });
    }

    // Compute Monthly High-Level KPIs (restricted to current month days)
    const currentMonthDays = allDays.filter((d) => d.isCurrentMonth);
    const activeDays = currentMonthDays.filter((d) => d.closedTrades.length > 0);
    const greenDays = activeDays.filter((d) => d.netPnl > 0).length;
    const redDays = activeDays.filter((d) => d.netPnl < 0).length;
    const breakevenDays = activeDays.filter((d) => d.netPnl === 0).length;

    const monthlyClosedTrades = currentMonthDays.flatMap((d) => d.closedTrades);
    const monthlyNetPnl = monthlyClosedTrades.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
    const monthlyGrossWins = monthlyClosedTrades
      .filter((t) => (t.net_pnl ?? 0) > 0)
      .reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
    const monthlyGrossLosses = Math.abs(
      monthlyClosedTrades
        .filter((t) => (t.net_pnl ?? 0) < 0)
        .reduce((sum, t) => sum + (t.net_pnl ?? 0), 0)
    );
    const monthlyWins = monthlyClosedTrades.filter((t) => (t.net_pnl ?? 0) > 0).length;
    const monthlyLosses = monthlyClosedTrades.filter((t) => (t.net_pnl ?? 0) < 0).length;
    const monthlyWinRate = monthlyClosedTrades.length > 0 ? (monthlyWins / monthlyClosedTrades.length) * 100 : 0;
    const monthlyProfitFactor = monthlyGrossLosses > 0 ? (monthlyGrossWins / monthlyGrossLosses) : (monthlyGrossWins > 0 ? 99 : 0);
    const monthlyTotalRR = monthlyClosedTrades.reduce((sum, t) => sum + (t.realized_rr ?? 0), 0);
    const monthlyTotalLots = monthlyClosedTrades.reduce((sum, t) => sum + t.lot_size, 0);

    // Best & Worst day in month
    let bestDay: DayAggregate | null = null;
    let worstDay: DayAggregate | null = null;
    activeDays.forEach((d) => {
      if (!bestDay || d.netPnl > bestDay.netPnl) bestDay = d;
      if (!worstDay || d.netPnl < worstDay.netPnl) worstDay = d;
    });

    const startingCapital = activeAccount?.starting_balance || 100000;
    const monthlyRoi = (monthlyNetPnl / startingCapital) * 100;
    const greenDayPct = activeDays.length > 0 ? (greenDays / activeDays.length) * 100 : 0;

    return {
      weeks: weekChunks,
      monthlyMetrics: {
        netPnl: monthlyNetPnl,
        grossWins: monthlyGrossWins,
        grossLosses: monthlyGrossLosses,
        tradeCount: monthlyClosedTrades.length,
        winCount: monthlyWins,
        lossCount: monthlyLosses,
        winRate: monthlyWinRate,
        profitFactor: monthlyProfitFactor,
        activeDaysCount: activeDays.length,
        greenDays,
        redDays,
        breakevenDays,
        greenDayPct,
        monthlyRoi,
        totalRR: monthlyTotalRR,
        totalLots: monthlyTotalLots,
        bestDay: bestDay as DayAggregate | null,
        worstDay: worstDay as DayAggregate | null,
        avgDailyPnl: activeDays.length > 0 ? monthlyNetPnl / activeDays.length : 0,
      },
    };
  }, [selectedYear, selectedMonth, tradesByDateMap, activeAccount]);

  // Helper builder for DayAggregate
  function buildDayAggregate(
    date: Date,
    dateStr: string,
    dayNumber: number,
    isCurrentMonth: boolean,
    isToday: boolean,
    isWeekend: boolean,
    tradesPair: { closed: Trade[]; open: Trade[] }
  ): DayAggregate {
    const closed = tradesPair.closed;
    const open = tradesPair.open;
    const netPnl = closed.reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
    const grossWins = closed.filter((t) => (t.net_pnl ?? 0) > 0).reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
    const grossLosses = Math.abs(closed.filter((t) => (t.net_pnl ?? 0) < 0).reduce((sum, t) => sum + (t.net_pnl ?? 0), 0));
    const totalPips = closed.reduce((sum, t) => sum + (t.pips ?? 0), 0);
    const totalRR = closed.reduce((sum, t) => sum + (t.realized_rr ?? 0), 0);
    const totalLots = closed.reduce((sum, t) => sum + t.lot_size, 0) + open.reduce((sum, t) => sum + t.lot_size, 0);
    const winCount = closed.filter((t) => (t.net_pnl ?? 0) > 0).length;
    const lossCount = closed.filter((t) => (t.net_pnl ?? 0) < 0).length;
    const breakevenCount = closed.filter((t) => (t.net_pnl ?? 0) === 0).length;
    const pairs = Array.from(new Set([...closed.map((t) => t.pair), ...open.map((t) => t.pair)]));
    const hasImages = [...closed, ...open].some((t) => (t.images && t.images.length > 0));

    return {
      dateStr,
      dayNumber,
      date,
      isCurrentMonth,
      isToday,
      isWeekend,
      closedTrades: closed,
      openTrades: open,
      netPnl,
      grossWins,
      grossLosses,
      totalPips,
      totalRR,
      totalLots,
      winCount,
      lossCount,
      breakevenCount,
      pairs,
      hasImages,
    };
  }

  return (
    <div className="space-y-4 font-sans select-none">
      {/* ========================================================= */}
      {/* 1. CALENDAR HEADER TOOLBAR */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#26282f] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#fafafa] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#34d399]" />
              P&L Execution Calendar
            </h1>
            <Badge variant="neutral" size="xs">
              {activeAccount?.type === 'PROP_FIRM' ? 'PROP FIRM' : 'BROKERAGE'}
            </Badge>
          </div>
          <p className="text-xs text-[#8a8f98] font-mono mt-0.5">
            {activeAccount?.name || 'Institutional Account'} • Wall Street Monthly P&L Ledger
          </p>
        </div>

        {/* Controls: Month Switcher, Metric Mode, Log Trade */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Month Navigator */}
          <div className="flex items-center bg-[#131417] border border-[#26282f] rounded-[4px] p-0.5 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-[3px] text-[#71717a] hover:text-[#fafafa] hover:bg-[#181a1e] transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 font-mono text-xs font-semibold text-[#fafafa] min-w-36 text-center">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-[3px] text-[#71717a] hover:text-[#fafafa] hover:bg-[#181a1e] transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="secondary" size="xs" onClick={handleToday}>
            Current Month
          </Button>

          {/* Metric Display Mode Switcher */}
          <div className="flex items-center bg-[#131417] border border-[#26282f] rounded-[4px] p-0.5 text-xs font-mono">
            <button
              onClick={() => setMetricMode('dollar')}
              className={`px-2.5 py-1 rounded-[3px] transition cursor-pointer ${
                metricMode === 'dollar'
                  ? 'bg-[#181a1e] text-[#fafafa] font-bold border border-[#26282f]'
                  : 'text-[#71717a] hover:text-[#ededed]'
              }`}
            >
              $ Net PnL
            </button>
            <button
              onClick={() => setMetricMode('rr')}
              className={`px-2.5 py-1 rounded-[3px] transition cursor-pointer ${
                metricMode === 'rr'
                  ? 'bg-[#181a1e] text-[#fafafa] font-bold border border-[#26282f]'
                  : 'text-[#71717a] hover:text-[#ededed]'
              }`}
            >
              R:R
            </button>
            <button
              onClick={() => setMetricMode('pips')}
              className={`px-2.5 py-1 rounded-[3px] transition cursor-pointer ${
                metricMode === 'pips'
                  ? 'bg-[#181a1e] text-[#fafafa] font-bold border border-[#26282f]'
                  : 'text-[#71717a] hover:text-[#ededed]'
              }`}
            >
              Pips
            </button>
          </div>

          {/* Rapid Log Trade Button */}
          <Button
            variant="primary"
            size="xs"
            onClick={() => openTradeDialog()}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Log Trade
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MONTHLY KPI PERFORMANCE BAR */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Net Realized PnL */}
        <div className="p-3 bg-[#131417] border border-[#26282f] rounded-[6px]">
          <span className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider block">
            Monthly Net P&L
          </span>
          <div className={`text-base font-bold font-mono tracking-tight mt-0.5 ${
            monthlyMetrics.netPnl > 0 ? 'text-[#10b981]' : monthlyMetrics.netPnl < 0 ? 'text-[#f43f5e]' : 'text-[#fafafa]'
          }`}>
            {monthlyMetrics.netPnl > 0 ? '+' : ''}{formatCurrency(monthlyMetrics.netPnl, activeAccount?.currency || 'USD')}
          </div>
          <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5">
            {monthlyMetrics.monthlyRoi > 0 ? '+' : ''}{monthlyMetrics.monthlyRoi.toFixed(2)}% on capital
          </div>
        </div>

        {/* Green Day Rate */}
        <div className="p-3 bg-[#131417] border border-[#26282f] rounded-[6px]">
          <span className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider block">
            Green Day Rate
          </span>
          <div className="text-base font-bold font-mono text-[#fafafa] tracking-tight mt-0.5">
            {monthlyMetrics.greenDayPct.toFixed(0)}%
          </div>
          <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5">
            <span className="text-[#10b981] font-bold">{monthlyMetrics.greenDays}W</span>
            {' / '}
            <span className="text-[#f43f5e] font-bold">{monthlyMetrics.redDays}L</span>
            {monthlyMetrics.breakevenDays > 0 ? ` / ${monthlyMetrics.breakevenDays}BE` : ''}
          </div>
        </div>

        {/* Win Rate & Trades */}
        <div className="p-3 bg-[#131417] border border-[#26282f] rounded-[6px]">
          <span className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider block">
            Trade Win Rate
          </span>
          <div className="text-base font-bold font-mono text-[#fafafa] tracking-tight mt-0.5">
            {monthlyMetrics.winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5">
            {monthlyMetrics.tradeCount} executions closed
          </div>
        </div>

        {/* Profit Factor */}
        <div className="p-3 bg-[#131417] border border-[#26282f] rounded-[6px]">
          <span className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider block">
            Profit Factor
          </span>
          <div className="text-base font-bold font-mono text-[#fafafa] tracking-tight mt-0.5">
            {monthlyMetrics.profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5">
            Wins {formatCurrency(monthlyMetrics.grossWins)}
          </div>
        </div>

        {/* Best Day */}
        <div className="p-3 bg-[#131417] border border-[#26282f] rounded-[6px]">
          <span className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider block">
            Best Trading Day
          </span>
          <div className="text-base font-bold font-mono text-[#10b981] tracking-tight mt-0.5">
            {monthlyMetrics.bestDay ? `+${formatCurrency(monthlyMetrics.bestDay.netPnl)}` : '—'}
          </div>
          <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5 truncate">
            {monthlyMetrics.bestDay ? `${MONTH_NAMES[selectedMonth].slice(0, 3)} ${monthlyMetrics.bestDay.dayNumber}` : 'No closed trades'}
          </div>
        </div>

        {/* Realized R:R & Lots */}
        <div className="p-3 bg-[#131417] border border-[#26282f] rounded-[6px]">
          <span className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider block">
            Realized Edge
          </span>
          <div className="text-base font-bold font-mono text-[#fafafa] tracking-tight mt-0.5">
            {monthlyMetrics.totalRR > 0 ? '+' : ''}{monthlyMetrics.totalRR.toFixed(2)}R
          </div>
          <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5">
            {monthlyMetrics.totalLots.toFixed(2)} total lots
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. CALENDAR GRID WITH 8TH WEEKLY TOTAL COLUMN */}
      {/* ========================================================= */}
      <div className="bg-[#131417] border border-[#26282f] rounded-[6px] p-3 shadow-xl overflow-x-auto">
        <div className="min-w-[880px]">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2 pb-2 border-b border-[#26282f] text-center font-mono text-[11px] font-semibold text-[#71717a]">
            {WEEKDAY_NAMES.map((name, idx) => (
              <div 
                key={name} 
                className={`py-1 ${idx >= 5 ? 'text-[#52525b]' : 'text-[#a1a1aa]'}`}
              >
                {name}
                {idx >= 5 && <span className="text-[9px] text-[#3f3f46] ml-1">(Off)</span>}
              </div>
            ))}
            <div className="py-1 text-[#34d399] bg-[#10b981]/5 rounded-[3px] border border-[#10b981]/20 font-bold">
              Weekly Totals
            </div>
          </div>

          {/* Week Rows */}
          <div className="space-y-2">
            {weeks.map((week) => (
              <div key={week.weekNumber} className="grid grid-cols-8 gap-2">
                {/* 7 Days of the Week */}
                {week.days.map((day) => {
                  const hasClosed = day.closedTrades.length > 0;
                  const hasOpen = day.openTrades.length > 0;
                  const isPositive = day.netPnl > 0;
                  const isNegative = day.netPnl < 0;
                  const isBreakeven = hasClosed && day.netPnl === 0;
                  const isSelected = selectedDayData?.dateStr === day.dateStr;

                  // Dynamic Day Cell Background
                  let cardBg = 'bg-[#0f1013] border-[#22242a]';
                  if (!day.isCurrentMonth) {
                    cardBg = 'bg-[#090a0c]/60 border-[#1c1d22]/50 opacity-40';
                  } else if (hasClosed) {
                    if (isPositive) {
                      cardBg = 'bg-[#10b981]/8 border-emerald-500/35 hover:border-emerald-500/60 shadow-sm';
                    } else if (isNegative) {
                      cardBg = 'bg-[#f43f5e]/8 border-rose-500/35 hover:border-rose-500/60 shadow-sm';
                    } else {
                      cardBg = 'bg-[#181a1e] border-[#363943]';
                    }
                  } else if (day.isWeekend) {
                    cardBg = 'bg-[#0b0c0e] border-[#1c1d22] opacity-65';
                  }

                  if (isSelected) {
                    cardBg += ' ring-1 ring-[#fafafa] border-[#fafafa]';
                  }

                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => setSelectedDayData(day)}
                      className={`min-h-[102px] p-2 rounded-[4px] border flex flex-col justify-between transition cursor-pointer relative group ${cardBg}`}
                    >
                      {/* Top Row: Day Number, Today Indicator, Screenshot badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] font-mono font-bold ${
                            day.isToday 
                              ? 'w-5 h-5 rounded-full bg-[#fafafa] text-[#0c0d0e] flex items-center justify-center font-extrabold shadow-sm'
                              : day.isCurrentMonth ? 'text-[#d4d4d8]' : 'text-[#52525b]'
                          }`}>
                            {day.dayNumber}
                          </span>
                          {hasOpen && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Open Position active" />
                          )}
                        </div>

                        {/* Screenshot Indicator Icon */}
                        {day.hasImages && (
                          <div className="flex items-center text-[#71717a] group-hover:text-[#fafafa] transition" title="Chart Screenshot Attached">
                            <Camera className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Middle: Performance Metric or Neutral placeholder */}
                      <div className="my-1">
                        {hasClosed ? (
                          <div>
                            {/* Metric Value based on mode */}
                            <div className={`font-mono text-xs font-bold tracking-tight truncate ${
                              isPositive ? 'text-[#10b981]' : isNegative ? 'text-[#f43f5e]' : 'text-[#a1a1aa]'
                            }`}>
                              {metricMode === 'dollar' && (
                                <>
                                  {isPositive ? '+' : ''}{formatCurrency(day.netPnl, activeAccount?.currency || 'USD')}
                                </>
                              )}
                              {metricMode === 'rr' && (
                                <>
                                  {day.totalRR > 0 ? '+' : ''}{day.totalRR.toFixed(2)}R
                                </>
                              )}
                              {metricMode === 'pips' && (
                                <>
                                  {day.totalPips > 0 ? '+' : ''}{day.totalPips.toFixed(1)}p
                                </>
                              )}
                            </div>

                            {/* Trade Scorecard: W / L */}
                            <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5 flex items-center gap-1">
                              <span>{day.closedTrades.length} trd</span>
                              <span>•</span>
                              <span className="text-[#10b981] font-semibold">{day.winCount}W</span>
                              {day.lossCount > 0 && (
                                <span className="text-[#f43f5e] font-semibold">/{day.lossCount}L</span>
                              )}
                            </div>
                          </div>
                        ) : hasOpen ? (
                          <div className="text-[10px] font-mono text-amber-400/90 font-semibold flex items-center gap-1">
                            <span>{day.openTrades.length} Running</span>
                          </div>
                        ) : (
                          <div className="h-6" />
                        )}
                      </div>

                      {/* Bottom Row: Pair Badges */}
                      <div className="flex items-center gap-1 overflow-hidden pt-1">
                        {day.pairs.slice(0, 2).map((pair) => (
                          <span
                            key={pair}
                            className="px-1 py-0.2 rounded-[2px] bg-[#181a1e] border border-[#26282f] text-[9px] font-mono text-[#a1a1aa] truncate"
                          >
                            {pair}
                          </span>
                        ))}
                        {day.pairs.length > 2 && (
                          <span className="text-[9px] font-mono text-[#71717a]">
                            +{day.pairs.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 8th Column: Weekly Total Card */}
                <div className={`min-h-[102px] p-2 rounded-[4px] border flex flex-col justify-between font-mono ${
                  week.tradeCount > 0
                    ? week.netPnl > 0
                      ? 'bg-[#10b981]/12 border-emerald-500/40 text-[#fafafa]'
                      : week.netPnl < 0
                      ? 'bg-[#f43f5e]/12 border-rose-500/40 text-[#fafafa]'
                      : 'bg-[#181a1e] border-[#26282f]'
                    : 'bg-[#0f1013] border-[#22242a] text-[#52525b]'
                }`}>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#71717a] font-semibold">
                    <span>W{week.weekNumber} Total</span>
                    {week.tradeCount > 0 && (
                      <span className="text-[9px] text-[#a1a1aa]">{week.winRate.toFixed(0)}% WR</span>
                    )}
                  </div>

                  <div className="my-1">
                    {week.tradeCount > 0 ? (
                      <div>
                        <div className={`text-xs font-bold tracking-tight ${
                          week.netPnl > 0 ? 'text-[#10b981]' : week.netPnl < 0 ? 'text-[#f43f5e]' : 'text-[#fafafa]'
                        }`}>
                          {metricMode === 'dollar' && (
                            <>{week.netPnl > 0 ? '+' : ''}{formatCurrency(week.netPnl, activeAccount?.currency || 'USD')}</>
                          )}
                          {metricMode === 'rr' && (
                            <>{week.totalRR > 0 ? '+' : ''}{week.totalRR.toFixed(2)}R</>
                          )}
                          {metricMode === 'pips' && (
                            <>{week.netPnl > 0 ? '+' : ''}{formatCurrency(week.netPnl)}</>
                          )}
                        </div>
                        <div className="text-[10px] text-[#a1a1aa] mt-0.5">
                          {week.tradeCount} trades ({week.winCount}W / {week.lossCount}L)
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#52525b]">No trades</div>
                    )}
                  </div>

                  <div className="text-[9px] text-[#71717a]">
                    {week.totalLots > 0 ? `${week.totalLots.toFixed(2)} lots` : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. DAY DETAIL EXECUTION INSPECTOR DRAWER / MODAL */}
      {/* ========================================================= */}
      {selectedDayData && (
        <div className="bg-[#131417] border border-[#26282f] rounded-[6px] p-4 shadow-2xl transition animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#26282f] pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-4 h-4 text-[#34d399]" />
              <div>
                <h3 className="text-sm font-bold text-[#fafafa]">
                  Execution Ledger • {selectedDayData.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#8a8f98] mt-0.5">
                  <span>Net P&L: </span>
                  <span className={`font-bold ${
                    selectedDayData.netPnl > 0 ? 'text-[#10b981]' : selectedDayData.netPnl < 0 ? 'text-[#f43f5e]' : 'text-[#fafafa]'
                  }`}>
                    {selectedDayData.netPnl > 0 ? '+' : ''}{formatCurrency(selectedDayData.netPnl, activeAccount?.currency || 'USD')}
                  </span>
                  <span>•</span>
                  <span>{selectedDayData.closedTrades.length} Closed</span>
                  {selectedDayData.openTrades.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">{selectedDayData.openTrades.length} Running Open</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{selectedDayData.totalLots.toFixed(2)} lots volume</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="xs"
                onClick={() => {
                  openTradeDialog();
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Log Trade on Date
              </Button>
              <button
                onClick={() => setSelectedDayData(null)}
                className="p-1.5 rounded-[4px] text-[#71717a] hover:text-[#fafafa] hover:bg-[#181a1e] transition cursor-pointer"
                title="Close Day Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trade Cards List for this day */}
          {selectedDayData.closedTrades.length === 0 && selectedDayData.openTrades.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-[#71717a]">
              No trade executions recorded on this date. Click "Log Trade on Date" to add an entry.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Closed Trades */}
              {selectedDayData.closedTrades.map((trade) => {
                const isWin = (trade.net_pnl ?? 0) > 0;
                return (
                  <div
                    key={trade.id}
                    className="p-3 bg-[#0c0d0e] border border-[#26282f] rounded-[4px] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs hover:border-[#363943] transition"
                  >
                    {/* Left: Instrument & Direction */}
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold ${
                        trade.direction === 'BUY'
                          ? 'bg-[#10b981]/15 text-[#10b981] border border-emerald-500/30'
                          : 'bg-[#f43f5e]/15 text-[#f43f5e] border border-rose-500/30'
                      }`}>
                        {trade.direction}
                      </span>
                      <div>
                        <div className="font-bold text-[#fafafa] text-sm flex items-center gap-1.5">
                          <span>{trade.pair}</span>
                          <span className="text-xs text-[#71717a] font-normal">{trade.lot_size.toFixed(2)} lots</span>
                        </div>
                        <div className="text-[10px] text-[#71717a] flex items-center gap-2 mt-0.5">
                          <span>Entry: {trade.entry_price}</span>
                          <span>→</span>
                          <span>Exit: {trade.exit_price ?? '—'}</span>
                          {trade.session && (
                            <span className="px-1 py-0.2 bg-[#181a1e] text-[#a1a1aa] rounded-[2px] border border-[#26282f]">
                              {trade.session}
                            </span>
                          )}
                          {trade.strategy_tag && (
                            <span className="text-[#a1a1aa]">({trade.strategy_tag})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Metrics & Screenshots */}
                    <div className="flex items-center gap-4">
                      {/* Pips & RR */}
                      <div className="text-right">
                        <div className="text-[10px] text-[#71717a]">
                          {trade.pips != null ? `${trade.pips > 0 ? '+' : ''}${trade.pips.toFixed(1)} pips` : '—'}
                          {' • '}
                          {trade.realized_rr != null ? `${trade.realized_rr.toFixed(2)}R` : '—'}
                        </div>
                        <div className={`font-bold text-sm ${
                          isWin ? 'text-[#10b981]' : (trade.net_pnl ?? 0) < 0 ? 'text-[#f43f5e]' : 'text-[#fafafa]'
                        }`}>
                          {isWin ? '+' : ''}{formatCurrency(trade.net_pnl ?? 0, activeAccount?.currency || 'USD')}
                        </div>
                      </div>

                      {/* Attached Screenshots Thumbnails */}
                      {trade.images && trade.images.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {trade.images.map((img) => (
                            <div
                              key={img.id}
                              onClick={() => openLightbox({ url: img.data_url, label: img.label, tradeId: trade.id })}
                              className="w-10 h-10 rounded-[3px] border border-[#26282f] hover:border-[#fafafa] overflow-hidden cursor-pointer relative group transition"
                              title={img.label}
                            >
                              <img src={img.data_url} alt={img.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Maximize2 className="w-3 h-3 text-[#fafafa]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Running Open Trades */}
              {selectedDayData.openTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="p-3 bg-[#0c0d0e] border border-amber-500/30 rounded-[4px] flex items-center justify-between font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      OPEN {trade.direction}
                    </span>
                    <div>
                      <div className="font-bold text-[#fafafa] text-sm">
                        {trade.pair} • {trade.lot_size.toFixed(2)} lots
                      </div>
                      <div className="text-[10px] text-[#71717a]">
                        Entry: {trade.entry_price} • SL: {trade.stop_loss ?? 'None'} • TP: {trade.take_profit ?? 'None'}
                      </div>
                    </div>
                  </div>
                  <Badge variant="caution" size="xs">FLOATING</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
