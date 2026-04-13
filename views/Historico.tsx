import React, { useState, useMemo } from 'react';
import { Match, Arena, Player } from '../types';
import { Trash2Icon, FileDownIcon, CalendarIcon, XCircleIcon, EditIcon, CheckIcon } from '../components/icons';

interface HistoricoProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  currentArena: Arena;
  onClearMatches: (mode: 'all' | 'day', date?: Date) => Promise<void>;
  onUpdateMatch?: (matchId: string, updatedData: Omit<Match, 'id' | 'timestamp'>) => Promise<void>;
  players: Player[];
  showAlert?: (title: string, message: string, type?: any, icon?: any) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, type?: any, icon?: any) => void;
}

const THEME_TEXT_CLASSES: Record<string, string> = {
  indigo: 'text-indigo-400', blue: 'text-blue-400', emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400', violet: 'text-violet-400'
};

const Historico: React.FC<HistoricoProps> = ({ matches, setMatches, currentArena, onClearMatches, onUpdateMatch, players, showAlert, showConfirm }) => {
  const [viewDate, setViewDate] = useState<Date | null>(new Date());
  const [showClearModal, setShowClearModal] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Match | null>(null);

  const arenaColor = currentArena.color || 'indigo';

  const navigateDate = (amount: number) => {
    const base = viewDate || new Date();
    const newDate = new Date(base);
    newDate.setDate(base.getDate() + amount);
    setViewDate(newDate);
  };

  const filteredMatches = useMemo(() => {
    if (!viewDate) return matches;
    const targetStr = viewDate.toDateString();
    return matches.filter(match => {
      return new Date(match.timestamp).toDateString() === targetStr;
    });
  }, [matches, viewDate]);

  const handleDelete = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const handleEdit = (match: Match) => {
    setEditingMatchId(match.id);
    setEditFormData({ ...match });
  };

  const handleSaveEdit = async () => {
    if (!editFormData || !editingMatchId) return;

    // Recalcular winner
    const winner = editFormData.teamA.score > editFormData.teamB.score ? 'A' : 'B';
    const updatedMatch = { ...editFormData, winner };

    if (onUpdateMatch) {
      await onUpdateMatch(editingMatchId, {
        teamA: updatedMatch.teamA,
        teamB: updatedMatch.teamB,
        winner: updatedMatch.winner,
        duration: updatedMatch.duration,
        capoteApplied: updatedMatch.capoteApplied,
        vaiATresTriggered: updatedMatch.vaiATresTriggered
      });
    }

    setMatches(prev => prev.map(m => m.id === editingMatchId ? { ...m, ...updatedMatch } : m));
    setEditingMatchId(null);
    setEditFormData(null);
    if (showAlert) showAlert("Sucesso", "Partida atualizada com sucesso!", 'success', 'check');
  };

  const handleExport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow || reportWindow.closed || typeof reportWindow.closed === 'undefined') {
      if (showAlert) showAlert("Pop-up Bloqueado", "Libere o acesso nas configurações do navegador para gerar o relatório.", 'warning', 'alert');
      return;
    }

    const reportTitle = `Histórico de Partidas - ${currentArena.name}`;
    const reportSubtitle = `Data: ${viewDate ? viewDate.toLocaleDateString('pt-BR') : 'Todas as datas'}`;

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0.5cm; background: white; color: black; font-size: 10pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .report-header { margin-bottom: 1.5rem; border-bottom: 2px solid black; padding-bottom: 0.5rem; }
                h1 { font-size: 1.5rem; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -0.02em; }
                h2 { font-size: 0.8rem; font-weight: 700; color: #444; margin: 0.3rem 0 0 0; text-transform: uppercase; letter-spacing: 0.05em; }
                
                table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 1rem; }
                th { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: #333; border-bottom: 2px solid black; padding: 0.8rem 0.5rem; }
                td { padding: 0.8rem 0.5rem; border-bottom: 1px solid #eee; vertical-align: middle; }
                
                .col-date { width: 15%; color: #666; font-size: 0.8rem; text-align: left; }
                .col-team-a { width: 32.5%; text-align: right; font-weight: 700; padding-right: 1.2rem; }
                .col-score { width: 10%; text-align: center; font-family: ui-monospace, monospace; font-weight: 900; font-size: 1.3rem; white-space: nowrap; }
                .col-team-b { width: 32.5%; text-align: left; font-weight: 700; padding-left: 1.2rem; }
                .col-tags { width: 10%; text-align: right; }
                
                .winner { color: #0044cc !important; font-weight: 900; }
                .score-x { color: #aaa; font-weight: 400; margin: 0 0.35rem; font-size: 1rem; }
                
                .tag { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; padding: 0.1rem 0.3rem; border: 1px solid #000; margin-left: 0.2rem; display: inline-block; white-space: nowrap; border-radius: 2px; }
                .tag-capote { border-color: #900; color: #900; background: #fff2f2 !important; }
                .tag-vaiatres { border-color: #960; color: #960; background: #fffcf0 !important; }
                
                @media print {
                    body { padding: 0; }
                    @page { size: A4 portrait; margin: 1.5cm; }
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
                        <th style="width: 15%; text-align: left;">Data</th>
                        <th style="width: 32.5%; text-align: right;">Equipe A</th>
                        <th style="width: 10%; text-align: center;">Placar</th>
                        <th style="width: 32.5%; text-align: left;">Equipe B</th>
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
                                <div style="font-size: 0.65rem; opacity: 0.6;">${match.duration} min</div>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <h1 className="text-xl sm:text-2xl font-black text-gray-100 uppercase tracking-tighter text-center sm:text-left">
          AUDITORIA DA ARENA <span className="text-indigo-400">{currentArena.name.toUpperCase()}</span>
               </h1>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {viewDate && (
            <div className="flex items-center gap-2 sm:gap-4 bg-gray-800/40 px-2 sm:px-4 py-2 rounded-full border border-gray-700/30">
              <button 
                onClick={() => navigateDate(-1)} 
                className={`${THEME_TEXT_CLASSES[arenaColor]} hover:text-white p-2 text-xl active:scale-90 transition-transform`}
              >
                ◀
              </button>
              <span className="text-sm sm:text-lg font-black text-gray-200 capitalize w-32 sm:w-40 text-center tracking-tighter">
                {viewDate.toLocaleDateString('pt-BR')}
              </span>
              <button 
                onClick={() => navigateDate(1)} 
                className={`${THEME_TEXT_CLASSES[arenaColor]} hover:text-white p-2 text-xl active:scale-90 transition-transform`}
              >
                ▶
              </button>
            </div>
          )}
          
          {!viewDate && (
            <button 
              onClick={() => setViewDate(new Date())}
              className="px-4 py-2 bg-gray-800 border border-gray-700/30 rounded-xl text-[10px] font-black uppercase text-indigo-400"
            >
              Ativar Filtro Diário
            </button>
          )}

          {viewDate && (
            <button 
              onClick={() => setViewDate(null)}
              className="p-2 text-gray-500 hover:text-white bg-gray-800/40 rounded-full border border-gray-700/20"
              title="Ver Tudo"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          )}

          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl text-[9px] font-black shadow-xl hover:bg-gray-600 transition-colors uppercase">
            <FileDownIcon className="w-3 h-3" />
            Exportar
          </button>
        </div>
      </div>

      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Histórico de Partidas - {currentArena.name}</h1>
        <p className="text-lg font-bold mt-2">Data: {viewDate ? viewDate.toLocaleDateString('pt-BR') : 'Todas'}</p>
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

              <div className="flex gap-1 print:hidden">
                <button
                  onClick={() => handleEdit(match)}
                  className="p-3 text-gray-600 hover:text-indigo-400 transition-colors rounded-xl"
                  title="Editar Partida"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                      if (showConfirm) {
                          showConfirm(
                              "Remover Partida",
                              "Deseja realmente apagar permanentemente o registro desta partida?",
                              () => handleDelete(match.id),
                              'danger',
                              'trash'
                          );
                      } else {
                          handleDelete(match.id);
                      }
                  }}
                  className="p-3 text-gray-600 hover:text-red-500 transition-colors rounded-xl"
                  title="Excluir Partida"
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

        {showClearModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300 print:hidden" onClick={() => setShowClearModal(false)}>
          <div className="bg-[#030712] border border-red-500/30 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-6 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500">
              <Trash2Icon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter text-center">Limpar Dados?</h2>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed text-center">
                Você deseja apagar as partidas da Arena <span className="text-red-400">{currentArena.name}</span>?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {viewDate && (
                <button
                  onClick={() => { onClearMatches('day', viewDate || undefined); setShowClearModal(false); }}
                  className="w-full p-4 bg-white/5 text-white/70 border border-white/5 hover:border-white/20 rounded-xl font-black uppercase text-[9px] tracking-widest flex flex-col items-center gap-1 active:scale-95 transition-all"
                >
                  <span>Apagar apenas o dia</span>
                  <span className="text-red-400 opacity-70">{(viewDate || new Date()).toLocaleDateString('pt-BR')}</span>
                </button>
              )}

              <button
                onClick={() => { onClearMatches('all'); setShowClearModal(false); }}
                className="w-full p-5 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all"
              >
                LIMPAR TODO O HISTÓRICO
              </button>

              <button
                onClick={() => setShowClearModal(false)}
                className="w-full p-4 text-white/30 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
               >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Partida */}
      {editingMatchId && editFormData && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300 print:hidden" onClick={() => setEditingMatchId(null)}>
          <div className="bg-[#090e1a] border border-white/10 rounded-[2rem] p-6 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Editar Auditoria</h2>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{formatDate(editFormData.timestamp)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Equipe A */}
              <div className="space-y-4 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">Equipe 1</h3>
                <div className="space-y-2">
                  {[0, 1].map(idx => (
                    <select
                      key={`a-${idx}`}
                      value={editFormData.teamA.players[idx]?.id || ''}
                      onChange={(e) => {
                        const player = players.find(p => p.id === e.target.value);
                        const newPlayers = [...editFormData.teamA.players];
                        newPlayers[idx] = player!;
                        setEditFormData({ ...editFormData, teamA: { ...editFormData.teamA, players: newPlayers } });
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                    >
                      <option value="">(Selecione)</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  ))}
                </div>
                <div className="pt-2">
                    <label className="text-[9px] font-black text-white/10 uppercase block text-center mb-1">Placar Final</label>
                    <div className="flex items-center justify-between bg-black/40 border border-blue-500/20 rounded-xl p-1">
                        <button 
                            onClick={() => setEditFormData({ ...editFormData, teamA: { ...editFormData.teamA, score: Math.max(0, editFormData.teamA.score - 1) } })}
                            className="w-10 h-10 flex items-center justify-center text-blue-400/40 hover:text-blue-400 text-2xl font-black active:scale-90 transition-all"
                        >
                            -
                        </button>
                        <span className="font-mono text-2xl font-black text-blue-400 min-w-[3rem] text-center">
                            {editFormData.teamA.score}
                        </span>
                        <button 
                            onClick={() => setEditFormData({ ...editFormData, teamA: { ...editFormData.teamA, score: editFormData.teamA.score + 1 } })}
                            className="w-10 h-10 flex items-center justify-center text-blue-400/40 hover:text-blue-400 text-2xl font-black active:scale-90 transition-all"
                        >
                            +
                        </button>
                    </div>
                </div>
              </div>

              {/* Equipe B */}
              <div className="space-y-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest text-center">Equipe 2</h3>
                <div className="space-y-2">
                  {[0, 1].map(idx => (
                    <select
                      key={`b-${idx}`}
                      value={editFormData.teamB.players[idx]?.id || ''}
                      onChange={(e) => {
                        const player = players.find(p => p.id === e.target.value);
                        const newPlayers = [...editFormData.teamB.players];
                        newPlayers[idx] = player!;
                        setEditFormData({ ...editFormData, teamB: { ...editFormData.teamB, players: newPlayers } });
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-all font-bold"
                    >
                      <option value="">(Selecione)</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  ))}
                </div>
                <div className="pt-2">
                    <label className="text-[9px] font-black text-white/10 uppercase block text-center mb-1">Placar Final</label>
                    <div className="flex items-center justify-between bg-black/40 border border-red-500/20 rounded-xl p-1">
                        <button 
                            onClick={() => setEditFormData({ ...editFormData, teamB: { ...editFormData.teamB, score: Math.max(0, editFormData.teamB.score - 1) } })}
                            className="w-10 h-10 flex items-center justify-center text-red-400/40 hover:text-red-400 text-2xl font-black active:scale-90 transition-all"
                        >
                            -
                        </button>
                        <span className="font-mono text-2xl font-black text-red-400 min-w-[3rem] text-center">
                            {editFormData.teamB.score}
                        </span>
                        <button 
                            onClick={() => setEditFormData({ ...editFormData, teamB: { ...editFormData.teamB, score: editFormData.teamB.score + 1 } })}
                            className="w-10 h-10 flex items-center justify-center text-red-400/40 hover:text-red-400 text-2xl font-black active:scale-90 transition-all"
                        >
                            +
                        </button>
                    </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setEditingMatchId(null)}
                className="flex-1 py-4 bg-white/5 text-white/40 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historico;
