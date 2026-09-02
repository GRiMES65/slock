import { useState, useMemo } from 'react';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
} from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Clock,
  Layers,
  Zap,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Database,
  Filter,
} from 'lucide-react';
import { formatMinutes, formatHours } from '../utils/timeUtils';

const FILTERS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'all', label: 'All Time' },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black border-2 border-zinc-800 p-2 font-mono text-xs shadow-[3px_3px_0px_#FF5500]">
        <div className="text-zinc-400 font-bold">{data.label || data.day}</div>
        <div className="text-[#FF5500] font-black text-sm">{data.hours.toFixed(1)}h ({formatMinutes(data.minutes)})</div>
      </div>
    );
  }
  return null;
};

export default function PeriodAnalytics({
  sessions = [],
  removeSession,
  clearAllSessions,
  resetToSampleData,
}) {
  const [activeFilter, setActiveFilter] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmClear, setConfirmClear] = useState(false);

  // Date Navigation handlers
  const handlePrev = () => {
    if (activeFilter === 'daily') setSelectedDate((d) => subDays(d, 1));
    else if (activeFilter === 'weekly') setSelectedDate((d) => subWeeks(d, 1));
    else if (activeFilter === 'monthly') setSelectedDate((d) => subMonths(d, 1));
  };

  const handleNext = () => {
    if (activeFilter === 'daily') setSelectedDate((d) => addDays(d, 1));
    else if (activeFilter === 'weekly') setSelectedDate((d) => addWeeks(d, 1));
    else if (activeFilter === 'monthly') setSelectedDate((d) => addMonths(d, 1));
  };

  const handleResetToToday = () => {
    setSelectedDate(new Date());
  };

  // Filter sessions and compute chart data based on activeFilter
  const { filteredSessions, periodLabel, chartData, stats } = useMemo(() => {
    let list = [];
    let label = '';
    let chart = [];

    if (activeFilter === 'daily') {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      label = format(selectedDate, 'EEEE · MMM d, yyyy').toUpperCase();

      list = sessions.filter((s) => {
        const sDate = format(new Date(s.endTime || s.startTime), 'yyyy-MM-dd');
        return sDate === dateKey;
      });

      // 24-hour distribution (grouped in 4-hour blocks for punchy brutalist view)
      const blocks = [
        { label: '00-04h', start: 0, end: 4, minutes: 0 },
        { label: '04-08h', start: 4, end: 8, minutes: 0 },
        { label: '08-12h', start: 8, end: 12, minutes: 0 },
        { label: '12-16h', start: 12, end: 16, minutes: 0 },
        { label: '16-20h', start: 16, end: 20, minutes: 0 },
        { label: '20-24h', start: 20, end: 24, minutes: 0 },
      ];

      list.forEach((s) => {
        const sTime = new Date(s.endTime || s.startTime);
        const hour = sTime.getHours();
        const block = blocks.find((b) => hour >= b.start && hour < b.end);
        if (block) block.minutes += s.totalStudyMinutes || 0;
      });

      chart = blocks.map((b) => ({
        day: b.label,
        label: `${b.label} Interval`,
        hours: b.minutes / 60,
        minutes: b.minutes,
      }));
    } else if (activeFilter === 'weekly') {
      const wStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const wEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      label = `WEEK OF ${format(wStart, 'MMM d').toUpperCase()} – ${format(wEnd, 'MMM d, yyyy').toUpperCase()}`;

      list = sessions.filter((s) => {
        const d = new Date(s.endTime || s.startTime);
        return d >= wStart && d <= wEnd;
      });

      // Monday through Sunday (7 days)
      chart = Array.from({ length: 7 }, (_, i) => {
        const dayDate = addDays(wStart, i);
        const dayStr = format(dayDate, 'yyyy-MM-dd');
        const daySessions = list.filter(
          (s) => format(new Date(s.endTime || s.startTime), 'yyyy-MM-dd') === dayStr
        );
        const dayMinutes = daySessions.reduce((sum, s) => sum + (s.totalStudyMinutes || 0), 0);

        return {
          day: format(dayDate, 'EEE').toUpperCase(),
          label: format(dayDate, 'EEEE, MMM d'),
          hours: dayMinutes / 60,
          minutes: dayMinutes,
          isToday: isToday(dayDate),
        };
      });
    } else if (activeFilter === 'monthly') {
      const mStart = startOfMonth(selectedDate);
      const mEnd = endOfMonth(selectedDate);
      label = format(selectedDate, 'MMMM yyyy').toUpperCase();

      list = sessions.filter((s) => {
        const d = new Date(s.endTime || s.startTime);
        return d >= mStart && d <= mEnd;
      });

      // 4 or 5 weeks of the month
      const weeksCount = 5;
      chart = Array.from({ length: weeksCount }, (_, i) => {
        const weekStartDay = i * 7 + 1;
        const weekEndDay = Math.min(weekStartDay + 6, mEnd.getDate());
        const weekSessions = list.filter((s) => {
          const d = new Date(s.endTime || s.startTime);
          return d.getDate() >= weekStartDay && d.getDate() <= weekEndDay;
        });
        const weekMins = weekSessions.reduce((sum, s) => sum + (s.totalStudyMinutes || 0), 0);

        return {
          day: `WK 0${i + 1}`,
          label: `Days ${weekStartDay} - ${weekEndDay}`,
          hours: weekMins / 60,
          minutes: weekMins,
        };
      });
    } else {
      // ALL TIME
      label = 'ALL-TIME HISTORICAL TELEMETRY';
      list = [...sessions];

      // Last 6 months aggregate
      const now = new Date();
      chart = Array.from({ length: 6 }, (_, i) => {
        const mDate = subMonths(now, 5 - i);
        const mKey = format(mDate, 'yyyy-MM');
        const mSessions = list.filter((s) => {
          return format(new Date(s.endTime || s.startTime), 'yyyy-MM') === mKey;
        });
        const mins = mSessions.reduce((sum, s) => sum + (s.totalStudyMinutes || 0), 0);

        return {
          day: format(mDate, 'MMM').toUpperCase(),
          label: format(mDate, 'MMMM yyyy'),
          hours: mins / 60,
          minutes: mins,
        };
      });
    }

    // Compute period KPI stats
    const totalMins = list.reduce((sum, s) => sum + (s.totalStudyMinutes || 0), 0);
    const sessionCount = list.length;
    const avgMins = sessionCount > 0 ? Math.round(totalMins / sessionCount) : 0;
    const completedCount = list.filter((s) => s.completed !== false).length;
    const completionRate = sessionCount > 0 ? Math.round((completedCount / sessionCount) * 100) : 100;

    return {
      filteredSessions: list,
      periodLabel: label,
      chartData: chart,
      stats: {
        totalMins,
        sessionCount,
        avgMins,
        completionRate,
      },
    };
  }, [sessions, activeFilter, selectedDate]);

  const maxHours = Math.max(...chartData.map((d) => d.hours), 1);

  return (
    <div className="space-y-5">
      {/* FILTER CONTROL BUTTONS - Brutalist Segment Tabs */}
      <div className="brutal-card p-2 bg-black border-2 border-zinc-800">
        <div className="grid grid-cols-4 gap-1.5">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFilter(f.id);
                  setSelectedDate(new Date());
                }}
                className={`py-2 px-2 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[2px_2px_0px_#ffffff]'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-900 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PERIOD NAVIGATION HEADER */}
      <div className="flex items-center justify-between bg-black border-2 border-zinc-800 p-3 font-mono">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#FF5500]" />
          <span className="text-xs font-bold text-white tracking-wider">
            {periodLabel}
          </span>
        </div>

        {activeFilter !== 'all' ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-600 font-bold"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetToToday}
              className="px-2 py-1 text-[10px] border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-[#FF5500] hover:border-[#FF5500]"
            >
              NOW
            </button>
            <button
              onClick={handleNext}
              className="p-1 border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-600 font-bold"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-zinc-500 uppercase border border-zinc-800 px-2 py-0.5">
            ALL DATA
          </span>
        )}
      </div>

      {/* DEDICATED PERIOD KPIS (NO EMOJIS - PURE TECHNICAL) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        {/* Metric 1 */}
        <div className="brutal-card p-3 bg-black border-2 border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">TOTAL TIME</span>
            <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
          </div>
          <div className="text-xl font-black text-white">
            {formatHours(stats.totalMins / 60)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {formatMinutes(stats.totalMins)}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="brutal-card p-3 bg-black border-2 border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">SESSIONS</span>
            <Layers className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <div className="text-xl font-black text-white">
            {stats.sessionCount}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Blocks recorded
          </div>
        </div>

        {/* Metric 3 */}
        <div className="brutal-card p-3 bg-black border-2 border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">AVG DURATION</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-white">
            {stats.avgMins > 0 ? `${stats.avgMins}m` : '0m'}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Per session
          </div>
        </div>

        {/* Metric 4 */}
        <div className="brutal-card p-3 bg-black border-2 border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">COMPLETION</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-white">
            {stats.completionRate}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Finished full goal
          </div>
        </div>
      </div>

      {/* DEDICATED PERIOD VISUAL BREAKDOWN CHART */}
      <div className="brutal-card p-5 bg-black border-2 border-zinc-800 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
          <span className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
            [BREAKDOWN // {activeFilter.toUpperCase()} DISTRIBUTION]
          </span>
          <span className="font-mono text-xs text-[#FF5500] font-bold">
            {formatHours(stats.totalMins / 60)} TOTAL
          </span>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 4, bottom: 0, left: -24 }}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="day"
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600 }}
              />
              <YAxis
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
                tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                tickFormatter={(v) => `${v}h`}
                domain={[0, Math.ceil(maxHours)]}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255, 85, 0, 0.05)' }}
              />
              <Bar dataKey="hours" maxBarSize={36}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.hours > 0
                        ? entry.isToday
                          ? '#ffffff'
                          : '#FF5500'
                        : '#18181b'
                    }
                    stroke={entry.isToday ? '#FF5500' : '#27272a'}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SCOPED SESSION LOG FOR THIS FILTER */}
      <div className="brutal-card p-5 bg-black border-2 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-white font-bold uppercase tracking-wider">
              [LOGGED SESSIONS // {activeFilter.toUpperCase()}]
            </span>
            <span className="font-mono text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.2">
              {filteredSessions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {filteredSessions.length > 0 && clearAllSessions && (
              confirmClear ? (
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-red-900 px-2 py-1">
                  <span className="font-mono text-[10px] text-zinc-400">Wipe all sessions?</span>
                  <button
                    onClick={() => {
                      clearAllSessions();
                      setConfirmClear(false);
                    }}
                    className="font-mono text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 border border-red-500 hover:bg-red-500"
                  >
                    YES
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="font-mono text-[10px] text-zinc-400 border border-zinc-800 px-1.5 py-0.5 hover:text-white"
                  >
                    NO
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="font-mono text-[10px] text-red-500 hover:text-red-400 border border-zinc-900 hover:border-red-900 px-2 py-0.5 transition-colors"
                >
                  Clear All
                </button>
              )
            )}
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 font-mono border border-dashed border-zinc-900 text-zinc-600 text-xs">
            [NO STUDY SESSIONS RECORDED IN THIS WINDOW]
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 border border-zinc-800 bg-black text-zinc-400">
                    {session.type === 'session' ? 'PLAN' : 'QUICK'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {format(new Date(session.endTime || session.startTime), 'MMM d · HH:mm')}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {session.completed !== false ? (
                        <span className="text-emerald-500">[COMPLETED]</span>
                      ) : (
                        <span className="text-amber-500">[STOPPED EARLY]</span>
                      )}
                      {session.intervalsCompleted ? ` · ${session.intervalsCompleted} cycles` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#FF5500]">
                    {formatMinutes(session.totalStudyMinutes)}
                  </span>
                  {removeSession && (
                    <button
                      onClick={() => removeSession(session.id)}
                      className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
