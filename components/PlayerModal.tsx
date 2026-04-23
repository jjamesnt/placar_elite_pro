
import React from 'react';
import { Player, ArenaColor } from '../types';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (player: Player) => void;
  allPlayers: Player[];
  excludedPlayerIds: string[];
  currentPlayerId?: string;
  title: string;
  arenaColor: ArenaColor;
}

const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen, onClose, onSelect, allPlayers, excludedPlayerIds, currentPlayerId, title, arenaColor
}) => {
  if (!isOpen) return null;

  const availablePlayers = allPlayers.filter(p => 
    !excludedPlayerIds.includes(p.id) || currentPlayerId === p.id
  );

  // James: Cores do tema para o checkmark e destaques
  const themeColors: Record<ArenaColor, string> = {
    indigo: 'text-indigo-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    violet: 'text-violet-400'
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-white/20 tracking-[0.3em]">Seleção de Atleta</span>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {availablePlayers.length > 0 ? (
            <div className="grid grid-cols-1 gap-1">
              {availablePlayers.map(player => {
                const isCurrent = currentPlayerId === player.id;
                
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      onSelect(player);
                      onClose();
                    }}
                    className={`w-full text-left px-6 py-4 rounded-2xl transition-all flex items-center gap-4 group relative ${
                      isCurrent ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="w-6 flex items-center justify-center">
                       {isCurrent && <span className={`text-xl font-bold ${themeColors[arenaColor]}`}>✓</span>}
                    </div>
                    <span className={`text-lg font-semibold uppercase tracking-wide transition-colors ${
                      isCurrent ? 'text-white' : 'text-white/60 group-hover:text-white'
                    }`}>
                      {player.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-20">
              <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center text-3xl">!</div>
              <p className="text-sm font-bold uppercase tracking-widest text-center px-10">Nenhum atleta disponível no momento</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center">
           <button 
             onClick={onClose}
             className="px-8 py-3 rounded-full bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
           >
             Voltar ao Placar
           </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
