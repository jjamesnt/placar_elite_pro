
import React from 'react';
import { Player, Team } from '../types';
import { PlusIcon, MinusIcon } from './icons';

interface ScoreCardProps {
  teamName: string;
  teamData: Team;
  onScoreChange: (newScore: number) => void;
  onPlayerSelect: (player: Player, index: number) => void;
  allPlayers: Player[];
  isGameWon: boolean;
  isLeft: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ teamName, teamData, onScoreChange, onPlayerSelect, allPlayers, isGameWon, isLeft }) => {
  const handleIncrement = () => {
    if (!isGameWon) onScoreChange(teamData.score + 1);
  };
  const handleDecrement = () => {
    if (!isGameWon && teamData.score > 0) onScoreChange(teamData.score - 1);
  };

  const teamColor = isLeft ? 'from-blue-500 to-cyan-400' : 'from-red-500 to-orange-400';
  const borderColor = isLeft ? 'border-cyan-400' : 'border-orange-400';

  return (
    <div className={`flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-2 border-t-4 ${borderColor}`}>
      <h2 className="text-xl font-bold text-center text-gray-300 uppercase tracking-wider flex-shrink-0">{teamName}</h2>
      
      {/* Score display */}
      <div className="text-center my-2 sm:my-4">
          <span className={`text-7xl md:text-9xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-br ${teamColor}`}>
              {String(teamData.score).padStart(2, '0')}
          </span>
      </div>

      <div className="flex-shrink-0">
          {/* Score buttons */}
          <div className="grid grid-cols-2 gap-2">
               <button 
                  onClick={handleDecrement} 
                  disabled={isGameWon || teamData.score === 0} 
                  className="flex items-center justify-center p-2 bg-gray-700 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform hover:bg-gray-600"
              >
                  <MinusIcon />
              </button>
              <button 
                  onClick={handleIncrement} 
                  disabled={isGameWon} 
                  className="flex items-center justify-center p-2 bg-green-500 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform hover:bg-green-600"
              >
                  <PlusIcon />
              </button>
          </div>
          
          {/* Player selectors */}
          <div className="space-y-1 mt-2">
            {[0, 1].map(index => (
              <select 
                key={index}
                value={teamData.players[index]?.id || ''}
                onChange={(e) => {
                  const selectedPlayer = allPlayers.find(p => p.id === e.target.value);
                  if (selectedPlayer) onPlayerSelect(selectedPlayer, index);
                }}
                disabled={isGameWon}
                className="w-full p-2 bg-gray-700 text-white rounded-lg text-base appearance-none text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>{`Jogador ${index + 1}`}</option>
                {allPlayers.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ScoreCard;
