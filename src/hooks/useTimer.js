import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Core timer hook with countdown, pause/resume, and callbacks.
 * Uses wall-clock timestamp calculations and Web Worker background ticking
 * to prevent background tab throttling and timer drift.
 */
export function useTimer({ onComplete, onTick } = {}) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef(null);
  const workerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  const targetEndTimeRef = useRef(null);
  const remainingMsRef = useRef(0);
  const handleTickRef = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  // Setup inline Web Worker for background ticking (immune to background tab throttling)
  useEffect(() => {
    let worker = null;
    let workerUrl = null;

    try {
      const workerCode = `
        let id = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (id) clearInterval(id);
            id = setInterval(function() {
              self.postMessage('tick');
            }, 1000);
          } else if (e.data === 'stop') {
            if (id) {
              clearInterval(id);
              id = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
      workerRef.current = worker;
    } catch {
      // Fallback gracefully if Web Workers are restricted in environment
      workerRef.current = null;
    }

    return () => {
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage('stop');
      workerRef.current.onmessage = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleTick = useCallback(() => {
    if (!targetEndTimeRef.current) return;

    const remainingMs = targetEndTimeRef.current - Date.now();
    const next = Math.max(0, Math.ceil(remainingMs / 1000));
    setTimeRemaining(next);

    if (next <= 0) {
      clearTimer();
      setIsRunning(false);
      setIsPaused(false);
      targetEndTimeRef.current = null;
      remainingMsRef.current = 0;
      onCompleteRef.current?.();
    } else {
      onTickRef.current?.(next);
    }
  }, [clearTimer]);

  useEffect(() => {
    handleTickRef.current = handleTick;
  }, [handleTick]);

  const startTicker = useCallback(() => {
    clearTimer();
    if (workerRef.current) {
      workerRef.current.onmessage = () => {
        handleTickRef.current?.();
      };
      workerRef.current.postMessage('start');
    } else {
      intervalRef.current = setInterval(() => {
        handleTickRef.current?.();
      }, 1000);
    }
  }, [clearTimer]);

  const start = useCallback((durationSeconds) => {
    clearTimer();
    setTotalTime(durationSeconds);
    setTimeRemaining(durationSeconds);
    setIsRunning(true);
    setIsPaused(false);

    targetEndTimeRef.current = Date.now() + durationSeconds * 1000;
    remainingMsRef.current = durationSeconds * 1000;

    startTicker();
  }, [clearTimer, startTicker]);

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      clearTimer();
      setIsPaused(true);
      if (targetEndTimeRef.current) {
        remainingMsRef.current = Math.max(0, targetEndTimeRef.current - Date.now());
      }
    }
  }, [isRunning, isPaused, clearTimer]);

  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false);
      targetEndTimeRef.current = Date.now() + remainingMsRef.current;
      startTicker();
    }
  }, [isRunning, isPaused, startTicker]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setTotalTime(0);
    targetEndTimeRef.current = null;
    remainingMsRef.current = 0;
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeRemaining(totalTime);
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimeRef.current = null;
    remainingMsRef.current = totalTime * 1000;
  }, [clearTimer, totalTime]);

  // Sync immediately when tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && !isPaused && targetEndTimeRef.current) {
        handleTickRef.current?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const progress = totalTime > 0 ? 1 - timeRemaining / totalTime : 0;

  return {
    timeRemaining,
    totalTime,
    isRunning,
    isPaused,
    progress,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
