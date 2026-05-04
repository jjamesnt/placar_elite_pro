
import React from 'react';
import { Team, ArenaColor } from '../types';
import { TrophyIcon } from './icons';

interface VictoryData {
  winner: 'A' | 'B';
  teamA: Team;
  teamB: Team;
  isCapote: boolean;
  setResults?: { A: number; B: number }[];
}

interface VictoryModalProps {
  victoryData: VictoryData;
  onClose: () => void;
  onSave: () => void;
  onNewGame: () => void;
  onUndo: () => void;
  arenaColor?: ArenaColor;
  isTV?: boolean;
}

const THEME_STYLES: Record<string, { bg: string; text: string; shadow: string; border: string }> = {
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-400', shadow: 'shadow-indigo-500/40', border: 'border-indigo-500/30' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-400', shadow: 'shadow-blue-500/40', border: 'border-blue-500/30' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-400', shadow: 'shadow-emerald-500/40', border: 'border-emerald-500/30' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-400', shadow: 'shadow-amber-500/40', border: 'border-amber-500/30' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-400', shadow: 'shadow-rose-500/40', border: 'border-rose-500/30' },
  violet: { bg: 'bg-violet-600', text: 'text-violet-400', shadow: 'shadow-violet-500/40', border: 'border-violet-500/30' },
};

const VictoryModal: React.FC<VictoryModalProps> = ({ victoryData, onClose, onSave, onNewGame, onUndo, arenaColor = 'indigo', isTV = false }) => {
  const { winner, teamA, teamB, isCapote, setResults } = victoryData;
  const winningTeam = winner === 'A' ? teamA : teamB;
  const losingTeam = winner === 'A' ? teamB : teamA;
  const theme = THEME_STYLES[arenaColor] || THEME_STYLES.indigo;

  const winnerNames = winningTeam.players.map(p => p?.name || 'Atleta').join(' & ');
  const loserNames = losingTeam.players.map(p => p?.name || 'Atleta').join(' & ');

  const [isSaving, setIsSaving] = React.useState(false);

  return (
    <div className={`victory-modal fixed inset-0 bg-black/60 backdrop-blur-2xl z-[110] flex items-center justify-center p-4 animate-in fade-in duration-500 ${isTV ? 'cursor-default' : ''}`} onClick={onClose}>
      <div
        className={`bg-black/80 backdrop-blur-3xl border ${isCapote ? 'border-rose-500/50' : 'border-white/10'} rounded-[4rem] p-6 sm:p-12 ${isTV ? 'w-[92vw] max-w-[1400px] py-20 sm:py-24 shadow-[0_0_100px_rgba(0,0,0,1)]' : 'w-full max-w-sm sm:max-w-md'} shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden max-h-[95vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute -top-1/4 -right-1/4 ${isTV ? 'w-[800px] h-[800px]' : 'w-96 h-96'} ${isCapote ? 'bg-rose-600/30' : theme.bg}/30 rounded-full blur-[150px] -z-10`}></div>

        <div className="flex flex-col items-center text-center">
          <div className={`${isTV ? 'w-32 h-32 mb-8' : 'w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4'} rounded-[2.5rem] flex items-center justify-center border ${isCapote ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : `${theme.bg}/10 ${theme.border} ${theme.text}`}`}>
            <TrophyIcon className={`${isTV ? 'w-16 h-16' : 'w-6 h-6 sm:w-7 sm:h-7'}`} />
          </div>
          <h1 className={`${isTV ? 'text-8xl' : 'text-2xl sm:text-3xl'} font-black uppercase tracking-tighter ${isCapote ? 'text-rose-500' : 'text-white'}`}>
            {isCapote ? 'CAPOTE!' : 'VITÓRIA!'}
          </h1>
          <p className={`${isTV ? 'text-3xl font-black italic mt-6' : 'text-xs font-bold mt-1 sm:mt-2'} ${theme.text}`}>{winnerNames}</p>

          <div className={`${isTV ? 'my-16 space-x-24' : 'my-4 sm:my-6 space-x-4'} w-full flex items-center justify-center`}>
            <div className="flex-1 text-right">
              <p className={`${isTV ? 'text-2xl mb-4' : 'text-[10px] sm:text-xs'} font-bold text-gray-400 truncate`}>{winnerNames}</p>
              <p className={`${isTV ? 'text-9xl' : 'text-3xl sm:text-4xl'} font-mono font-black text-white`}>{winningTeam.score}</p>
            </div>
            <p className={`${isTV ? 'text-5xl' : 'text-base sm:text-lg'} font-black text-gray-700`}>VS</p>
            <div className="flex-1 text-left">
              <p className={`${isTV ? 'text-2xl mb-4' : 'text-[10px] sm:text-xs'} font-bold text-gray-400 truncate`}>{loserNames}</p>
              <p className={`${isTV ? 'text-9xl' : 'text-3xl sm:text-4xl'} font-mono font-black text-gray-600`}>{losingTeam.score}</p>
            </div>
          </div>

          {/* Histórico de Sets */}
          {setResults && setResults.length > 0 && (
            <div className="w-full mb-6 bg-white/5 rounded-2xl p-3 border border-white/5">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Resumo por Sets</p>
              <div className="flex flex-col space-y-1.5">
                {setResults.map((res, i) => (
                  <div key={i} className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-gray-500">SET {i + 1}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-mono font-black ${res.A > res.B ? theme.text : 'text-gray-600'}`}>{res.A}</span>
                      <span className="text-gray-700 font-black">×</span>
                      <span className={`text-xs font-mono font-black ${res.B > res.A ? 'text-orange-400' : 'text-gray-600'}`}>{res.B}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isTV && (
            <>
              <div className="w-full flex space-x-2 sm:space-x-3">
                <button 
                  onClick={onNewGame} 
                  disabled={isSaving}
                  className="flex-1 py-3 sm:py-4 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] transition-colors hover:text-white disabled:opacity-50"
                >
                  Nova Partida
                </button>
                <button
                  onClick={() => {
                    setIsSaving(true);
                    onSave();
                  }}
                  disabled={isSaving}
                  className={`flex-1 py-3 sm:py-4 ${theme.bg} hover:opacity-90 text-white rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] shadow-xl ${theme.shadow} disabled:opacity-50 disabled:cursor-wait`}
                >
                  {isSaving ? 'Salvando...' : 'Salvar e Zerar'}
                </button>
              </div>

              <button
                onClick={onUndo}
                disabled={isSaving}
                className="mt-3 w-full py-2 sm:py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors border border-red-500/20 disabled:opacity-50"
              >
                Voltar (Desfazer Vitória)
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default VictoryModal;
