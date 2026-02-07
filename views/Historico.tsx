
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
    const reportSubtitle = `Data: ${filterDate ? new Date(filterDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Todas as datas'}`;

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 1.5rem; background: white; color: #111827; font-size: 9pt; line-height: 1.4; }
                .report-header { margin-bottom: 2rem; border-bottom: 2px solid #111827; padding-bottom: 1rem; }
                h1 { font-size: 1.4rem; font-weight: 800; text-transform: uppercase; color: #111827; margin: 0; letter-spacing: -0.02em; }
                h2 { font-size: 0.85rem; font-weight: 600; color: #4b5563; margin: 0.5rem 0 0 0; text-transform: uppercase; letter-spacing: 0.05em; }
                
                table { width: 100%; border-collapse: collapse; margin-block-start: 1rem; }
                th { text-align: left; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #111827; padding: 0.5rem 0.75rem; background: #f9fafb; }
                td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
                
                .col-date { white-space: nowrap; width: 15%; color: #6b7280; font-size: 0.75rem; }
                .col-team { font-weight: 700; color: #111827; width: 30%; }
                .col-score { text-align: center; width: 10%; font-family: ui-monospace, monospace; font-weight: 800; font-size: 1.1rem; }
                .col-vs { text-align: center; width: 5%; color: #9ca3af; font-weight: 900; font-style: italic; font-size: 0.7rem; }
                .col-tags { width: 10%; text-align: right; }
                
                .winner { color: #2563eb; }
                .tag { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 0.15rem 0.4rem; border-radius: 4px; border: 1px solid; margin-left: 0.25rem; display: inline-block; }
                .tag-capote { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
                .tag-vaiatres { border-color: #f59e0b; color: #f59e0b; background: #fffbeb; }
                
                @media print {
                    body { padding: 0; }
                    @page { margin: 1cm; }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>${reportTitle}</h1>
                <h2>${reportSubtitle}</h2>
            </div>
            <table>
                <thead>
                    <tr>
                        <th class="col-date">Data / Hora</th>
                        <th class="col-team" style="text-align: right;">Equipe A</th>
                        <th class="col-score">Placar</th>
                        <th class="col-team" style="text-align: left;">Equipe B</th>
                        <th class="col-tags">Obs.</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredMatches.map(match => {
      const isWinnerA = match.winner === 'A';
      const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(match.timestamp));
      return `
                        <tr>
                            <td class="col-date">
                                <div>${date}</div>
                                <div style="font-size: 0.65rem; opacity: 0.7;">${match.duration} min</div>
                            </td>
                            <td class="col-team ${isWinnerA ? 'winner' : ''}" style="text-align: right;">
                                ${match.teamA.players.map(p => p.name).join(' & ')}
                            </td>
                            <td class="col-score">
                                <span class="${isWinnerA ? 'winner' : ''}">${match.teamA.score}</span>
                                <span style="color: #d1d5db; font-weight: 400; margin: 0 0.25rem;">x</span>
                                <span class="${!isWinnerA ? 'winner' : ''}">${match.teamB.score}</span>
                            </td>
                            <td class="col-team ${!isWinnerA ? 'winner' : ''}" style="text-align: left;">
                                ${match.teamB.players.map(p => p.name).join(' & ')}
                            </td>
                            <td class="col-tags">
                                ${match.capoteApplied ? '<span class="tag tag-capote">Capote</span>' : ''}
                                ${match.vaiATresTriggered ? '<span class="tag tag-vaiatres">Vai a 3</span>' : ''}
                            </td>
                        </tr>
                        `
    }).join('')}
                </tbody>
            </table>
            ${filteredMatches.length === 0 ? '<p style="text-align:center; padding: 2rem; color: #6b7280; font-weight: 600;">Nenhuma partida encontrada para este filtro.</p>' : ''}
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
        <p className="text-lg font-bold mt-2">Data: {filterDate ? new Date(filterDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Todas'}</p>
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
