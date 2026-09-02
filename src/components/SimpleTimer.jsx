import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, RefreshCw, Check, Clock } from 'lucide-react';
import CircularProgress from './CircularProgress';
import { useTimer } from '../hooks/useTimer';
import { formatTime, formatMinutes, playChime } from '../utils/timeUtils';

const PRESETS = [
  { label: '15M', minutes: 15 },
  { label: '25M', minutes: 25 },
  { label: '45M', minutes: 45 },
  { label: '60M', minutes: 60 },
  { label: '90M', minutes: 90 },
  { label: '120M', minutes: 120 },
];

export default function SimpleTimer({ onSessionComplete }) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    setIsActive(false);
    playChime('complete');

    const totalMinutes = Math.round(totalDuration / 60);
    if (totalMinutes > 0) {
      onSessionComplete?.({
        type: 'simple',
        startTime,
        endTime: new Date().toISOString(),
        totalStudyMinutes: totalMinutes,
        completed: true,
      });
    }
  }, [onSessionComplete, startTime, totalDuration]);

  const timer = useTimer({ onComplete: handleComplete });

  const startTimer = (durationMinutes) => {
    const seconds = durationMinutes * 60;
    if (seconds <= 0) return;
    setTotalDuration(seconds);
    setStartTime(new Date().toISOString());
    setIsActive(true);
    setIsComplete(false);
    timer.start(seconds);
  };

  const handleStart = () => {
    const totalMins = hours * 60 + minutes;
    startTimer(totalMins);
  };

  const handlePreset = (presetMins) => {
    setHours(Math.floor(presetMins / 60));
    setMinutes(presetMins % 60);
    startTimer(presetMins);
  };

  const handleStop = () => {
    const elapsed = totalDuration - timer.timeRemaining;
    const elapsedMinutes = Math.round(elapsed / 60);

    if (elapsedMinutes > 0) {
      onSessionComplete?.({
        type: 'simple',
        startTime,
        endTime: new Date().toISOString(),
        totalStudyMinutes: elapsedMinutes,
        completed: false,
      });
    }

    timer.stop();
    setIsActive(false);
    setIsComplete(false);
  };

  const handleReset = () => {
    timer.stop();
    setIsActive(false);
    setIsComplete(false);
  };

  // COMPLETED VIEW
  if (isComplete) {
    return (
      <div className="brutal-card p-6 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#FF5500] bg-black shadow-[4px_4px_0px_#FF5500]">
          <Check className="w-8 h-8 text-[#FF5500]" />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#FF5500] font-bold">
            [TIMER CONCLUDED]
          </span>
          <h2 className="text-3xl font-black font-mono uppercase text-white mt-1">
            Focus Block Done
          </h2>
          <p className="text-zinc-400 font-mono text-xs mt-1">
            Completed {Math.round(totalDuration / 60)} minutes of continuous study
          </p>
        </div>

        <button
          onClick={handleReset}
          className="w-full brutal-btn py-3 text-sm uppercase tracking-wider font-mono flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Set Another Timer</span>
        </button>
      </div>
    );
  }

  // ACTIVE COUNTDOWN VIEW
  if (isActive) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF5500] inline-block animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 border border-[#FF5500] text-[#FF5500] bg-orange-950/20">
              [QUICK FOCUS IN PROGRESS]
            </span>
          </div>

          <span className="font-mono text-xs text-zinc-400">
            Total: <strong className="text-white">{formatMinutes(Math.round(totalDuration / 60))}</strong>
          </span>
        </div>

        <div className="py-2 flex justify-center">
          <CircularProgress
            progress={timer.progress}
            size={290}
            strokeWidth={12}
            isPaused={timer.isPaused}
          >
            <span className="font-mono text-5xl font-black tracking-tight text-white tabular-nums">
              {formatTime(timer.timeRemaining)}
            </span>
            <span className="font-mono text-xs text-zinc-400 uppercase mt-1">
              {timer.isPaused ? '[PAUSED]' : 'Remaining'}
            </span>
          </CircularProgress>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          {timer.isPaused ? (
            <button
              onClick={timer.resume}
              className="brutal-btn py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={timer.pause}
              className="brutal-btn-outline py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleStop}
            className="border-2 border-zinc-800 bg-black text-zinc-400 hover:text-red-400 hover:border-red-900 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>Conclude</span>
          </button>
        </div>
      </div>
    );
  }

  // SETUP VIEW
  const totalMins = hours * 60 + minutes;

  return (
    <div className="space-y-6">
      {/* Presets Grid */}
      <div className="brutal-card p-5">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <span className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
            [RAPID LAUNCH PRESETS]
          </span>
          <span className="font-mono text-[10px] text-zinc-500 uppercase">1-Tap Start</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.minutes)}
              className="p-3 bg-black border-2 border-zinc-800 hover:border-[#FF5500] hover:text-[#FF5500] text-white font-mono font-black text-sm flex flex-col items-center justify-center gap-0.5 transition-all shadow-[2px_2px_0px_#18181b] hover:shadow-[3px_3px_0px_#FF5500]"
            >
              <span>{p.label}</span>
              <span className="text-[9px] text-zinc-500 font-normal">INSTANT</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Duration Panel */}
      <div className="brutal-card p-5">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <span className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
            [CUSTOM TIMER CONFIG]
          </span>
          <span className="font-mono text-xs text-[#FF5500] font-bold">
            {formatMinutes(totalMins)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
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
                onClick={() => setHours((h) => Math.max(0, h - 1))}
                className="w-10 h-10 bg-zinc-950 border-2 border-zinc-800 hover:border-[#FF5500] hover:text-[#FF5500] text-zinc-300 font-mono text-lg font-black flex items-center justify-center transition-all active:translate-y-0.5 cursor-pointer"
              >
                −
              </button>
              <div className="flex-1 text-center font-mono text-2xl font-black text-white select-none">
                {String(hours).padStart(2, '0')}
              </div>
              <button
                type="button"
                onClick={() => setHours((h) => Math.min(12, h + 1))}
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
                onClick={() => setMinutes((m) => Math.max(0, m - 5))}
                className="w-10 h-10 bg-zinc-950 border-2 border-zinc-800 hover:border-[#FF5500] hover:text-[#FF5500] text-zinc-300 font-mono text-lg font-black flex items-center justify-center transition-all active:translate-y-0.5 cursor-pointer"
              >
                −
              </button>
              <div className="flex-1 text-center font-mono text-2xl font-black text-white select-none">
                {String(minutes).padStart(2, '0')}
              </div>
              <button
                type="button"
                onClick={() => setMinutes((m) => Math.min(59, m + 5))}
                className="w-10 h-10 bg-zinc-950 border-2 border-zinc-800 hover:border-[#FF5500] hover:text-[#FF5500] text-zinc-300 font-mono text-lg font-black flex items-center justify-center transition-all active:translate-y-0.5 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={totalMins <= 0}
          className="w-full brutal-btn py-4 text-sm uppercase tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Engage Timer</span>
        </button>
      </div>
    </div>
  );
}
