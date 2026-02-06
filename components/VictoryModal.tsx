
import React from 'react';
import { Team, ArenaColor } from '../types';
import { TrophyIcon } from './icons';

interface VictoryData {
  winner: 'A' | 'B';
  teamA: Team;
  teamB: Team;
  isCapote: boolean;
}

interface VictoryModalProps {
  victoryData: VictoryData;
  onClose: () => void;
  onSave: () => void;
  onNewGame: () => void;
  arenaColor?: ArenaColor;
}

const THEME_STYLES: Record<string, { bg: string; text: string; shadow: string; border: string }> = {
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-400', shadow: 'shadow-indigo-500/40', border: 'border-indigo-500/30' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-400', shadow: 'shadow-blue-500/40', border: 'border-blue-500/30' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-400', shadow: 'shadow-emerald-500/40', border: 'border-emerald-500/30' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-400', shadow: 'shadow-amber-500/40', border: 'border-amber-500/30' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-400', shadow: 'shadow-rose-500/40', border: 'border-rose-500/30' },
  violet: { bg: 'bg-violet-600', text: 'text-violet-400', shadow: 'shadow-violet-500/40', border: 'border-violet-500/30' },
};

const VictoryModal: React.FC<VictoryModalProps> = ({ victoryData, onClose, onSave, onNewGame, arenaColor = 'indigo' }) => {
  const { winner, teamA, teamB, isCapote } = victoryData;
  const winningTeam = winner === 'A' ? teamA : teamB;
  const losingTeam = winner === 'A' ? teamB : teamA;
  const theme = THEME_STYLES[arenaColor];

  const winnerNames = winningTeam.players.map(p => p?.name || 'Atleta').join(' & ');
  const loserNames = losingTeam.players.map(p => p?.name || 'Atleta').join(' & ');

  return (
    <div className="victory-modal fixed inset-0 bg-black/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`bg-[#030712] border ${isCapote ? 'border-rose-500/30' : theme.border} rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden max-h-[95vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute -top-1/4 -right-1/4 w-96 h-96 ${isCapote ? 'bg-rose-600/20' : theme.bg}/20 rounded-full blur-[120px] -z-10`}></div>
        
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border ${isCapote ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : `${theme.bg}/10 ${theme.border} ${theme.text}`}`}>
            <TrophyIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter ${isCapote ? 'text-rose-500' : 'text-white'}`}>
            {isCapote ? 'CAPOTE!' : 'VITÓRIA!'}
          </h1>
          <p className={`text-xs font-bold ${theme.text} mt-1 sm:mt-2`}>{winnerNames}</p>

          <div className="my-4 sm:my-6 w-full flex items-center justify-center gap-4">
            <div className="flex-1 text-right">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 truncate">{winnerNames}</p>
              <p className="text-3xl sm:text-4xl font-mono font-black text-white">{winningTeam.score}</p>
            </div>
            <p className="text-base sm:text-lg font-black text-gray-700">VS</p>
            <div className="flex-1 text-left">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 truncate">{loserNames}</p>
              <p className="text-3xl sm:text-4xl font-mono font-black text-gray-600">{losingTeam.score}</p>
            </div>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-3">
            <button onClick={onNewGame} className="w-full py-3 sm:py-4 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] transition-colors hover:text-white">
              Nova Partida
            </button>
            <button 
              onClick={onSave}
              className={`w-full py-3 sm:py-4 ${theme.bg} hover:opacity-90 text-white rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] shadow-xl ${theme.shadow}`}
            >
              Salvar e Zerar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VictoryModal;
