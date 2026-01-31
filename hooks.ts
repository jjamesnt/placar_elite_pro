
import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundScheme } from './App';

// Hook para o cronômetro de ataque
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

// Hook para feedback de áudio e vibração
export const useSensoryFeedback = ({ soundEnabled, vibrationEnabled, soundScheme }: SensoryFeedbackProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const initAudio = () => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API não é suportada neste navegador.", e);
            }
        }
        document.removeEventListener('click', initAudio, true);
    };
    document.addEventListener('click', initAudio, true);

    return () => {
        document.removeEventListener('click', initAudio, true);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
    }
  }, []);

  const playSound = useCallback((type: 'point' | 'error' | 'win' | 'countdownBeep' | 'timerEndBeep' | 'timerStartBeep') => {
    if (!soundEnabled) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    if (type === 'win') {
      const now = ctx.currentTime;
      const fanfare = [
        { freq: 523.25, delay: 0, duration: 0.15 },      // C5
        { freq: 659.25, delay: 0.15, duration: 0.15 },   // E5
        { freq: 783.99, delay: 0.3, duration: 0.15 },    // G5
        { freq: 1046.50, delay: 0.45, duration: 0.4 },   // C6 (High C, a nota da vitória!)
      ];
      const attackTime = 0.01;
      
      fanfare.forEach(note => {
          const startTime = now + note.delay;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.6, startTime + attackTime);
          gain.gain.exponentialRampToValueAtTime(0.00001, startTime + note.duration);
          
          osc.start(startTime);
          osc.stop(startTime + note.duration);
      });
      return;
    }
    
    const scheme = soundSchemes[soundScheme];

    if (type === 'timerEndBeep') {
        const now = ctx.currentTime;
        if (soundScheme === 'intenso') {
            const duration = 0.08;
            const interval = 0.12;
            const loopCount = 8;
            for (let i = 0; i < loopCount; i++) {
                const startTime = now + i * interval;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1800, startTime);
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            }
        } else { // 'moderno' e 'classico'
            const loopCount = 5;
            const interval = 0.18;
            const duration = 0.15;
            for (let i = 0; i < loopCount; i++) {
                const startTime = ctx.currentTime + i * interval;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 1500; // Shrill
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            }
        }
        return;
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
    
    const params = scheme[type as keyof typeof scheme];
    oscillator.frequency.value = params.freq;
    oscillator.type = params.type;
    const duration = params.duration;
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [soundEnabled, soundScheme]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled) return;
    if (window.navigator && 'vibrate' in window.navigator) {
      window.navigator.vibrate(pattern);
    }
  }, [vibrationEnabled]);

  return { playSound, vibrate };
};
