
import React, { useState, useMemo } from 'react';
import { Match } from '../types';
import { Trash2Icon, HistoryIcon, CalendarIcon, XCircleIcon } from '../components/icons';

interface HistoricoProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

const Historico: React.FC<HistoricoProps> = ({ matches, setMatches }) => {
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');

  const filteredMatches = useMemo(() => {
    if (!filterDate) return matches;
    return matches.filter(match => {
      const matchDateStr = new Date(match.timestamp).toISOString().split('T')[0];
      return matchDateStr === filterDate;
    });
  }, [matches, filterDate]);

  const handleDelete = () => {
    if (matchToDelete) {
      setMatches(prev => prev.filter(m => m.id !== matchToDelete.id));
      setMatchToDelete(null);
    }
  };

  const handleClearHistory = () => {
    const confirmed = window.confirm("ATENÇÃO!\n\nIsto apagará permanentemente TODAS as partidas do histórico.\nEsta ação não pode ser desfeita.\n\nTem certeza?");
    if (confirmed) {
      setMatches([]);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="w-full p-4 flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-100 uppercase tracking-tight">Auditoria da Arena</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Seletor de Data */}
            <div className="relative flex-1 sm:flex-initial">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full sm:w-48 pl-10 pr-4 py-2 bg-gray-800 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {matches.length > 0 && !filterDate && (
              <button 
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors border border-red-500/20"
              >
                Limpar Tudo
              </button>
            )}
        </div>
      </div>

      {filterDate && (
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest bg-indigo-500/5 py-2 px-4 rounded-lg self-start">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
            Filtrando por: {new Date(filterDate + 'T00:00:00').toLocaleDateString('pt-BR')}
        </div>
      )}

      <div className="space-y-3">
        {filteredMatches.map(match => {
          const isWinnerA = match.winner === 'A';
          return (
            <div 
              key={match.id} 
              className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex flex-col items-center sm:items-start min-w-[120px]">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{formatDate(match.timestamp)}</span>
                <span className="text-xs font-bold text-indigo-400 mt-1">{match.duration} min de jogo</span>
              </div>

              <div className="flex-1 flex items-center justify-center gap-6 w-full">
                {/* Team A */}
                <div className="flex-1 text-right">
                  <div className={`text-sm font-black truncate transition-colors ${isWinnerA ? 'text-blue-400' : 'text-gray-500'}`}>
                    {match.teamA.players.map(p => p.name).join(' & ')}
                  </div>
                  <div className={`text-2xl font-mono font-bold transition-all ${isWinnerA ? 'text-blue-500 scale-110 origin-right' : 'text-gray-600 opacity-60'}`}>
                    {match.teamA.score}
                  </div>
                </div>

                <div className="text-gray-700 font-black italic text-xs">VS</div>

                {/* Team B */}
                <div className="flex-1 text-left">
                  <div className={`text-sm font-black truncate transition-colors ${!isWinnerA ? 'text-red-400' : 'text-gray-500'}`}>
                    {match.teamB.players.map(p => p.name).join(' & ')}
                  </div>
                  <div className={`text-2xl font-mono font-bold transition-all ${!isWinnerA ? 'text-red-500 scale-110 origin-left' : 'text-gray-600 opacity-60'}`}>
                    {match.teamB.score}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setMatchToDelete(match)}
                className="p-3 text-gray-600 hover:text-red-500 transition-colors active:scale-90 group-hover:bg-red-500/5 rounded-xl"
                title="Excluir partida"
              >
                <Trash2Icon />
              </button>
            </div>
          );
        })}

        {filteredMatches.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center gap-4 bg-gray-800/20 rounded-[3rem] border border-dashed border-gray-700/30">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center text-gray-700">
               <HistoryIcon />
            </div>
            <p className="text-gray-600 italic uppercase tracking-[0.2em] text-[10px]">
              {filterDate ? `Nenhum registro para ${new Date(filterDate + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Histórico da arena está vazio.'}
            </p>
            {filterDate && (
                <button onClick={() => setFilterDate('')} className="text-indigo-400 font-black text-[10px] uppercase hover:underline">Ver todas as partidas</button>
            )}
          </div>
        )}
      </div>

      {matchToDelete && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setMatchToDelete(null)}>
          <div className="bg-gray-900 border border-red-500/20 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
               <Trash2Icon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter text-center">Remover do Histórico?</h2>
            <p className="text-gray-400 mb-8 leading-relaxed text-center text-sm">
              Esta ação apagará o registro desta partida permanentemente. <br/>
              <span className="text-red-500 font-bold uppercase tracking-widest text-[10px] mt-2 block">O Ranking será recalculado.</span>
            </p>
            <div className="flex gap-4">
              <button onClick={() => setMatchToDelete(null)} className="flex-1 p-5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 p-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-900/20 transition-all">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historico;
