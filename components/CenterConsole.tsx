
import React, { memo } from 'react';
import { RefreshCwIcon, SaveIcon, PlayIcon, PauseIcon, RotateCcwIcon, ZapIcon, RepeatIcon } from './icons';
import { ArenaColor } from '../types';

interface CenterConsoleProps {
  timeLeft: number;
  isTimerActive: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onResetGame: () => void;
  onSaveGame: () => void;
  onSwitchSides: () => void;
  onUndo: () => void;
  isGameWon: boolean;
  canUndo: boolean;
  arenaColor?: ArenaColor;
  matchTimeLeft?: number;
  matchMode?: 'casual' | 'oficial';
  isSaving?: boolean;
}

const THEME_ACCENTS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', iconBg: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', iconBg: 'bg-amber-500' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', iconBg: 'bg-rose-500' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', iconBg: 'bg-violet-500' }
};

const CenterConsole: React.FC<CenterConsoleProps> = ({
  timeLeft, isTimerActive, onToggleTimer, onResetTimer, onResetGame,
  onSaveGame, onSwitchSides, isGameWon,
  arenaColor = 'indigo',
  matchTimeLeft,
  matchMode = 'casual',
  isSaving = false
}) => {
  const timerColor = timeLeft <= 10 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-400';
  
  const formatMatchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-2 lg:gap-4 w-full h-full justify-between py-1 lg:py-2">

      {/* Botão Zerar - James: Posicionado no topo para evitar acionamento acidental */}
      <button
        onClick={onResetGame}
        className="w-full py-2.5 lg:py-5 bg-white/5 text-gray-500 hover:text-red-400 rounded-xl lg:rounded-[1.5rem] active:scale-90 flex flex-col items-center justify-center border border-white/5 transition-all shadow-md group shrink-0"
      >
        <RefreshCwIcon className="w-4 h-4 lg:w-6 lg:h-6 group-hover:rotate-180 transition-transform duration-500" />
        <span className="text-[6px] lg:text-[9px] uppercase font-black tracking-widest mt-0.5 lg:mt-1">Zerar Partida</span>
      </button>

      <div className="w-full flex-1 flex flex-col min-h-0">
        <div
          className={`flex-1 bg-black/60 backdrop-blur-3xl rounded-xl lg:rounded-[2.5rem] p-2.5 lg:p-6 border border-white/10 shadow-xl flex flex-col items-center w-full justify-center relative overflow-hidden transition-all ${!isGameWon ? 'cursor-pointer active:scale-[0.98]' : ''}`}
          onClick={!isGameWon ? onToggleTimer : undefined}
        >
          {matchMode === 'oficial' && matchTimeLeft !== undefined && (
            <div className="flex flex-col items-center mb-1.5 lg:mb-4 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <span className="text-[5px] lg:text-[8px] font-black uppercase tracking-widest text-white/30">Tempo Partida</span>
              <span className="font-mono text-[10px] lg:text-xl font-black text-indigo-400">
                {formatMatchTime(matchTimeLeft)}
              </span>
            </div>
          )}

          <span className="text-[5px] lg:text-[10px] font-black uppercase tracking-[0.3em] lg:tracking-[0.5em] text-white/10 mb-0.5 lg:mb-2">Posse</span>
          <div 
            key={timeLeft <= 10 ? 'warning' : 'normal'}
            className={`font-mono text-4xl sm:text-7xl lg:text-9xl font-black ${timerColor} leading-none mb-1.5 lg:mb-6 gpu-accelerated`}
          >
            {String(timeLeft).padStart(2, '0')}
          </div>
          {!isGameWon && (
            <div className="flex gap-2 lg:gap-6">
              <button onClick={(e) => { e.stopPropagation(); onToggleTimer(); }} className={`p-1.5 lg:p-5 rounded-lg lg:rounded-3xl transition-all active:scale-90 shadow-md ${isTimerActive ? 'bg-orange-600/30 text-orange-400 border border-orange-500/20' : 'bg-green-600/30 text-green-400 border border-green-500/20'}`}>
                {isTimerActive ? <PauseIcon className="w-4 h-4 lg:w-8 lg:h-8" /> : <PlayIcon className="w-4 h-4 lg:w-8 lg:h-8" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onResetTimer(); }} className="p-1.5 lg:p-5 bg-white/5 text-gray-600 rounded-lg lg:rounded-3xl active:scale-90 transition-all border border-white/5">
                <RotateCcwIcon className="w-4 h-4 lg:w-8 lg:h-8" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 lg:gap-3 w-full shrink-0">
        <button
          onClick={onSwitchSides}
          className="w-full py-2.5 lg:py-5 bg-white/5 text-gray-400 rounded-xl lg:rounded-[1.5rem] active:scale-90 flex flex-col items-center justify-center border border-white/5 transition-all shadow-md group hover:text-indigo-400"
        >
          <RepeatIcon className="w-4 h-4 lg:w-6 lg:h-6" />
          <span className="text-[6px] lg:text-[9px] uppercase font-black tracking-widest mt-0.5 lg:mt-1">Virar Lados</span>
        </button>

        <button
          onClick={onSaveGame}
          disabled={isSaving}
          className={`w-full py-3 lg:py-6 ${isSaving ? 'bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-black rounded-xl lg:rounded-[1.5rem] transition-all active:scale-95 text-[8px] lg:text-[12px] uppercase tracking-[0.3em] shadow-xl border border-white/10 ${isGameWon && !isSaving ? 'animate-bounce' : ''} disabled:opacity-50`}
        >
          {isSaving ? 'Salvando...' : 'Salvar Partida'}
        </button>
      </div>

    </div>
  );
};

export default memo(CenterConsole);
