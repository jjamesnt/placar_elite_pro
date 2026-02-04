
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
  servingTeam: 'A' | 'B';
  onToggleServe: () => void;
  arenaColor?: ArenaColor;
}

const THEME_ACCENTS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', iconBg: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-400/20', iconBg: 'bg-amber-500' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', iconBg: 'bg-rose-500' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', iconBg: 'bg-violet-500' }
};

const CenterConsole: React.FC<CenterConsoleProps> = ({ 
    timeLeft, isTimerActive, onToggleTimer, onResetTimer, onResetGame, 
    onSaveGame, onSwitchSides, isGameWon, 
    servingTeam, onToggleServe, arenaColor = 'indigo'
}) => {
  const timerColor = timeLeft <= 10 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-400';
  const theme = THEME_ACCENTS[arenaColor];
  
  return (
    <div className="flex flex-col items-center gap-1.5 w-full h-full justify-between py-1">
      
      {/* Cronômetro Posse: Maximização da área central */}
      <div className="w-full flex-[1.4] flex flex-col">
        <div className="bg-black/60 backdrop-blur-3xl rounded-[1.2rem] p-3 border border-white/10 shadow-xl flex flex-col items-center w-full h-full justify-center relative overflow-hidden">
            <span className="text-[6px] font-black uppercase tracking-[0.5em] text-white/10 mb-1">CRONÔMETRO POSSE</span>
            <div className={`font-mono text-5xl sm:text-7xl font-black transition-all duration-300 ${timerColor} leading-none mb-3`}>
              {String(timeLeft).padStart(2, '0')}
            </div>
            {!isGameWon && (
                <div className="flex gap-3">
                   <button onClick={onToggleTimer} className={`p-2 rounded-xl transition-all active:scale-90 shadow-md ${isTimerActive ? 'bg-orange-600/30 text-orange-400 border border-orange-500/20' : 'bg-green-600/30 text-green-400 border border-green-500/20'}`}>
                      {isTimerActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={onResetTimer} className="p-2 bg-white/5 text-gray-600 rounded-xl active:scale-90 transition-all border border-white/5">
                      <RotateCcwIcon className="w-5 h-5" />
                  </button>
                </div>
            )}
        </div>
      </div>

      {/* Ações Consolidadas */}
      <div className="flex flex-col gap-1.5 w-full flex-shrink-0">
         <button 
            onClick={onToggleServe} 
            disabled={isGameWon} 
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all active:scale-95 disabled:opacity-20 shadow-md ${theme.bg} ${theme.text} ${theme.border}`}
         >
            <span className="text-[7px] font-black uppercase tracking-widest hidden sm:block">Alternar Saque</span>
            <div className={`p-1.5 rounded-lg text-white shadow-lg transition-transform duration-500 mx-auto sm:mx-0 ${theme.iconBg} ${servingTeam === 'B' ? 'rotate-180' : ''}`}>
                <ZapIcon className="w-3.5 h-3.5" />
            </div>
         </button>

         <div className="grid grid-cols-2 gap-1.5 w-full">
            <button 
                onClick={onSwitchSides} 
                className="py-2.5 bg-white/5 text-gray-400 rounded-xl active:scale-90 flex flex-col items-center justify-center border border-white/5 transition-all shadow-md group hover:text-indigo-400"
            >
                <RepeatIcon className="w-4 h-4" />
                <span className="text-[6px] uppercase font-black tracking-widest mt-0.5">Virar</span>
            </button>
            <button 
                onClick={onResetGame} 
                className="py-2.5 bg-white/5 text-gray-500 hover:text-red-400 rounded-xl active:scale-90 flex flex-col items-center justify-center border border-white/5 transition-all shadow-md"
            >
                <RefreshCwIcon className="w-4 h-4" />
                <span className="text-[6px] uppercase font-black tracking-widest mt-0.5">Zerar</span>
            </button>
         </div>

         <button 
            onClick={onSaveGame} 
            className={`w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all active:scale-95 text-[9px] uppercase tracking-[0.3em] shadow-xl border border-white/10 ${isGameWon ? 'animate-bounce' : ''}`}
        >
          Salvar Partida
        </button>
      </div>

    </div>
  );
};

export default CenterConsole;
