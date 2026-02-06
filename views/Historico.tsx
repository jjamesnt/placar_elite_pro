
import React, { useState, useMemo } from 'react';
import { Match, Arena } from '../types';
import { Trash2Icon, FileDownIcon, CalendarIcon, XCircleIcon } from '../components/icons';

interface HistoricoProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  currentArena: Arena;
}

const Historico: React.FC<HistoricoProps> = ({ matches, setMatches, currentArena }) => {
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

  const handleExport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
        alert("Não foi possível abrir a janela de exportação. Verifique se seu navegador está bloqueando pop-ups.");
        return;
    }
    
    const reportTitle = `Histórico de Partidas - ${currentArena.name}`;
    const reportSubtitle = `Data: ${filterDate ? new Date(filterDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Todas as datas'}`;

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 1.5rem; background: white; color: #111827; font-size: 10pt; line-height: 1.5; }
                .report-container { max-width: 800px; margin: auto; }
                h1 { font-size: 1.5rem; font-weight: 700; text-transform: uppercase; color: #111827; margin: 0; }
                h2 { font-size: 0.9rem; font-weight: 500; color: #6b7280; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; }
                .match-item { padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
                .match-item:last-child { border-bottom: none; }
                .match-info { font-size: 0.75rem; color: #6b7280; min-width: 100px; }
                .match-teams { flex-grow: 1; display: flex; justify-content: center; align-items: center; gap: 1rem; font-size: 0.9rem; font-weight: 600; }
                .team { display: flex; flex-direction: column; text-align: center; }
                .team-name { font-size: 0.85rem; }
                .team-score { font-size: 1.25rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-weight: 700; }
                .team-winner .team-name { color: #111827; }
                .team-winner .team-score { color: #111827; }
                .team-loser .team-name { color: #6b7280; }
                .team-loser .team-score { color: #6b7280; }
                .vs { font-size: 0.7rem; color: #9ca3af; font-weight: 700; }
                .tags { display: flex; gap: 0.25rem; margin-top: 0.25rem; }
                .tag { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 0.1rem 0.4rem; border-radius: 99px; border: 1px solid; }
                .tag-capote { border-color: #ef4444; color: #ef4444; }
                .tag-vaiatres { border-color: #f59e0b; color: #f59e0b; }
                @media print {
                    body { padding: 0; }
                    .report-container { box-shadow: none; border: none; margin: 0; max-width: 100%; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <h1>${reportTitle}</h1>
                <h2>${reportSubtitle}</h2>
                ${filteredMatches.map(match => {
                    const isWinnerA = match.winner === 'A';
                    return `
                    <div class="match-item">
                        <div class="match-info">
                            <div>${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(match.timestamp))}</div>
                            <div>Duração: ${match.duration} min</div>
                            <div class="tags">
                                ${match.capoteApplied ? '<span class="tag tag-capote">Capote</span>' : ''}
                                ${match.vaiATresTriggered ? '<span class="tag tag-vaiatres">Vai a 3</span>' : ''}
                            </div>
                        </div>
                        <div class="match-teams">
                            <div class="team ${isWinnerA ? 'team-winner' : 'team-loser'}">
                                <span class="team-name">${match.teamA.players.map(p => p.name).join(' & ')}</span>
                                <span class="team-score">${match.teamA.score}</span>
                            </div>
                            <span class="vs">vs</span>
                            <div class="team ${!isWinnerA ? 'team-winner' : 'team-loser'}">
                                <span class="team-name">${match.teamB.players.map(p => p.name).join(' & ')}</span>
                                <span class="team-score">${match.teamB.score}</span>
                            </div>
                        </div>
                    </div>
                    `
                }).join('')}
                 ${filteredMatches.length === 0 ? '<p style="text-align:center; padding: 2rem; color: #6c757d;">Nenhuma partida encontrada para este filtro.</p>' : ''}
            </div>
            <script>
                setTimeout(() => {
                    window.print();
                    window.onafterprint = () => window.close();
                }, 500);
            </script>
        </body>
        </html>
    `;

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
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
    <div className="w-full p-4 flex flex-col gap-6 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <h1 className="text-xl sm:text-2xl font-black text-gray-100 uppercase tracking-tighter text-center sm:text-left">
          AUDITORIA DA ARENA <span className="text-indigo-400">{currentArena.name.toUpperCase()}</span>
        </h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full sm:w-48 pl-10 pr-4 py-2 bg-gray-800 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl text-[9px] font-black shadow-xl hover:bg-gray-600 transition-colors uppercase">
              <FileDownIcon className="w-3 h-3" />
              Exportar
            </button>
        </div>
      </div>
      
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Histórico de Partidas - {currentArena.name}</h1>
        <p className="text-lg font-bold mt-2">Data: {filterDate ? new Date(filterDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Todas'}</p>
      </div>

      <div className="space-y-3">
        {filteredMatches.map(match => {
          const isWinnerA = match.winner === 'A';
          return (
            <div 
              key={match.id} 
              className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-indigo-500/30 group print:border-gray-200 print:shadow-none print:p-2 print:flex-row"
            >
              <div className="flex flex-col items-center sm:items-start min-w-[110px]">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{formatDate(match.timestamp)}</span>
                <span className="text-[11px] font-bold text-indigo-400 mt-1">{match.duration} min</span>
                <div className="flex gap-1 mt-1.5">
                  {match.capoteApplied && <span className="text-[7px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full uppercase">Capote</span>}
                  {match.vaiATresTriggered && <span className="text-[7px] font-black bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase">Vai a 3</span>}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center gap-4 w-full">
                <div className="flex-1 text-right">
                  <div className={`text-[11px] sm:text-sm font-black truncate transition-colors ${isWinnerA ? 'text-blue-400' : 'text-gray-500'}`}>
                    {match.teamA.players.map(p => p.name).join(' & ')}
                  </div>
                  <div className={`text-xl sm:text-2xl font-mono font-bold ${isWinnerA ? 'text-blue-500' : 'text-gray-600 opacity-60'}`}>
                    {match.teamA.score}
                  </div>
                </div>

                <div className="text-gray-700 font-black italic text-[10px] print:hidden">VS</div>

                <div className="flex-1 text-left">
                  <div className={`text-[11px] sm:text-sm font-black truncate transition-colors ${!isWinnerA ? 'text-red-400' : 'text-gray-500'}`}>
                    {match.teamB.players.map(p => p.name).join(' & ')}
                  </div>
                  <div className={`text-xl sm:text-2xl font-mono font-bold ${!isWinnerA ? 'text-red-500' : 'text-gray-600 opacity-60'}`}>
                    {match.teamB.score}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setMatchToDelete(match)}
                className="p-3 text-gray-600 hover:text-red-500 transition-colors rounded-xl print:hidden"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {filteredMatches.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4 bg-gray-800/20 rounded-[3rem] border border-dashed border-gray-700/30 print:hidden">
            <span className="text-gray-600 italic uppercase tracking-widest text-[9px]">Histórico vazio para a data selecionada.</span>
          </div>
        )}
      </div>

      {matchToDelete && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 print:hidden" onClick={() => setMatchToDelete(null)}>
          <div className="bg-gray-900 border border-red-500/20 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-white mb-4 uppercase tracking-tighter text-center">Remover Partida?</h2>
            <p className="text-gray-400 mb-8 text-center text-xs leading-relaxed">Esta ação apagará o registro permanentemente.</p>
            <div className="flex gap-4">
              <button onClick={() => setMatchToDelete(null)} className="flex-1 p-4 bg-gray-800 text-gray-400 rounded-2xl font-black uppercase text-[10px]">Voltar</button>
              <button onClick={handleDelete} className="flex-1 p-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px]">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historico;
