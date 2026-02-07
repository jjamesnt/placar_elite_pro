
import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundScheme } from './App';

export const useAttackTimer = (initialTime: number = 24) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(initialTime);
    setIsActive(true);
    setIsPaused(false);
  }, [initialTime]);

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
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, timeLeft]);

  return { timeLeft, start, reset, isActive, isPaused, pause, resume };
};

interface SensoryFeedbackProps {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundScheme: SoundScheme;
}

const soundSchemes = {
  moderno: {
    point: { freq: 880, type: 'sine' as OscillatorType, duration: 0.15 },
    error: { freq: 220, type: 'square' as OscillatorType, duration: 0.15 },
    countdownBeep: { freq: 1200, type: 'sine' as OscillatorType, duration: 0.1 },
    timerEndBeep: { freq: 440, type: 'sawtooth' as OscillatorType, duration: 0.1 },
    timerStartBeep: { freq: 660, type: 'sine' as OscillatorType, duration: 0.1 },
  },
  classico: {
    point: { freq: 1046.50, type: 'square' as OscillatorType, duration: 0.1 },
    error: { freq: 130.81, type: 'square' as OscillatorType, duration: 0.2 },
    countdownBeep: { freq: 1396.91, type: 'square' as OscillatorType, duration: 0.08 },
    timerEndBeep: { freq: 261.63, type: 'square' as OscillatorType, duration: 0.1 },
    timerStartBeep: { freq: 880, type: 'square' as OscillatorType, duration: 0.08 },
  },
  intenso: {
    point: { freq: 330, type: 'square' as OscillatorType, duration: 0.1 },
    error: { freq: 90, type: 'square' as OscillatorType, duration: 0.3 },
    countdownBeep: { freq: 1600, type: 'sawtooth' as OscillatorType, duration: 0.08 },
    timerEndBeep: { freq: 220, type: 'sawtooth' as OscillatorType, duration: 0.1 },
    timerStartBeep: { freq: 800, type: 'triangle' as OscillatorType, duration: 0.1 },
  }
}

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (audioContext) return audioContext;
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch (e) {
    console.error("Web Audio API não é suportada neste navegador.", e);
    return null;
  }
};

export const warmUpAudioContext = () => {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    // Play silent buffer to unlock audio engine (iOS/Chrome policy)
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  }
};


export const useSensoryFeedback = ({ soundEnabled, vibrationEnabled, soundScheme }: SensoryFeedbackProps) => {

  const playSound = useCallback((type: 'point' | 'error' | 'win' | 'countdownBeep' | 'timerEndBeep' | 'timerStartBeep') => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Se suspenso, tenta acordar mas NÃO espera (fire-and-forget segura)
    const isSuspended = ctx.state === 'suspended';
    if (isSuspended) {
      ctx.resume().catch(e => console.error("Audio resume error:", e));
    }

    // Buffer maior se estiver acordando, menor se já estiver rodando
    const activeBuffer = isSuspended ? 0.1 : 0.05;

    if (type === 'win') {
      const now = ctx.currentTime;
      // Fanfarra alegre (Arpejo Dó Maior Ascendente)
      const notes = [
        { f: 523.25, d: 0.15, t: 0 },    // C5
        { f: 659.25, d: 0.15, t: 0.12 }, // E5
        { f: 783.99, d: 0.15, t: 0.24 }, // G5
        { f: 1046.50, d: 0.6, t: 0.36 }, // C6 (Nota Final)
      ];

      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        const startTime = now + note.t + activeBuffer; // Usa buffer dinâmico
        osc.frequency.setValueAtTime(note.f, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.d);
        osc.start(startTime);
        osc.stop(startTime + note.d);
      });
      return;
    }

    const scheme = soundSchemes[soundScheme];
    if (type === 'timerEndBeep') {
      const now = ctx.currentTime;
      const loopCount = soundScheme === 'intenso' ? 8 : 5;
      const interval = soundScheme === 'intenso' ? 0.12 : 0.18;
      for (let i = 0; i < loopCount; i++) {
        const startTime = now + i * interval + activeBuffer; // Usa buffer dinâmico
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = soundScheme === 'intenso' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(1500, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.00001, startTime + 0.15);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      }
      return;
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    const params = scheme[type as keyof typeof scheme];
    const startTime = ctx.currentTime + activeBuffer; // Usa buffer dinâmico

    oscillator.frequency.value = params.freq;
    oscillator.type = params.type;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + params.duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + params.duration);
  }, [soundEnabled, soundScheme]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled) return;
    if (window.navigator && 'vibrate' in window.navigator) {
      window.navigator.vibrate(pattern);
    }
  }, [vibrationEnabled]);

  return { playSound, vibrate };
};
