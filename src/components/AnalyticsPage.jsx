import CalendarHeatmap from './CalendarHeatmap';
import PeriodAnalytics from './PeriodAnalytics';

export default function AnalyticsPage({
  sessions = [],
  getMinutesForDate,
  getSessionsForDate,
  getStreak,
  removeSession,
  clearAllSessions,
}) {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-24 min-h-screen flex flex-col space-y-6">
      {/* Header */}
      <header className="border-b-2 border-zinc-900 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white font-mono uppercase">
              TELEMETRY<span className="text-[#FF5500]">.</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
            Cadence & Historical Performance
          </p>
        </div>
      </header>

      {/* 01. STUDY CADENCE CALENDAR */}
      <CalendarHeatmap
        getMinutesForDate={getMinutesForDate}
        getSessionsForDate={getSessionsForDate}
        getStreak={getStreak}
      />

      {/* 02. INDEPENDENT DEDICATED PERIOD FILTERS (DAILY / WEEKLY / MONTHLY / ALL-TIME) */}
      <PeriodAnalytics
        sessions={sessions}
        removeSession={removeSession}
        clearAllSessions={clearAllSessions}
      />
    </div>
  );
}
