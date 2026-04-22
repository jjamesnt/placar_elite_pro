
import React, { useState } from 'react';
import { Player, ArenaColor } from '../types';
import { TrophyIcon, SearchIcon, XIcon } from './icons';

interface PlayerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSelect: (player: Player) => void;
  teamName: string;
  arenaColor?: ArenaColor;
}

const THEME_STYLES: Record<string, { accent: string; border: string; glow: string }> = {
  indigo: { accent: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/20' },
  blue: { accent: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  emerald: { accent: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  amber: { accent: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  rose: { accent: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/20' },
  violet: { accent: 'text-violet-400', border: 'border-violet-500/30', glow: 'shadow-violet-500/20' },
};

const PlayerSelectModal: React.FC<PlayerSelectModalProps> = ({ 
  isOpen, onClose, players, onSelect, teamName, arenaColor = 'indigo' 
}) => {
  const [search, setSearch] = useState('');
  const theme = THEME_STYLES[arenaColor] || THEME_STYLES.indigo;

  if (!isOpen) return null;

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      {/* Background Dim - Super Deep Glass */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" onClick={onClose}></div>

      {/* Modal Container */}
      <div className={`relative w-full max-w-4xl h-[85vh] bg-[#030712]/90 border ${theme.border} rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}>
        
        {/* Header Section */}
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Selecionar Atleta</span>
              <h2 className={`text-4xl font-black uppercase tracking-tighter ${theme.accent}`}>{teamName}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors group"
            >
              <XIcon className="w-6 h-6 text-white/20 group-hover:text-white" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-white transition-colors" />
            <input 
              autoFocus
              type="text" 
              placeholder="Buscar atleta pelo nome..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-xl font-black text-white focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all placeholder:text-white/10 tracking-tight"
            />
          </div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onSelect(player)}
                  className={`flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl transition-all hover:bg-white/[0.08] hover:border-white/10 hover:scale-[1.02] active:scale-95 group relative overflow-hidden`}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                      <span className="text-2xl font-black text-white">{player.name.charAt(0)}</span>
                    </div>
                    <div className="flex flex-col text-left">
                       <span className="text-xl font-black uppercase tracking-tighter text-white group-hover:text-white mb-1 transition-colors">{player.name}</span>
                       <div className="flex items-center gap-2">
                          <TrophyIcon className="w-3 h-3 text-yellow-500/40" />
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Base de Dados Elite Pro</span>
                       </div>
                    </div>
                  </div>

                  <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 ${theme.accent}`}>
                      <span className="text-xs font-black">OK</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
               <TrophyIcon className="w-20 h-20 mb-4" />
               <p className="text-xl font-black uppercase tracking-widest">Nenhum atleta encontrado</p>
            </div>
          )}
        </div>

        {/* Footer/Meta Section */}
        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-center">
            <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white/10 italic">Elite Ranking System • Real-Time Athlete Selector</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectModal;
