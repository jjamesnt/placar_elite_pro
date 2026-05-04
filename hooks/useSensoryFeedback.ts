
import { useCallback } from 'react';
import { SoundScheme } from '../types';

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
    point: { freq: 1046.50, type: 'sine' as OscillatorType, duration: 0.1 },
    error: { freq: 130.81, type: 'sine' as OscillatorType, duration: 0.2 },
    countdownBeep: { freq: 1396.91, type: 'sine' as OscillatorType, duration: 0.08 },
    timerEndBeep: { freq: 261.63, type: 'sine' as OscillatorType, duration: 0.1 },
    timerStartBeep: { freq: 880, type: 'sine' as OscillatorType, duration: 0.08 },
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
let masterGain: GainNode | null = null;
let limiter: DynamicsCompressorNode | null = null;

const getAudioContext = (): AudioContext | null => {
  if (audioContext) return audioContext;
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    audioContext = new Ctx({
      latencyHint: 'interactive',
      sampleRate: 44100,
    });

    masterGain = audioContext.createGain();
    limiter = audioContext.createDynamicsCompressor();

    limiter.threshold.setValueAtTime(-3, audioContext.currentTime);
    limiter.knee.setValueAtTime(40, audioContext.currentTime);
    limiter.ratio.setValueAtTime(12, audioContext.currentTime);
    limiter.attack.setValueAtTime(0, audioContext.currentTime);
    limiter.release.setValueAtTime(0.25, audioContext.currentTime);

    masterGain.connect(limiter);
    limiter.connect(audioContext.destination);

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
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    isAudioWarmedUp = true;
  }
};

const noiseBufferCache: Record<string, AudioBuffer> = {};

export const useSensoryFeedback = ({ soundEnabled, vibrationEnabled, soundScheme }: SensoryFeedbackProps) => {

  const playSound = useCallback((type: 'point' | 'error' | 'win' | 'emergencyAlert' | 'countdownBeep' | 'timerEndBeep' | 'timerStartBeep', isEmergency: boolean = false) => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state !== 'running') {
      ctx.resume().catch(e => console.error("Audio resume error:", e));
    }

    const lookahead = ctx.state !== 'running' ? 0.15 : 0.02;
    const now = ctx.currentTime + lookahead;

    const playNoise = (duration: number, volume: number, filterFreq = 1000) => {
      if (!masterGain || !ctx) return;
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

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(volume, now);
      noiseGain.gain.setTargetAtTime(0.0001, now, duration / 3);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noise.onended = () => {
        noise.disconnect();
        filter.disconnect();
        noiseGain.disconnect();
      };

      noise.start(now);
      noise.stop(now + duration + 0.1);
    };

    if (type === 'emergencyAlert') {
      if (!masterGain) return;
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((f, i) => {
        const startTime = now + (i * 0.15);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain!);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startTime);
        osc.frequency.exponentialRampToValueAtTime(f * 2, startTime + 0.1);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.setTargetAtTime(0.0001, startTime + 0.1, 0.05);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
      playNoise(0.3, 0.1, 1500);
      return;
    }

    if (type === 'win') {
      if (!masterGain) return;
      const freqs = isEmergency ? [261.63, 329.63, 392.00, 523.25, 659.25] : [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain!);
        osc.type = isEmergency ? 'sawtooth' : 'triangle';
        const start = now + (isEmergency ? 0 : i * 0.12);
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.05);
        gain.gain.setTargetAtTime(0.0001, start + 0.1, 0.4);
        osc.start(start);
        osc.stop(start + 1.6);
      });
      if (isEmergency) playNoise(1.5, 0.2, 500);
      return;
    }

    if (type === 'point' && isEmergency) {
      if (!masterGain) return;
      for (let i = 0; i < 2; i++) {
        const startTime = now + (i * 0.1);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain!);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200 + (i * 200), startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
        gain.gain.setTargetAtTime(0.0001, startTime + 0.04, 0.02);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
      }
      return;
    }

    const scheme = soundSchemes[soundScheme];
    if (type === 'timerEndBeep') {
      if (!masterGain) return;
      const loopCount = isEmergency ? 15 : (soundScheme === 'intenso' ? 8 : 5);
      const interval = isEmergency ? 0.06 : (soundScheme === 'intenso' ? 0.12 : 0.18);
      for (let i = 0; i < loopCount; i++) {
        const startTime = now + i * interval;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain!);
        osc.type = isEmergency ? 'square' : (soundScheme === 'intenso' ? 'sawtooth' : 'sine');
        osc.frequency.setValueAtTime(isEmergency ? 80 + (i * 100) : 1500, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
        gain.gain.setTargetAtTime(0.0001, startTime + 0.05, 0.02);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      }
      return;
    }

    if (!masterGain) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(masterGain!);
    const params = scheme[type as keyof typeof scheme] || scheme['point'];

    oscillator.frequency.value = isEmergency ? params.freq * 0.75 : params.freq;
    oscillator.type = isEmergency ? 'sine' : params.type;

    gainNode.gain.setValueAtTime(0.0001, now);
    // James: Reduzido de 0.8 para 0.4 e suavizado o ataque para evitar estalos (clicks)
    gainNode.gain.linearRampToValueAtTime(isEmergency ? 0.4 : 0.5, now + 0.01);
    gainNode.gain.setTargetAtTime(0.0001, now + 0.015, params.duration / 2.5);

    oscillator.start(now);
    oscillator.stop(now + params.duration + 0.1);
  }, [soundEnabled, soundScheme]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled) return;
    if (window.navigator && 'vibrate' in window.navigator) {
      window.navigator.vibrate(pattern);
    }
  }, [vibrationEnabled]);

  return { playSound, vibrate };
};
