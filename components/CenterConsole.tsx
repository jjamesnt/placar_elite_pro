import React from 'react';
import { RefreshCwIcon, SaveIcon, RepeatIcon, PlayIcon, PauseIcon, RotateCcwIcon, ZapIcon } from './icons';

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
}

const CenterConsole: React.FC<CenterConsoleProps> = ({ 
    timeLeft, isTimerActive, onToggleTimer, onResetTimer, onResetGame, 
    onSaveGame, onSwitchSides, onUndo, isGameWon, canUndo, 
    servingTeam, onToggleServe 
}) => {
  const timerColor = timeLeft <= 10 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-400';
  
  return (
    <div className="flex flex-col items-center px-1 py-1 w-full max-w-[180px] mx-auto h-full justify-between">
      
      {/* Bloco do Cronômetro - Mais compacto */}
      <div className="text-center w-full">
        <h3 className="text-gray-600 uppercase tracking-[0.2em] mb-0.5 text-[7px] font-black">Posse</h3>
        <div className="bg-black/30 rounded-xl p-2 border border-white/5 shadow-inner">
            <div 
              className={`font-mono text-4xl lg:text-5xl font-black transition-colors ${timerColor} leading-none mb-2`}
            >
              {String(timeLeft).padStart(2, '0')}
            </div>
            {!isGameWon && (
                <div className="flex justify-center gap-1.5">
                   <button onClick={onToggleTimer} className={`p-2.5 rounded-lg transition-all active:scale-90 shadow-lg ${isTimerActive ? 'bg-orange-600/20 text-orange-500' : 'bg-green-600/20 text-green-500'}`}>
                      {isTimerActive ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                  </button>
                  <button onClick={onResetTimer} className="p-2.5 bg-gray-800 text-gray-500 rounded-lg active:scale-90 transition-all hover:text-white">
                      <RotateCcwIcon className="w-4 h-4" />
                  </button>
                </div>
            )}
        </div>
      </div>

      {/* Controle de Saque - Horizontalmente mais fino */}
      <div className="w-full mt-1.5">
         <button 
            onClick={onToggleServe}
            disabled={isGameWon}
            className="w-full flex items-center justify-between px-2.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all active:scale-95 disabled:opacity-20"
         >
            <span className="text-[7px] font-black uppercase tracking-widest">Alternar Saque</span>
            <div className={`p-1 rounded bg-indigo-500 text-white shadow shadow-indigo-500/20 transition-transform duration-500 ${servingTeam === 'B' ? 'rotate-180' : ''}`}>
                <ZapIcon className="w-3 h-3" />
            </div>
         </button>
      </div>

      {/* Ações de Jogo - Grid ultra denso */}
      <div className="flex flex-col gap-1.5 w-full mt-1.5">
        <div className="grid grid-cols-2 gap-1.5">
            <button 
                onClick={onSwitchSides} 
                disabled={isGameWon}
                className="flex flex-col items-center justify-center py-1.5 bg-gray-800/60 hover:bg-gray-700 text-gray-500 rounded-lg transition-all active:scale-95 disabled:opacity-20 border border-white/5"
            >
              <RepeatIcon className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[6px] font-black uppercase tracking-tighter">Virar</span>
            </button>
            <button 
                onClick={onUndo} 
                disabled={!canUndo}
                className="flex flex-col items-center justify-center py-1.5 bg-gray-800/60 hover:bg-gray-700 text-gray-500 rounded-lg transition-all active:scale-95 disabled:opacity-20 border border-white/5"
            >
                <RotateCcwIcon className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[6px] font-black uppercase tracking-tighter">Voltar</span>
            </button>
        </div>

        <button 
            onClick={onSaveGame} 
            className={`flex items-center justify-center py-2.5 bg-green-600/90 hover:bg-green-600 text-white font-black rounded-lg transition-all active:scale-95 text-[9px] uppercase tracking-widest shadow-lg shadow-green-900/10 ${isGameWon ? 'animate-pulse ring-1 ring-white/20' : ''}`}
        >
          <SaveIcon className="w-3.5 h-3.5 mr-1" /> Salvar
        </button>
        
        <button 
            onClick={onResetGame} 
            className="flex items-center justify-center py-1 text-red-500/30 hover:text-red-500 transition-colors text-[6px] font-black uppercase tracking-[0.2em]"
        >
          Resetar Jogo
        </button>
      </div>
    </div>
  );
};

// Fix: Add default export for the CenterConsole component
export default CenterConsole;