
import { useState, useEffect, useRef, useCallback } from 'react';

export const useMatchTimer = (initialMinutes: number = 20) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(initialMinutes * 60);
    setIsActive(true);
    setIsPaused(false);
  }, [initialMinutes]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (timeLeft > 0 && isPaused) {
      setIsActive(true);
      setIsPaused(false);
    }
  }, [timeLeft, isPaused]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      intervalRef.current = interval;
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, isPaused]);

  return { timeLeft, start, reset, isActive, isPaused, pause, resume };
};
