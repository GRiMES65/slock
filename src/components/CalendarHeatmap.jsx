import { useMemo } from 'react';
import {
  startOfWeek,
  subWeeks,
  addDays,
  format,
  isToday,
  isFuture,
} from 'date-fns';
import { Flame } from 'lucide-react';
import { formatMinutes } from '../utils/timeUtils';

const WEEKS_TO_SHOW = 22; // ~5.5 months of cadence history
const DAY_LABELS = ['M', '', 'W', '', 'F', '', 'S'];

function getOrangeIntensity(minutes) {
  if (!minutes || minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  if (minutes < 240) return 4;
  return 5;
}

// Color scale mapping from AMOLED black to Electric Orange
const LEVEL_STYLES = {
  0: 'bg-[#0e0e11] border-zinc-900/90',
  1: 'bg-[#3d1702] border-[#5a2002]',
  2: 'bg-[#7c2d12] border-[#9a3412]',
  3: 'bg-[#c2410c] border-[#ea580c]',
  4: 'bg-[#ea580c] border-[#f97316]',
  5: 'bg-[#FF5500] border-[#ffffff] shadow-[0_0_8px_rgba(255,85,0,0.5)]',
};

export default function CalendarHeatmap({ getMinutesForDate, getSessionsForDate, getStreak }) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    // Week starts on Monday (index 1)
    const startDate = startOfWeek(subWeeks(today, WEEKS_TO_SHOW - 1), { weekStartsOn: 1 });

    const weeksList = [];
    const months = [];
    let lastMonth = -1;

    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const weekDays = [];
      let labelForThisWeek = null;

      for (let d = 0; d < 7; d++) {
        const currentDate = addDays(startDate, w * 7 + d);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const minutes = getMinutesForDate ? getMinutesForDate(dateStr) : 0;
        const sessions = getSessionsForDate ? getSessionsForDate(dateStr) : [];
        const monthNum = currentDate.getMonth();

        // Detect month change on ANY day of the week (e.g. Sep 1 falls on a Tuesday)
        if (monthNum !== lastMonth) {
          labelForThisWeek = format(currentDate, 'MMM').toUpperCase();
          lastMonth = monthNum;
        }

        weekDays.push({
          date: currentDate,
          dateStr,
          minutes,
          sessionCount: sessions.length,
          intensity: getOrangeIntensity(minutes),
          isToday: isToday(currentDate),
          isFutureDay: isFuture(currentDate) && !isToday(currentDate),
        });
      }

      if (labelForThisWeek) {
        months.push({
          label: labelForThisWeek,
          weekIndex: w,
        });
      }

      weeksList.push(weekDays);
    }

    return {
      weeks: weeksList,
      monthLabels: months,
    };
  }, [getMinutesForDate, getSessionsForDate]);

  const streak = getStreak ? getStreak() : 0;

  return (
    <div className="brutal-card p-5 space-y-3">
      {/* Top Banner: Only [STUDY CADENCE] and STREAK */}
      <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
        <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
          [STUDY CADENCE]
        </h3>

        {/* Telemetry chip: Streak only */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="bg-black border border-[#FF5500] px-2 py-0.5 text-[#FF5500] font-bold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF5500] fill-current" />
            STREAK: {streak}D
          </span>
        </div>
      </div>

      {/* Cadence Heatmap Grid */}
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <div className="inline-block min-w-full">
          {/* Month Labels Bar */}
          <div className="flex text-[10px] font-mono text-zinc-500 mb-2 pl-6">
            <div className="flex gap-[3px]">
              {weeks.map((_, idx) => {
                const foundMonth = monthLabels.find((m) => m.weekIndex === idx);
                return (
                  <div key={idx} className="w-3.5 text-left relative h-3.5">
                    {foundMonth && (
                      <span className="font-bold text-zinc-300 absolute left-0 top-0 whitespace-nowrap">
                        {foundMonth.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid with Day Labels */}
          <div className="flex gap-2">
            {/* Day of Week Labels (M, W, F, S) */}
            <div className="flex flex-col justify-between py-0.5 text-[9px] font-mono text-zinc-600 w-4 select-none">
              {DAY_LABELS.map((day, i) => (
                <div key={i} className="h-3.5 flex items-center leading-none">
                  {day}
                </div>
              ))}
            </div>

            {/* Matrix of Days */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <div
                      key={day.dateStr}
                      title={`${format(day.date, 'MMM d, yyyy')}: ${
                        day.minutes > 0 ? formatMinutes(day.minutes) : '0m'
                      }`}
                      className={`w-3.5 h-3.5 border transition-all duration-100 ${
                        day.isFutureDay
                          ? 'bg-[#08080a] border-zinc-900/40 opacity-40'
                          : LEVEL_STYLES[day.intensity]
                      } ${day.isToday ? 'border-[#ffffff] border-2 shadow-[0_0_8px_#FF5500]' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
