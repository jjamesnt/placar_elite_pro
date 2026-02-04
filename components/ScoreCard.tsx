
import React, { useState, useEffect } from 'react';
import { Player, Team, ArenaColor } from '../types';
import { PlusIcon, MinusIcon, ZapIcon } from './icons';

interface ScoreCardProps {
  teamName: string;
  teamData: Team;
  onScoreChange: (newScore: number) => void;
  onPlayerSelect: (player: Player, index: number) => void;
  allPlayers: Player[];
  isGameWon: boolean;
  isLeft: boolean;
  isServing: boolean;
  arenaColor?: ArenaColor;
}

const THEME_CONFIG: Record<ArenaColor, { gradient: string; border: string; text: string; shadow: string; bg: string }> = {
  indigo: { gradient: 'from-indigo-500 to-cyan-400', border: 'border-indigo-400/30', text: 'text-indigo-400', shadow: 'shadow-indigo-500/50', bg: 'bg-indigo-600/90' },
  blue: { gradient: 'from-blue-500 to-indigo-400', border: 'border-blue-400/30', text: 'text-blue-400', shadow: 'shadow-blue-500/50', bg: 'bg-blue-600/90' },
  emerald: { gradient: 'from-emerald-500 to-teal-400', border: 'border-emerald-400/30', text: 'text-emerald-400', shadow: 'shadow-emerald-500/50', bg: 'bg-emerald-600/90' },
  amber: { gradient: 'from-amber-500 to-orange-400', border: 'border-amber-400/30', text: 'text-amber-400', shadow: 'shadow-amber-500/50', bg: 'bg-amber-600/90' },
  rose: { gradient: 'from-rose-500 to-pink-400', border: 'border-rose-400/30', text: 'text-rose-400', shadow: 'shadow-rose-500/50', bg: 'bg-rose-600/90' },
  violet: { gradient: 'from-violet-500 to-purple-400', border: 'border-violet-400/30', text: 'text-violet-400', shadow: 'shadow-violet-500/50', bg: 'bg-violet-600/90' }
};

const ScoreCard: React.FC<ScoreCardProps> = ({ teamName, teamData, onScoreChange, onPlayerSelect, allPlayers, isGameWon, isLeft, isServing, arenaColor = 'indigo' }) => {
  const [animate, setAnimate] = useState(false);
  const theme = THEME_CONFIG[arenaColor];

  useEffect(() => {
    if (teamData.score > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [teamData.score]);

  const handleIncrement = () => {
    if (!isGameWon) onScoreChange(teamData.score + 1);
  };
  const handleDecrement = () => {
    if (!isGameWon && teamData.score > 0) onScoreChange(teamData.score - 1);
  };

  const teamColor = isLeft ? theme.gradient : 'from-red-500 to-orange-400';
  const borderColor = isLeft ? theme.border : 'border-orange-400/30';
  const servingColor = isLeft ? `${theme.text} ${theme.shadow}` : 'text-orange-400 shadow-orange-500/50';
  const buttonBg = isLeft ? theme.bg : 'bg-red-600/90';

  return (
    <div className={`relative flex flex-col bg-black/40 backdrop-blur-3xl rounded-[1.2rem] sm:rounded-[1.5rem] p-2 border-t border-white/5 shadow-2xl h-full min-h-0 ${borderColor} ${isServing ? 'ring-1 ring-white/10' : ''} overflow-hidden`}>
      
      {/* Indicador de Saque */}
      <div className={`absolute top-1.5 ${isLeft ? 'right-2' : 'left-2'} transition-opacity duration-300 z-10 ${isServing ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`flex flex-col items-center gap-0 ${servingColor}`}>
             <ZapIcon className="w-2.5 h-2.5 animate-pulse" />
             <span className="text-[5px] font-black uppercase tracking-tighter">Saque</span>
          </div>
      </div>

      <h2 className="text-[7px] sm:text-[9px] font-black text-center text-white/20 uppercase tracking-[0.3em] mb-1">{teamName}</h2>
      
      {/* Placar: Dimensão dinâmica vh para não vazar em modo paisagem */}
      <div 
        className="flex-1 flex items-center justify-center relative min-h-0 cursor-pointer select-none active:scale-[0.98] transition-transform"
        onClick={handleIncrement}
      >
          <span className={`
            block text-[22vh] sm:text-[26vh] font-mono font-black bg-clip-text text-transparent bg-gradient-to-br leading-[0.8] transition-all duration-300
            ${teamColor} 
            ${animate ? 'scale-105' : 'scale-100'}
          `}>
              {String(teamData.score).padStart(2, '0')}
          </span>
      </div>

      {/* Controles e Atletas: Empilhamento Vertical solicitado */}
      <div className="mt-1 flex flex-col gap-1.5 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
               <button onClick={(e) => { e.stopPropagation(); handleDecrement(); }} disabled={isGameWon || teamData.score === 0} className="flex items-center justify-center py-1.5 sm:py-2 bg-white/5 rounded-lg text-gray-500 disabled:opacity-5 active:scale-95 transition-all">
                  <MinusIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleIncrement(); }} disabled={isGameWon} className={`flex items-center justify-center py-1.5 sm:py-2 rounded-lg text-white disabled:opacity-5 active:scale-95 transition-all shadow-lg ${buttonBg}`}>
                  <PlusIcon className="w-3.5 h-3.5" />
              </button>
          </div>
          
          {/* Campos de Atletas: Empilhados um sobre o outro */}
          <div className="flex flex-col gap-1">
            {[0, 1].map(index => (
              <div key={index} className="relative w-full">
                <select 
                  value={teamData.players[index]?.id || ''}
                  onChange={(e) => {
                    const selectedPlayer = allPlayers.find(p => p.id === e.target.value);
                    if (selectedPlayer) onPlayerSelect(selectedPlayer, index);
                  }}
                  disabled={isGameWon}
                  className="w-full px-2 py-1.5 bg-black/60 text-white rounded-md text-[7px] font-black appearance-none border border-white/5 focus:outline-none focus:border-indigo-500/50 transition-all uppercase tracking-tighter truncate"
                >
                  <option value="" disabled>{`Atleta ${index + 1}`}</option>
                  {allPlayers.map(player => (
                    <option key={player.id} value={player.id}>{player.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ScoreCard;
