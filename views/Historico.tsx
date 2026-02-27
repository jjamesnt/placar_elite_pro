import React, { useState, useMemo } from 'react';
import { Match, Arena, Player } from '../types';
import { Trash2Icon, FileDownIcon, CalendarIcon, XCircleIcon, Edit2Icon, CheckIcon, XIcon } from '../components/icons';

interface HistoricoProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  currentArena: Arena;
  onClearMatches: (mode: 'all' | 'day', date?: Date) => Promise<void>;
  onUpdateMatch?: (matchId: string, updatedData: Omit<Match, 'id' | 'timestamp'>) => Promise<void>;
  players: Player[];
}

const Historico: React.FC<HistoricoProps> = ({ matches, setMatches, currentArena, onClearMatches, onUpdateMatch, players }) => {
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Match | null>(null);

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

  const handleClearConfirmed = async (mode: 'all' | 'day') => {
    const dateObj = filterDate ? new Date(filterDate + 'T12:00:00') : undefined;
    await onClearMatches(mode, dateObj);
    setShowClearModal(false);
  };

  const startEditing = (match: Match) => {
    setEditingMatchId(match.id);
    setEditFormData({ ...match });
  };

  const cancelEditing = () => {
    setEditingMatchId(null);
    setEditFormData(null);
  };

  const handleSaveEdit = async () => {
    if (!editFormData || !onUpdateMatch) return;

    // Recalcular vencedor
    const winner = editFormData.teamA.score > editFormData.teamB.score ? 'A' : 'B';
    const updatedData = {
      ...editFormData,
      winner
    };

    // Remover campos que não devem ser enviados no data_json do update
    const { id, timestamp, ...dataToSync } = updatedData as any;

    await onUpdateMatch(editFormData.id, dataToSync);
    setEditingMatchId(null);
    setEditFormData(null);
  };

  const handleEditChange = (team: 'A' | 'B', field: 'score' | 'players', value: any, playerIndex?: number) => {
    if (!editFormData) return;

    setEditFormData(prev => {
      if (!prev) return null;
      const newFormData = { ...prev };
      if (team === 'A') {
        if (field === 'score') newFormData.teamA.score = Number(value);
        if (field === 'players' && playerIndex !== undefined) {
          const newPlayers = [...newFormData.teamA.players];
          const selectedPlayer = players.find(p => p.id === value);
          if (selectedPlayer) newPlayers[playerIndex] = selectedPlayer;
          newFormData.teamA.players = newPlayers;
        }
      } else {
        if (field === 'score') newFormData.teamB.score = Number(value);
        if (field === 'players' && playerIndex !== undefined) {
          const newPlayers = [...newFormData.teamB.players];
          const selectedPlayer = players.find(p => p.id === value);
          if (selectedPlayer) newPlayers[playerIndex] = selectedPlayer;
          newFormData.teamB.players = newPlayers;
        }
      }
      return newFormData;
    });
  };

  const navigateDate = (amount: number) => {
    if (!filterDate) {
      setFilterDate(new Date().toISOString().split('T')[0]);
      return;
    }
    const current = new Date(filterDate + 'T12:00:00');
    current.setDate(current.getDate() + amount);
    setFilterDate(current.toISOString().split('T')[0]);
  };

  const currentPeriodLabel = useMemo(() => {
    if (!filterDate) return 'TODO O HISTÓRICO';
    const date = new Date(filterDate + 'T12:00:00');
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${weekday}, ${dayMonth}`;
  }, [filterDate]);

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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${reportTitle}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0.5cm; background: white; color: black; font-size: 10pt; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .report-header { margin-bottom: 1rem; border-bottom: 2px solid black; padding-bottom: 0.5rem; }
                h1 { font-size: 1.4rem; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -0.02em; }
                h2 { font-size: 0.8rem; font-weight: 700; color: #444; margin: 0.2rem 0 0 0; text-transform: uppercase; letter-spacing: 0.05em; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; table-layout: auto; }
                th { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: #333; border-bottom: 2px solid black; padding: 0.6rem 0.4rem; }
                td { padding: 0.6rem 0.4rem; border-bottom: 1px solid #eee; vertical-align: middle; word-break: break-word; }
                
                .col-date { width: 18%; color: #666; font-size: 0.75rem; text-align: left; line-height: 1.1; }
                .col-team-a { text-align: right; font-weight: 700; padding-right: 0.8rem; font-size: 0.9rem; }
                .col-score { width: 12%; text-align: center; font-family: ui-monospace, monospace; font-weight: 900; font-size: 1.2rem; white-space: nowrap; padding: 0 0.5rem; }
                .col-team-b { text-align: left; font-weight: 700; padding-left: 0.8rem; font-size: 0.9rem; }
                .col-tags { width: 10%; text-align: right; }
                
                .winner { color: #0044cc !important; font-weight: 900; }
                .score-x { color: #aaa; font-weight: 400; margin: 0 0.25rem; font-size: 0.9rem; }
                
                .tag { font-size: 0.55rem; font-weight: 900; text-transform: uppercase; padding: 0.1rem 0.25rem; border: 1px solid #000; margin-left: 0.15rem; display: inline-block; white-space: nowrap; border-radius: 2px; }
                .tag-capote { border-color: #900; color: #900; background: #fff2f2 !important; }
                .tag-vaiatres { border-color: #960; color: #960; background: #fffcf0 !important; }
                
                @media print {
                    body { padding: 0; }
                    @page { size: A4 portrait; margin: 1cm; }
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
                        <th style="width: 18%; text-align: left;">Data</th>
                        <th style="text-align: right;">Equipe A</th>
                        <th style="width: 12%; text-align: center;">Placar</th>
                        <th style="text-align: left;">Equipe B</th>
                        <th style="width: 10%; text-align: right;">Obs.</th>
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
                                <div style="font-size: 0.6rem; opacity: 0.6;">${match.duration} min</div>
                            </td>
                            <td class="col-team-a ${isWinnerA ? 'winner' : ''}">
                                ${match.teamA.players.map(p => p.name).join(' \u0026 ')}
                            </td>
                            <td class="col-score">
                                <span class="${isWinnerA ? 'winner' : ''}">${match.teamA.score}</span>
                                <span class="score-x">x</span>
                                <span class="${!isWinnerA ? 'winner' : ''}">${match.teamB.score}</span>
                            </td>
                            <td class="col-team-b ${!isWinnerA ? 'winner' : ''}">
                                ${match.teamB.players.map(p => p.name).join(' \u0026 ')}
                            </td>
                            <td class="col-tags">
                                ${match.capoteApplied ? '\u003cspan class="tag tag-capote"\u003eCapote\u003c/span\u003e' : ''}
                                ${match.vaiATresTriggered ? '\u003cspan class="tag tag-vaiatres"\u003eVai a 3\u003c/span\u003e' : ''}
                            </td>
                        </tr>
                        `
    }).join('')}
                </tbody>
            </table>
            ${filteredMatches.length === 0 ? '\u003cp style="text-align:center; padding: 2rem; color: #444; font-weight: bold;"\u003eNenhuma partida encontrada.\u003c/p\u003e' : ''}
            \u003cscript\u003e
                setTimeout(() => {
                    window.print();
                    window.onafterprint = () => window.close();
                }, 500);
            \u003c/script\u003e
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
      <div className="flex flex-col items-center gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-gray-100 uppercase tracking-tighter text-center sm:text-left">
            AUDITORIA DA ARENA <span className="text-indigo-400">{currentArena.name.toUpperCase()}</span>
          </h1>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowClearModal(true)} className="p-2.5 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600/30 transition-colors shadow-lg border border-red-500/20">
              <Trash2Icon className="w-4 h-4" />
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl text-[9px] font-black shadow-xl hover:bg-gray-600 transition-colors uppercase">
              <FileDownIcon className="w-3 h-3" />
              Exportar
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center justify-between w-full max-w-xl bg-gray-800/40 p-2 rounded-2xl border border-gray-700/30">
            <button
              onClick={() => navigateDate(-1)}
              className="p-3 text-indigo-400 hover:text-white transition-colors active:scale-90"
            >
              <span className="text-2xl">◀</span>
            </button>

            <div className="flex flex-col items-center flex-1">
              <span className="text-sm font-black text-gray-200 uppercase tracking-tighter text-center">
                {currentPeriodLabel}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent text-[9px] text-gray-500 focus:outline-none uppercase font-bold cursor-pointer hover:text-indigo-400 transition-colors"
                />
                {!filterDate ? (
                  <button
                    onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
                    className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-2 py-0.5 bg-indigo-500/10 rounded-full"
                  >
                    Ativar Filtro
                  </button>
                ) : (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-[9px] font-black text-rose-400 uppercase tracking-widest px-2 py-0.5 bg-rose-500/10 rounded-full"
                  >
                    Ver Tudo
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => navigateDate(1)}
              className="p-3 text-indigo-400 hover:text-white transition-colors active:scale-90"
            >
              <span className="text-2xl">▶</span>
            </button>
          </div>
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
              className={`bg-gray-800/40 border ${editingMatchId === match.id ? 'border-indigo-500' : 'border-gray-700/30'} rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-indigo-500/30 group print:border-gray-200 print:shadow-none print:p-2 print:flex-row transition-all`}
            >
              <div className="flex flex-col items-center sm:items-start min-w-[110px]">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{formatDate(match.timestamp)}</span>
                <span className="text-[11px] font-bold text-indigo-400 mt-1">{match.duration} min</span>
                <div className="flex gap-1 mt-1.5">
                  {match.capoteApplied && <span className="text-[7px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full uppercase">Capote</span>}
                  {match.vaiATresTriggered && <span className="text-[7px] font-black bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase">Vai a 3</span>}
                </div>
              </div>

              {editingMatchId === match.id && editFormData ? (
                <div className="flex-1 flex flex-col gap-4 w-full">
                  <div className="flex items-center justify-center gap-4 w-full">
                    {/* Team A Edit */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        {editFormData.teamA.players.map((p, idx) => (
                          <select
                            key={idx}
                            value={p.id}
                            onChange={(e) => handleEditChange('A', 'players', e.target.value, idx)}
                            className="bg-gray-700 text-white text-[10px] p-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {players.map(ap => (
                              <option key={ap.id} value={ap.id}>{ap.name}</option>
                            ))}
                          </select>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={editFormData.teamA.score}
                        onChange={(e) => handleEditChange('A', 'score', e.target.value)}
                        className="bg-gray-700 text-white text-center font-bold p-1 rounded border border-gray-600 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="text-gray-500 font-bold">VS</div>

                    {/* Team B Edit */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        {editFormData.teamB.players.map((p, idx) => (
                          <select
                            key={idx}
                            value={p.id}
                            onChange={(e) => handleEditChange('B', 'players', e.target.value, idx)}
                            className="bg-gray-700 text-white text-[10px] p-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {players.map(ap => (
                              <option key={ap.id} value={ap.id}>{ap.name}</option>
                            ))}
                          </select>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={editFormData.teamB.score}
                        onChange={(e) => handleEditChange('B', 'score', e.target.value)}
                        className="bg-gray-700 text-white text-center font-bold p-1 rounded border border-gray-600 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    <button onClick={handleSaveEdit} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors">
                      <CheckIcon className="w-3 h-3" /> Salvar
                    </button>
                    <button onClick={cancelEditing} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors">
                      <XIcon className="w-3 h-3" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-4 w-full">
                  <div className="flex-1 text-right">
                    <div className={`text-[11px] sm:text-sm font-black truncate transition-colors ${isWinnerA ? 'text-blue-400' : 'text-gray-500'}`}>
                      {match.teamA.players.map(p => p.name).join(' \u0026 ')}
                    </div>
                    <div className={`text-xl sm:text-2xl font-mono font-bold ${isWinnerA ? 'text-blue-500' : 'text-gray-600 opacity-60'}`}>
                      {match.teamA.score}
                    </div>
                  </div>

                  <div className="text-gray-700 font-black italic text-[10px] print:hidden">VS</div>

                  <div className="flex-1 text-left">
                    <div className={`text-[11px] sm:text-sm font-black truncate transition-colors ${!isWinnerA ? 'text-red-400' : 'text-gray-500'}`}>
                      {match.teamB.players.map(p => p.name).join(' \u0026 ')}
                    </div>
                    <div className={`text-xl sm:text-2xl font-mono font-bold ${!isWinnerA ? 'text-red-500' : 'text-gray-600 opacity-60'}`}>
                      {match.teamB.score}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-1 print:hidden">
                {!editingMatchId && (
                  <button
                    onClick={() => startEditing(match)}
                    className="p-3 text-gray-500 hover:text-indigo-400 transition-colors rounded-xl"
                  >
                    <Edit2Icon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setMatchToDelete(match)}
                  className="p-3 text-gray-600 hover:text-red-500 transition-colors rounded-xl print:hidden"
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
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
      {showClearModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 print:hidden" onClick={() => setShowClearModal(false)}>
          <div className="bg-gray-900 border border-red-500/20 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter text-center">Limpar Dados?</h2>
            <p className="text-gray-500 mb-8 text-center text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              Você deseja apagar as partidas da Arena <span className="text-indigo-400">{currentArena.name}</span>?
            </p>

            <div className="flex flex-col gap-3">
              {filterDate && (
                <button
                  onClick={() => handleClearConfirmed('day')}
                  className="w-full p-4 bg-gray-800 text-white border border-gray-700 rounded-2xl font-black uppercase text-[10px] flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span>Apagar apenas o dia</span>
                  <span className="text-indigo-400 opacity-70">{new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </button>
              )}

              <button
                onClick={() => handleClearConfirmed('all')}
                className="w-full p-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 transition-transform"
              >
                LIMPAR TODO O HISTÓRICO
              </button>

              <button
                onClick={() => setShowClearModal(false)}
                className="w-full p-4 text-gray-500 font-black uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historico;
