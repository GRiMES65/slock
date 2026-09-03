import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, FastForward, Square, Check, RefreshCw, Layers, Shield, Sparkles } from 'lucide-react';
import CircularProgress from './CircularProgress';
import { useTimer } from '../hooks/useTimer';
import { useTabTitle } from '../hooks/useTabTitle';
import { formatTime, formatMinutes, playChime } from '../utils/timeUtils';

const QUICK_GOALS = [
  { label: '2H', hours: 2, mins: 0 },
  { label: '3H', hours: 3, mins: 0 },
  { label: '4H', hours: 4, mins: 0 },
  { label: '5H', hours: 5, mins: 0 },
  { label: '6H', hours: 6, mins: 0 },
];

export default function SessionTimer({ onSessionComplete }) {
  // Setup state
  const [totalHours, setTotalHours] = useState(5);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [studyInterval, setStudyInterval] = useState(50);
  const [breakDuration, setBreakDuration] = useState(10);

  // Session state
  const [phase, setPhase] = useState('idle'); // idle | studying | break | completed
  const [currentInterval, setCurrentInterval] = useState(0);
  const [totalIntervals, setTotalIntervals] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [totalGoalSeconds, setTotalGoalSeconds] = useState(0);

  const elapsedRef = useRef(0);
  const currentIntervalDurationRef = useRef(0);

  const handlePhaseComplete = useCallback(() => {
    if (phase === 'studying') {
      elapsedRef.current += currentIntervalDurationRef.current;

      // Check if we hit or exceeded the overall goal or completed last interval
      if (currentInterval >= totalIntervals || elapsedRef.current >= totalGoalSeconds) {
        setPhase('completed');
        playChime('complete');
        const finalMinutes = Math.round(elapsedRef.current / 60);
        onSessionComplete?.({
          type: 'session',
          startTime: sessionStartTime,
          endTime: new Date().toISOString(),
          totalStudyMinutes: finalMinutes,
          studyInterval,
          breakDuration,
          intervalsCompleted: currentInterval,
          totalIntervals,
          completed: true,
        });
        return;
      }

      // Transition to break
      setPhase('break');
      playChime('break');
      const breakSecs = breakDuration * 60;
      currentIntervalDurationRef.current = breakSecs;
      timer.start(breakSecs);
    } else if (phase === 'break') {
      // Transition back to study
      const nextIntervalIndex = currentInterval + 1;
      setCurrentInterval(nextIntervalIndex);
      setPhase('studying');
      playChime('tick');

      const remainingGoal = Math.max(0, totalGoalSeconds - elapsedRef.current);
      const nextStudyDuration = Math.min(studyInterval * 60, remainingGoal);
      currentIntervalDurationRef.current = nextStudyDuration;
      timer.start(nextStudyDuration);
    }
  }, [phase, studyInterval, breakDuration, currentInterval, totalIntervals, sessionStartTime, onSessionComplete, totalGoalSeconds]);

  const timer = useTimer({ onComplete: handlePhaseComplete });

  const sessionLabel =
    phase === 'break'
      ? 'Rest'
      : totalIntervals > 0
        ? `Focus ${currentInterval}/${totalIntervals}`
        : 'Focus';

  useTabTitle({
    timeRemaining: timer.timeRemaining,
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    isComplete: phase === 'completed',
    label: sessionLabel,
    isBreak: phase === 'break',
    enabled: phase !== 'idle',
  });

  const startSession = () => {
    const goalSeconds = (totalHours * 60 + totalMinutes) * 60;
    if (goalSeconds <= 0) return;

    const intervals = Math.ceil(goalSeconds / (studyInterval * 60));
    setTotalIntervals(intervals);
    setCurrentInterval(1);
    setPhase('studying');
    setSessionStartTime(new Date().toISOString());
    setTotalGoalSeconds(goalSeconds);
    elapsedRef.current = 0;

    const firstDuration = Math.min(studyInterval * 60, goalSeconds);
    currentIntervalDurationRef.current = firstDuration;
    timer.start(firstDuration);
    playChime('start');
  };

  const endSessionEarly = () => {
    playChime('stop');
    // calculate seconds completed inside current interval if studying
    let totalStudiedSecs = elapsedRef.current;
    if (phase === 'studying') {
      const studiedInThisInterval = currentIntervalDurationRef.current - timer.timeRemaining;
      totalStudiedSecs += Math.max(0, studiedInThisInterval);
    }

    timer.stop();
    const finalMinutes = Math.round(totalStudiedSecs / 60);
    if (finalMinutes > 0) {
      onSessionComplete?.({
        type: 'session',
        startTime: sessionStartTime,
        endTime: new Date().toISOString(),
        totalStudyMinutes: finalMinutes,
        studyInterval,
        breakDuration,
        intervalsCompleted: Math.max(0, currentInterval - 1),
        totalIntervals,
        completed: false,
      });
    }
    resetSession();
  };

  const skipBreak = () => {
    if (phase !== 'break') return;
    timer.stop();
    const nextIntervalIndex = currentInterval + 1;
    setCurrentInterval(nextIntervalIndex);
    setPhase('studying');
    playChime('start');

    const remainingGoal = Math.max(0, totalGoalSeconds - elapsedRef.current);
    const nextStudyDuration = Math.min(studyInterval * 60, remainingGoal);
    currentIntervalDurationRef.current = nextStudyDuration;
    timer.start(nextStudyDuration);
  };

  const resetSession = () => {
    timer.stop();
    setPhase('idle');
    setCurrentInterval(0);
    setTotalIntervals(0);
    setSessionStartTime(null);
    setTotalGoalSeconds(0);
    elapsedRef.current = 0;
  };

  const currentStudiedSecs =
    elapsedRef.current +
    (phase === 'studying' ? currentIntervalDurationRef.current - timer.timeRemaining : 0);

  const overallProgress = totalGoalSeconds > 0
    ? Math.min(currentStudiedSecs / totalGoalSeconds, 1)
    : 0;

  // SETUP VIEW
  if (phase === 'idle') {
    const totalMinutesInput = totalHours * 60 + totalMinutes;
    const computedCycles = Math.ceil(totalMinutesInput / studyInterval);

    return (
      <div className="space-y-6">
        {/* Goal Panel */}
        <div className="brutal-card p-5">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
            <span className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
              [TARGET GOAL]
            </span>
            <span className="font-mono text-xs text-[#FF5500] font-bold">
              {formatMinutes(totalMinutesInput)}
            </span>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {QUICK_GOALS.map((q) => {
              const isSelected = totalHours === q.hours && totalMinutes === q.mins;
              return (
                <button
                  key={q.label}
                  onClick={() => {
                    setTotalHours(q.hours);
                    setTotalMinutes(q.mins);
                  }}
                  className={`py-1.5 text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-[#FF5500] text-black border-2 border-[#FF5500] shadow-[2px_2px_0px_#ffffff]'
                      : 'bg-black text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>

          {/* Custom Hours / Minutes Steppers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black border-2 border-zinc-800 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Hours
                </span>
                <span className="font-mono text-[10px] text-zinc-400 font-bold">HR</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTotalHours((h) => Math.max(0, h - 1))}
                  className="w-10 h-10 bg-zinc-950 border-2 border-zinc-800 hover:border-[#FF5500] hover:text-[#FF5500] text-zinc-300 font-mono text-lg font-black flex items-center justify-center transition-all active:translate-y-0.5 cursor-pointer"
                >
                  −
                </button>
                <div className="flex-1 text-center font-mono text-2xl font-black text-white select-none">
                  {String(totalHours).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={() => setTotalHours((h) => Math.min(16, h + 1))}
                  className="w-10 h-10 bg-zinc-950 border-2 border-zinc-800 hover:border-[#FF5500] hover:text-[#FF5500] text-zinc-300 font-mono text-lg font-black flex items-center justify-center transition-all active:translate-y-0.5 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-black border-2 border-zinc-800 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Minutes
                </span>
                <span className="font-mono text-[10px] text-zinc-400 font-bold">MIN</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTotalMinutes((m) => Math.max(0, m - 5))}
                  className="w-10 h-10 bg-zinc-950 border-2 border-zinc-800 hover:border-[#FF5500] hover:text-[#FF5500] text-zinc-300 font-mono text-lg font-black flex items-center justify-center transition-all active:translate-y-0.5 cursor-pointer"
                >
                  −
                </button>
                <div className="flex-1 text-center font-mono text-2xl font-black text-white select-none">
                  {String(totalMinutes).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={() => setTotalMinutes((m) => Math.min(55, m + 5))}
                  className="w-10 h-10 bg-zinc-950 border-2 border-zinc-800 hover:border-[#FF5500] hover:text-[#FF5500] text-zinc-300 font-mono text-lg font-black flex items-center justify-center transition-all active:translate-y-0.5 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Intervals & Breaks Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Study */}
          <div className="brutal-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
                [STUDY]
              </span>
              <span className="font-mono text-xs text-white font-bold">{studyInterval}m</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[25, 45, 50, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setStudyInterval(m)}
                  className={`py-1 text-xs font-mono font-bold transition-all ${
                    studyInterval === m
                      ? 'bg-[#FF5500] text-black border-2 border-[#FF5500]'
                      : 'bg-black text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={studyInterval}
              onChange={(e) => setStudyInterval(Number(e.target.value))}
              className="w-full accent-[#FF5500] bg-zinc-900 h-1 cursor-pointer"
            />
          </div>

          {/* Break */}
          <div className="brutal-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
                [BREAK]
              </span>
              <span className="font-mono text-xs text-[#F59E0B] font-bold">{breakDuration}m</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[5, 10, 15, 20].map((m) => (
                <button
                  key={m}
                  onClick={() => setBreakDuration(m)}
                  className={`py-1 text-xs font-mono font-bold transition-all ${
                    breakDuration === m
                      ? 'bg-[#F59E0B] text-black border-2 border-[#F59E0B]'
                      : 'bg-black text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <input
              type="range"
              min="2"
              max="30"
              step="1"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
              className="w-full accent-[#F59E0B] bg-zinc-900 h-1 cursor-pointer"
            />
          </div>
        </div>

        {/* Telemetry Summary */}
        <div className="bg-black border-2 border-zinc-800 p-4">
          <div className="grid grid-cols-3 divide-x-2 divide-zinc-900 text-center font-mono">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Target</div>
              <div className="text-base font-bold text-white mt-0.5">{formatMinutes(totalMinutesInput)}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Cadence</div>
              <div className="text-base font-bold text-[#FF5500] mt-0.5">{studyInterval}/{breakDuration}m</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Cycles</div>
              <div className="text-base font-bold text-white mt-0.5">{computedCycles}</div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startSession}
          disabled={totalMinutesInput <= 0}
          className="w-full brutal-btn py-4 text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Start Timer</span>
        </button>
      </div>
    );
  }

  // COMPLETED VIEW
  if (phase === 'completed') {
    const totalMinutesFinished = Math.round(elapsedRef.current / 60);

    return (
      <div className="brutal-card p-6 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#FF5500] bg-black shadow-[4px_4px_0px_#FF5500]">
          <Check className="w-8 h-8 text-[#FF5500]" />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#FF5500] font-bold">
            [PROTOCOL ACCOMPLISHED]
          </span>
          <h2 className="text-3xl font-black font-mono uppercase text-white mt-1">
            Goal Concluded
          </h2>
          <p className="text-zinc-400 font-mono text-xs mt-1">
            Logged {formatMinutes(totalMinutesFinished)} of dedicated study
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-black border-2 border-zinc-800 p-4 font-mono">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase">Total Study Time</div>
            <div className="text-xl font-bold text-[#FF5500] mt-1">{formatMinutes(totalMinutesFinished)}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase">Intervals Finished</div>
            <div className="text-xl font-bold text-white mt-1">{totalIntervals} / {totalIntervals}</div>
          </div>
        </div>

        <button
          onClick={resetSession}
          className="w-full brutal-btn py-3 text-sm uppercase tracking-wider font-mono flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Configure New Protocol</span>
        </button>
      </div>
    );
  }

  // ACTIVE VIEW
  const isBreak = phase === 'break';

  return (
    <div className="space-y-6">
      {/* Active Phase Badge */}
      <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 inline-block ${
              isBreak ? 'bg-[#F59E0B] animate-ping' : 'bg-[#FF5500] animate-pulse'
            }`}
          />
          <span
            className={`font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 border ${
              isBreak
                ? 'border-[#F59E0B] text-[#F59E0B] bg-amber-950/20'
                : 'border-[#FF5500] text-[#FF5500] bg-orange-950/20'
            }`}
          >
            {isBreak ? `[REST INTERVAL // ${breakDuration}M]` : `[FOCUS CYCLE ${currentInterval} OF ${totalIntervals}]`}
          </span>
        </div>

        <span className="font-mono text-xs text-zinc-400">
          Target: <strong className="text-white">{formatMinutes(Math.round(totalGoalSeconds / 60))}</strong>
        </span>
      </div>

      {/* Main Circular HUD */}
      <div className="py-2 flex justify-center">
        <CircularProgress
          progress={timer.progress}
          size={290}
          strokeWidth={12}
          isBreak={isBreak}
          isPaused={timer.isPaused}
        >
          <span className="font-mono text-5xl font-black tracking-tight text-white tabular-nums">
            {formatTime(timer.timeRemaining)}
          </span>
          <span className="font-mono text-xs text-zinc-400 uppercase mt-1">
            {timer.isPaused ? '[PAUSED]' : isBreak ? 'Resting' : `Focus Block ${currentInterval}/${totalIntervals}`}
          </span>
        </CircularProgress>
      </div>

      {/* Overall Progress Gauge */}
      <div className="brutal-card p-4 space-y-2">
        <div className="flex justify-between items-center font-mono text-xs">
          <span className="text-zinc-400 font-bold uppercase tracking-wider">
            Overall Target Cadence
          </span>
          <span className="text-[#FF5500] font-bold">
            {Math.round(overallProgress * 100)}% ({formatMinutes(Math.round(currentStudiedSecs / 60))} logged)
          </span>
        </div>
        <div className="w-full h-3 bg-black border border-zinc-800 overflow-hidden">
          <div
            className="h-full bg-[#FF5500] transition-all duration-300"
            style={{ width: `${Math.min(overallProgress * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
        {timer.isPaused ? (
          <button
            onClick={() => {
              timer.resume();
              playChime('start');
            }}
            className="brutal-btn py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={() => {
              timer.pause();
              playChime('stop');
            }}
            className="brutal-btn-outline py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>
        )}

        {isBreak ? (
          <button
            onClick={skipBreak}
            className="brutal-btn-outline py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 text-amber-400 border-amber-800 hover:border-[#F59E0B]"
          >
            <FastForward className="w-4 h-4" />
            <span>Skip Rest</span>
          </button>
        ) : (
          <div className="hidden sm:block" />
        )}

        <button
          onClick={endSessionEarly}
          className="border-2 border-zinc-800 bg-black text-zinc-400 hover:text-red-400 hover:border-red-900 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          <Square className="w-4 h-4" />
          <span>Conclude</span>
        </button>
      </div>
    </div>
  );
}
