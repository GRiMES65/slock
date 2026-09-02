import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Core timer hook with countdown, pause/resume, and callbacks
 */
export function useTimer({ onComplete, onTick } = {}) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((durationSeconds) => {
    clearTimer();
    setTotalTime(durationSeconds);
    setTimeRemaining(durationSeconds);
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    pausedAtRef.current = null;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearTimer();
          setIsRunning(false);
          setIsPaused(false);
          onCompleteRef.current?.();
          return 0;
        }
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      clearTimer();
      setIsPaused(true);
      pausedAtRef.current = Date.now();
    }
  }, [isRunning, isPaused, clearTimer]);

  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false);

      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearTimer();
            setIsRunning(false);
            setIsPaused(false);
            onCompleteRef.current?.();
            return 0;
          }
          onTickRef.current?.(next);
          return next;
        });
      }, 1000);
    }
  }, [isRunning, isPaused, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setTotalTime(0);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeRemaining(totalTime);
    setIsRunning(false);
    setIsPaused(false);
  }, [clearTimer, totalTime]);

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
