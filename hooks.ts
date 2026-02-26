
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

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused]);

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

let isAudioWarmedUp = false;

export const warmUpAudioContext = async () => {
  if (isAudioWarmedUp) return;
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(e => console.error("Falha ao resumir AudioContext:", e));
    }
    // Play silent buffer to unlock audio engine (iOS/Chrome policy)
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    isAudioWarmedUp = true;
    console.log("AudioContext aquecido. Estado:", ctx.state);
  }
};

const noiseBufferCache: Record<string, AudioBuffer> = {};

export const useSensoryFeedback = ({ soundEnabled, vibrationEnabled, soundScheme }: SensoryFeedbackProps) => {

  const playSound = useCallback((type: 'point' | 'error' | 'win' | 'emergencyAlert' | 'countdownBeep' | 'timerEndBeep' | 'timerStartBeep', isEmergency: boolean = false) => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const isSuspended = ctx.state === 'suspended';
    if (isSuspended) {
      ctx.resume().then(() => {
        // Retry playing once resumed if needed, or just proceed with a bit more buffer
      }).catch(e => console.error("Audio resume error:", e));
    }

    // iOS standalone mode adjustment: use larger lookahead if suspended
    const activeBuffer = isSuspended ? 0.15 : 0.05;
    const now = ctx.currentTime + activeBuffer;

    // Função auxiliar para ruído FILTRADO (mais impacto, menos chiado) com Cache de Buffer
    const playNoise = (duration: number, volume: number, filterFreq = 1000) => {
      const cacheKey = `${duration}-${filterFreq}`;
      let buffer = noiseBufferCache[cacheKey];

      if (!buffer) {
        const bufferSize = ctx.sampleRate * duration;
        buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noiseBufferCache[cacheKey] = buffer;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.setValueAtTime(1, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.onended = () => {
        noise.disconnect();
        filter.disconnect();
        noiseGain.disconnect();
      };

      noise.start(now);
      noise.stop(now + duration);
    };

    if (type === 'emergencyAlert') {
      // Sirene de Guerra Duplicada (2 ciclos)
      const cycles = 2;
      const cycleDuration = 1.0;

      for (let c = 0; c < cycles; c++) {
        const cycleStart = now + (c * cycleDuration);
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = i === 0 ? 'sawtooth' : 'square';
          osc.frequency.setValueAtTime(300 + (i * 10), cycleStart);
          osc.frequency.linearRampToValueAtTime(600, cycleStart + 0.5);
          osc.frequency.linearRampToValueAtTime(300, cycleStart + 1.0);
          gain.gain.setValueAtTime(0, cycleStart);
          gain.gain.linearRampToValueAtTime(0.3, cycleStart + 0.1);
          gain.gain.linearRampToValueAtTime(0.3, cycleStart + 0.9);
          gain.gain.exponentialRampToValueAtTime(0.0001, cycleStart + 1.0);
          osc.start(cycleStart);
          osc.stop(cycleStart + 1.0);
          osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
          };
        }
        playNoise(0.5, 0.15, 800);
      }
      return;
    }

    if (type === 'win') {
      // Fanfarra de Batalha (Acorde de Poder)
      const freqs = isEmergency ? [261.63, 329.63, 392.00, 523.25, 659.25] : [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = isEmergency ? 'sawtooth' : 'triangle';
        const start = now + (isEmergency ? 0 : i * 0.12);
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.5);
        osc.start(start);
        osc.stop(start + 1.5);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
      if (isEmergency) playNoise(1.5, 0.2, 500); // Grande impacto final (Low-pass 500Hz para peso)
      return;
    }

    if (type === 'point' && isEmergency) {
      // IMPACTO / EXPLOSÃO DE PONTUAÇÃO (Limpo)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
      playNoise(0.2, 0.5, 1200); // Explosão controlada (Low-pass 1200Hz para brilho sem chiado)
      return;
    }

    const scheme = soundSchemes[soundScheme];
    if (type === 'timerEndBeep') {
      const loopCount = isEmergency ? 15 : (soundScheme === 'intenso' ? 8 : 5);
      const interval = isEmergency ? 0.06 : (soundScheme === 'intenso' ? 0.12 : 0.18);
      for (let i = 0; i < loopCount; i++) {
        const startTime = now + i * interval;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = isEmergency ? 'square' : (soundScheme === 'intenso' ? 'sawtooth' : 'sine');
        osc.frequency.setValueAtTime(isEmergency ? 80 + (i * 100) : 1500, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }
      return;
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    const params = scheme[type as keyof typeof scheme] || scheme['point'];

    oscillator.frequency.value = isEmergency ? params.freq * 0.8 : params.freq;
    oscillator.type = isEmergency ? 'square' : params.type;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isEmergency ? 0.8 : 0.5, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + params.duration);

    oscillator.start(now);
    oscillator.stop(now + params.duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }, [soundEnabled, soundScheme]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled) return;
    if (window.navigator && 'vibrate' in window.navigator) {
      window.navigator.vibrate(pattern);
    }
  }, [vibrationEnabled]);

  return { playSound, vibrate };
};
