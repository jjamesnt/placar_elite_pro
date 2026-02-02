import React from 'react';
import { RefreshCwIcon, SaveIcon, RepeatIcon, PlayIcon, PauseIcon, RotateCcwIcon } from './icons';

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
}

const CenterConsole: React.FC<CenterConsoleProps> = ({ timeLeft, isTimerActive, onToggleTimer, onResetTimer, onResetGame, onSaveGame, onSwitchSides, onUndo, isGameWon, canUndo }) => {
  const timerColor = timeLeft <= 10 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-400';
  
  return (
    <div className="flex flex-col items-center p-1 sm:p-2 w-full max-w-[200px] mx-auto">
      <div className="text-center">
        <h3 className="text-gray-400 uppercase tracking-widest mb-0.5 text-[10px] sm:text-xs">Ataque</h3>
        <div 
          className={`font-mono text-4xl sm:text-5xl lg:text-6xl font-bold transition-colors ${timerColor} cursor-pointer leading-none`}
          onClick={onResetTimer}
          title="Clique para zerar o cronômetro"
        >
          {String(timeLeft).padStart(2, '0')}
        </div>
        {!isGameWon && (
            <div className="flex gap-2 mt-1">
               <button onClick={onToggleTimer} className="p-2 sm:p-3 bg-gray-600 text-white rounded-full active:scale-95 transition-transform hover:bg-gray-500 shadow-md">
                  {isTimerActive ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button 
                onClick={onUndo} 
                disabled={!canUndo}
                className="p-2 sm:p-3 bg-gray-700 text-white rounded-full active:scale-95 transition-transform hover:bg-gray-600 shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                title="Desfazer última ação"
              >
                  <RotateCcwIcon />
              </button>
            </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 w-full mt-2 sm:mt-4">
        <button 
            onClick={onSaveGame} 
            className={`flex items-center justify-center py-2 px-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-transform active:scale-95 text-sm sm:text-base shadow-lg ${isGameWon ? 'animate-pulse' : ''}`}
        >
          <SaveIcon /> <span className="ml-2">Salvar</span>
        </button>
        <button 
            onClick={onResetGame} 
            className={`flex items-center justify-center py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-transform active:scale-95 text-sm sm:text-base shadow-lg ${isGameWon ? 'ring-2 ring-yellow-300' : ''}`}
        >
          <RefreshCwIcon /> <span className="ml-2">Zerar</span>
        </button>
        <button 
          onClick={onSwitchSides} 
          disabled={isGameWon}
          className="flex items-center justify-center py-2 px-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-transform active:scale-95 text-sm sm:text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RepeatIcon /> <span className="ml-2">Virar</span>
        </button>
      </div>
    </div>
  );
};

export default CenterConsole;