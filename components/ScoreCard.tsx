
import React, { useState, useEffect } from 'react';
import { Player, Team } from '../types';
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
}

const ScoreCard: React.FC<ScoreCardProps> = ({ teamName, teamData, onScoreChange, onPlayerSelect, allPlayers, isGameWon, isLeft, isServing }) => {
  const [animate, setAnimate] = useState(false);

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

  const teamColor = isLeft ? 'from-blue-500 to-cyan-400' : 'from-red-500 to-orange-400';
  const borderColor = isLeft ? 'border-cyan-400/40' : 'border-orange-400/40';
  const servingColor = isLeft ? 'text-cyan-400 shadow-cyan-500/50' : 'text-orange-400 shadow-orange-500/50';

  return (
    <div className={`relative flex flex-col bg-gray-800/40 backdrop-blur-xl rounded-[1.25rem] shadow-2xl p-2 sm:p-3 border-t-2 transition-all duration-500 h-full min-h-0 ${borderColor} ${isServing ? 'ring-1 ring-white/10' : ''}`}>
      
      {/* Indicador de Saque */}
      <div className={`absolute top-1.5 ${isLeft ? 'right-3' : 'left-3'} transition-opacity duration-300 z-10 ${isServing ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`flex flex-col items-center gap-0 ${servingColor}`}>
             <ZapIcon className="w-3.5 h-3.5 animate-pulse" />
             <span className="text-[6px] font-black uppercase tracking-tighter">Saque</span>
          </div>
      </div>

      <h2 className="text-[10px] font-black text-center text-gray-500 uppercase tracking-[0.2em] flex-shrink-0 mb-0.5">{teamName}</h2>
      
      {/* Score display - Aumentado para maximizar impacto visual */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 py-1 overflow-hidden">
          <span className={`
            block text-[5rem] sm:text-8xl md:text-[10rem] lg:text-[11rem] font-mono font-black bg-clip-text text-transparent bg-gradient-to-br transition-all duration-300 leading-[0.9]
            ${teamColor} 
            ${animate ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'scale-100'}
          `}>
              {String(teamData.score).padStart(2, '0')}
          </span>
          {animate && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 bg-white/10 rounded-full blur-3xl animate-ping"></div>
              </div>
          )}
      </div>

      <div className="flex-shrink-0 mt-0.5">
          {/* Score buttons - Compactados para dar espaço aos números */}
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
               <button 
                  onClick={handleDecrement} 
                  disabled={isGameWon || teamData.score === 0} 
                  className="flex items-center justify-center py-1.5 bg-gray-700/20 rounded-lg text-gray-600 disabled:opacity-5 active:scale-95 transition-all hover:bg-gray-600/30 border border-white/5"
              >
                  <MinusIcon className="w-4 h-4" />
              </button>
              <button 
                  onClick={handleIncrement} 
                  disabled={isGameWon} 
                  className={`flex items-center justify-center py-1.5 rounded-lg text-white disabled:opacity-5 active:scale-95 transition-all shadow-lg border border-white/10 ${isLeft ? 'bg-blue-600/90 hover:bg-blue-600' : 'bg-red-600/90 hover:bg-red-600'}`}
              >
                  <PlusIcon className="w-4 h-4" />
              </button>
          </div>
          
          {/* Player selectors - Altura mínima para segurança mobile */}
          <div className="grid grid-cols-1 gap-1">
            {[0, 1].map(index => (
              <div key={index} className="relative group">
                <select 
                  value={teamData.players[index]?.id || ''}
                  onChange={(e) => {
                    const selectedPlayer = allPlayers.find(p => p.id === e.target.value);
                    if (selectedPlayer) onPlayerSelect(selectedPlayer, index);
                  }}
                  disabled={isGameWon}
                  className="w-full pl-2 pr-6 py-1 bg-gray-900/40 text-gray-500 rounded-md text-[8px] sm:text-[9px] font-bold appearance-none border border-white/5 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-20 transition-all group-hover:bg-gray-900/60"
                >
                  <option value="" disabled>{`Atleta ${index + 1}`}</option>
                  {allPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-700">
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ScoreCard;
