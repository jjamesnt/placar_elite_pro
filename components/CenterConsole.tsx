
import React from 'react';
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
  arenaColor = 'indigo'
}) => {
  const timerColor = timeLeft <= 10 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-400';

  return (
    <div className="flex flex-col items-center gap-1.5 lg:gap-4 w-full h-full justify-between py-1 lg:py-2">

      <div className="w-full flex-[1.4] lg:flex-[1.6] flex flex-col">
        <div
          className={`bg-black/60 backdrop-blur-3xl rounded-[1.2rem] lg:rounded-[2.5rem] p-3 lg:p-6 border border-white/10 shadow-xl flex flex-col items-center w-full h-full justify-center relative overflow-hidden transition-all ${!isGameWon ? 'cursor-pointer active:scale-95' : ''}`}
          onClick={!isGameWon ? onToggleTimer : undefined}
        >
          <span className="text-[6px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-white/10 mb-1 lg:mb-2">CRONÔMETRO POSSE</span>
          <div className={`font-mono text-4xl sm:text-7xl lg:text-9xl font-black transition-all duration-300 ${timerColor} leading-tight mb-3 lg:mb-6`}>
            {String(timeLeft).padStart(2, '0')}
          </div>
          {!isGameWon && (
            <div className="flex gap-3 lg:gap-6">
              <button onClick={(e) => { e.stopPropagation(); onToggleTimer(); }} className={`p-2 lg:p-5 rounded-xl lg:rounded-3xl transition-all active:scale-90 shadow-md ${isTimerActive ? 'bg-orange-600/30 text-orange-400 border border-orange-500/20' : 'bg-green-600/30 text-green-400 border border-green-500/20'}`}>
                {isTimerActive ? <PauseIcon className="w-5 h-5 lg:w-8 lg:h-8" /> : <PlayIcon className="w-5 h-5 lg:w-8 lg:h-8" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onResetTimer(); }} className="p-2 lg:p-5 bg-white/5 text-gray-600 rounded-xl lg:rounded-3xl active:scale-90 transition-all border border-white/5">
                <RotateCcwIcon className="w-5 h-5 lg:w-8 lg:h-8" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 lg:gap-3 w-full flex-shrink-0">
        <div className="grid grid-cols-2 gap-1.5 lg:gap-3 w-full">
          <button
            onClick={onSwitchSides}
            className="py-2.5 lg:py-5 bg-white/5 text-gray-400 rounded-xl lg:rounded-[1.5rem] active:scale-90 flex flex-col items-center justify-center border border-white/5 transition-all shadow-md group hover:text-indigo-400"
          >
            <RepeatIcon className="w-4 h-4 lg:w-6 lg:h-6" />
            <span className="text-[6px] lg:text-[9px] uppercase font-black tracking-widest mt-0.5 lg:mt-1">Virar</span>
          </button>
          <button
            onClick={onResetGame}
            className="py-2.5 lg:py-5 bg-white/5 text-gray-500 hover:text-red-400 rounded-xl lg:rounded-[1.5rem] active:scale-90 flex flex-col items-center justify-center border border-white/5 transition-all shadow-md"
          >
            <RefreshCwIcon className="w-4 h-4 lg:w-6 lg:h-6" />
            <span className="text-[6px] lg:text-[9px] uppercase font-black tracking-widest mt-0.5 lg:mt-1">Zerar</span>
          </button>
        </div>

        <button
          onClick={onSaveGame}
          className={`w-full py-3 lg:py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl lg:rounded-[1.5rem] transition-all active:scale-95 text-[9px] lg:text-[12px] uppercase tracking-[0.3em] shadow-xl border border-white/10 ${isGameWon ? 'animate-bounce' : ''}`}
        >
          Salvar Partida
        </button>
      </div>

    </div>
  );
};

export default CenterConsole;
