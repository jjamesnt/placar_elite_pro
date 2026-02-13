
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
  isVaiATresActive?: boolean;
  vaiATresScore?: number;
}

const THEME_CONFIG: Record<ArenaColor, { gradient: string; border: string; text: string; shadow: string; bg: string }> = {
  indigo: { gradient: 'from-indigo-500 to-cyan-400', border: 'border-indigo-400/30', text: 'text-indigo-400', shadow: 'shadow-indigo-500/50', bg: 'bg-indigo-600/90' },
  blue: { gradient: 'from-blue-500 to-indigo-400', border: 'border-blue-400/30', text: 'text-blue-400', shadow: 'shadow-blue-500/50', bg: 'bg-blue-600/90' },
  emerald: { gradient: 'from-emerald-500 to-teal-400', border: 'border-emerald-400/30', text: 'text-emerald-400', shadow: 'shadow-emerald-500/50', bg: 'bg-emerald-600/90' },
  amber: { gradient: 'from-amber-500 to-orange-400', border: 'border-amber-400/30', text: 'text-amber-400', shadow: 'shadow-amber-500/50', bg: 'bg-amber-600/90' },
  rose: { gradient: 'from-rose-500 to-pink-400', border: 'border-rose-400/30', text: 'text-rose-400', shadow: 'shadow-rose-500/50', bg: 'bg-rose-600/90' },
  violet: { gradient: 'from-violet-500 to-purple-400', border: 'border-violet-400/30', text: 'text-violet-400', shadow: 'shadow-violet-500/50', bg: 'bg-violet-600/90' }
};

const ScoreCard: React.FC<ScoreCardProps> = ({ teamName, teamData, onScoreChange, onPlayerSelect, allPlayers, isGameWon, isLeft, isServing, arenaColor = 'indigo', isVaiATresActive, vaiATresScore = 0 }) => {
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
    <div className={`relative flex flex-col backdrop-blur-3xl rounded-[1.2rem] sm:rounded-[1.5rem] lg:rounded-[2.5rem] p-2 sm:p-3 lg:p-6 border-t border-white/5 shadow-2xl h-full min-h-0 ${borderColor} ${isServing ? 'ring-1 ring-white/10 lg:ring-2' : ''} overflow-hidden transition-all duration-500 ${isVaiATresActive ? 'bg-red-600/20 animate-[pulse_2s_infinite]' : 'bg-black/40'}`}>

      {/* HAZARD TAPE BORDERS (FITA ZEBRADA) */}
      {isVaiATresActive && (
        <>
          <div className="absolute top-0 left-0 w-full h-1.5 lg:h-3 z-30 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] animate-hazard-pulse"></div>
          <div className="absolute bottom-0 left-0 w-full h-1.5 lg:h-3 z-30 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] animate-hazard-pulse"></div>
          <div className="absolute top-0 left-0 h-full w-1.5 lg:w-3 z-30 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] animate-hazard-pulse"></div>
          <div className="absolute top-0 right-0 h-full w-1.5 lg:w-3 z-30 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] animate-hazard-pulse"></div>
        </>
      )}

      {/* MINI SCOREBOARD (VAI A TRES) */}
      {isVaiATresActive && (
        <div className="absolute top-2 lg:top-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 animate-in zoom-in duration-300">
          <div className="bg-yellow-500 px-2 lg:px-4 py-0.5 lg:py-1.5 rounded-full border-2 border-black/20 shadow-xl flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1">
            <ZapIcon className="w-2 h-2 lg:w-4 lg:h-4 text-black animate-pulse" />
            <span className="text-[7px] lg:text-[14px] font-black text-black uppercase tracking-[0.1em] lg:tracking-[0.2em] whitespace-nowrap">Desafio 3</span>
          </div>
          <div className="text-3xl lg:text-9xl font-mono font-black text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] leading-none">
            {vaiATresScore}
          </div>
        </div>
      )}

      <div className={`absolute top-1.5 sm:top-3 ${isLeft ? 'right-2 lg:right-4' : 'left-2 lg:left-4'} transition-opacity duration-300 z-10 ${isServing ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`flex flex-col items-center gap-0 lg:gap-1 ${servingColor}`}>
          <ZapIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 lg:w-5 lg:h-5 animate-pulse" />
          <span className="text-[5px] sm:text-[6px] lg:text-[8px] font-black uppercase tracking-tighter">Saque</span>
        </div>
      </div>

      <h2 className="text-[7px] sm:text-[9px] lg:text-[11px] font-black text-center text-white/20 uppercase tracking-[0.3em] mb-1 lg:mb-2">{teamName}</h2>

      <div
        className="flex-1 flex items-center justify-center relative min-h-0 cursor-pointer select-none active:scale-[0.98] transition-transform -mt-2 sm:-mt-4"
        onClick={handleIncrement}
      >
        <span style={{ fontSize: 'clamp(80px, 24vh, 260px)' }} className={`
            block font-mono font-black bg-clip-text text-transparent bg-gradient-to-br leading-none transition-all duration-300
            ${teamColor} 
            ${animate ? 'scale-105' : 'scale-100'}
          `}>
          {String(teamData.score).padStart(2, '0')}
        </span>
      </div>

      <div className="mt-1 md:mt-2 lg:mt-2 flex flex-col gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-1.5 md:gap-2 lg:gap-3">
          <button onClick={(e) => { e.stopPropagation(); handleDecrement(); }} disabled={isGameWon || teamData.score === 0} className="flex items-center justify-center py-2 sm:py-3 lg:py-5 bg-white/5 rounded-lg lg:rounded-2xl text-gray-500 disabled:opacity-5 active:scale-95 transition-all">
            <MinusIcon className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleIncrement(); }} disabled={isGameWon} className={`flex items-center justify-center py-2 sm:py-3 lg:py-5 rounded-lg lg:rounded-2xl text-white disabled:opacity-5 active:scale-95 transition-all shadow-lg ${buttonBg}`}>
            <PlusIcon className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 lg:gap-2 tablet-jumbo-gap">
          {[0, 1].map(index => (
            <div key={index} className="relative w-full">
              <select
                value={teamData.players[index]?.id || ''}
                onChange={(e) => {
                  const selectedPlayer = allPlayers.find(p => p.id === e.target.value);
                  if (selectedPlayer) onPlayerSelect(selectedPlayer, index);
                }}
                disabled={isGameWon}
                className="w-full px-2 py-2 lg:py-3.5 lg:px-4 bg-black/60 text-white rounded-lg lg:rounded-xl text-[8px] lg:text-[11px] font-black appearance-none border border-white/5 focus:outline-none focus:border-indigo-500/50 transition-all uppercase tracking-tighter truncate tablet-jumbo-select text-center"
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