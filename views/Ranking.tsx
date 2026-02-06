
import React, { useState, useMemo } from 'react';
import { Match, Player, ArenaColor } from '../types';
import { FileDownIcon, Share2Icon } from '../components/icons';
import StoryPreviewModal from '../components/StoryPreviewModal';
import ExportPreviewModal from '../components/ExportPreviewModal';

type Filter = 'Hoje' | 'Semanal' | 'Mensal' | 'Anual' | 'Total';

interface RankingProps {
  matches: Match[];
  players: Player[];
  arenaName?: string;
  arenaColor?: ArenaColor;
}

const THEME_HEX: Record<ArenaColor, string> = {
  indigo: '#6366f1', blue: '#3b82f6', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', violet: '#8b5cf6'
};

const THEME_TEXT_CLASSES: Record<ArenaColor, string> = {
  indigo: 'text-indigo-400', blue: 'text-blue-400', emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400', violet: 'text-violet-400'
};

const THEME_BG_CLASSES: Record<ArenaColor, string> = {
  indigo: 'bg-indigo-600', blue: 'bg-blue-600', emerald: 'bg-emerald-600', amber: 'bg-amber-600', rose: 'bg-rose-600', violet: 'bg-violet-600'
};

const Ranking: React.FC<RankingProps> = ({ matches, players, arenaName, arenaColor = 'indigo' }) => {
  const [filter, setFilter] = useState<Filter>('Hoje');
  const [viewDate, setViewDate] = useState(new Date());
  const [exportImageUrl, setExportImageUrl] = useState<string | null>(null);
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);

  const themeHex = THEME_HEX[arenaColor];

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const matchDate = new Date(match.timestamp);
      const isSameDay = matchDate.toDateString() === viewDate.toDateString();
      const isSameMonth = matchDate.getMonth() === viewDate.getMonth() && matchDate.getFullYear() === viewDate.getFullYear();
      const isSameYear = matchDate.getFullYear() === viewDate.getFullYear();

      switch (filter) {
        case 'Hoje': return isSameDay;
        case 'Semanal': {
          const startOfWeek = new Date(viewDate);
          startOfWeek.setDate(viewDate.getDate() - viewDate.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return matchDate >= startOfWeek && matchDate <= endOfWeek;
        }
        case 'Mensal': return isSameMonth;
        case 'Anual': return isSameYear;
        case 'Total': return true;
        default: return true;
      }
    });
  }, [matches, filter, viewDate]);

  const stats = useMemo(() => {
    const playerDailyStats = new Map<string, Map<string, { wins: number, games: number }>>();
    
    filteredMatches.forEach(match => {
      const winningTeam = match.winner === 'A' ? match.teamA : match.teamB;
      const dateKey = new Date(match.timestamp).toDateString();
      
      [match.teamA, match.teamB].forEach(team => {
        team.players.forEach(p => {
          if (!playerDailyStats.has(p.id)) playerDailyStats.set(p.id, new Map());
          const daily = playerDailyStats.get(p.id)!;
          if (!daily.has(dateKey)) daily.set(dateKey, { wins: 0, games: 0 });
          const dStats = daily.get(dateKey)!;
          dStats.games += 1;
          if (winningTeam.players.some(wp => wp.id === p.id)) dStats.wins += 1;
        });
      });
    });

    return Array.from(playerDailyStats.entries()).map(([id, dailyMap]) => {
      const player = players.find(p => p.id === id);
      if (!player) return null; 

      let totalWins = 0;
      let totalGames = 0;
      let zeroWinsDays = 0;
      const days = dailyMap.size;
      
      dailyMap.forEach(d => {
        totalWins += d.wins;
        totalGames += d.games;
        if (d.wins === 0) zeroWinsDays += 1;
      });

      const letalidade = totalWins / (days || 1);
      const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      return {
        player,
        wins: totalWins,
        games: totalGames,
        days,
        letalidade,
        winRate,
        zeroWinsDays
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.days > 0)
    .sort((a, b) => b.letalidade - a.letalidade || b.wins - a.wins);
  }, [filteredMatches, players]);

  const podium = stats.slice(0, 3);

  const navigateDate = (amount: number) => {
    const newDate = new Date(viewDate);
    if (filter === 'Mensal') newDate.setMonth(viewDate.getMonth() + amount);
    else if (filter === 'Anual') newDate.setFullYear(viewDate.getFullYear() + amount);
    else newDate.setDate(viewDate.getDate() + amount);
    setViewDate(newDate);
  };

  const generateExportImage = async (isStory: boolean) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.3, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(arenaName ? `ARENA ${arenaName.toUpperCase()}` : 'PLACAR ELITE PRO', centerX, 100);
    ctx.fillStyle = themeHex;
    ctx.font = '900 95px sans-serif';
    const titleText = filter === 'Hoje' ? 'RANKING DO DIA' : `RANKING ${filter.toUpperCase()}`;
    ctx.fillText(titleText, centerX, 240);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 65px sans-serif';
    const dateLabel = filter === 'Mensal' ? viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase() : viewDate.toLocaleDateString('pt-BR');
    ctx.fillText(dateLabel, centerX, 320);

    const podium = stats.slice(0, 3);
    const podiumY = 420;
    const podiumBoxWidth = 280;
    const podiumHeights = [200, 150, 120];
    const podiumColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
    const positions = [{rank: 2, x: centerX - podiumBoxWidth - 20}, {rank: 1, x: centerX}, {rank: 3, x: centerX + podiumBoxWidth + 20}];
    
    positions.forEach(pos => {
      const playerStat = podium.find((p, i) => i + 1 === pos.rank);
      if (!playerStat) return;
      
      const heightIndex = pos.rank === 1 ? 0 : (pos.rank === 2 ? 1 : 2);
      const x = pos.x;
      const y = podiumY + (podiumHeights[0] - podiumHeights[heightIndex]);

      ctx.fillStyle = `rgba(255, 255, 255, 0.05)`;
      ctx.strokeStyle = podiumColors[heightIndex];
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(x - podiumBoxWidth / 2, y, podiumBoxWidth, podiumHeights[heightIndex] + 80, [20]);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 80px sans-serif';
      ctx.fillStyle = podiumColors[heightIndex];
      ctx.fillText(`${pos.rank}º`, x, y + 90);

      ctx.font = 'bold 38px sans-serif';
      ctx.fillStyle = '#ffffff';
      let nameText = playerStat.player.name.toUpperCase();
      if (ctx.measureText(nameText).width > podiumBoxWidth - 40) {
        nameText = nameText.substring(0, 10) + '...';
      }
      ctx.fillText(nameText, x, y + 160);
      
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`LET: ${playerStat.letalidade.toFixed(2)}`, x, y + 210);
    });

    const otherPlayers = stats.slice(3);
    if (otherPlayers.length > 0) {
        const listStartY = podiumY + podiumHeights[0] + 150;
        const listEndY = height - 120;
        const availableHeight = listEndY - listStartY;
        let rowHeight = Math.min(80, availableHeight / otherPlayers.length);
        let nameFontSize = Math.max(26, Math.min(36, rowHeight * 0.4));
        
        ctx.font = `bold ${nameFontSize}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText("DEMAIS ATLETAS", 100, listStartY - 40);

        otherPlayers.forEach((s, i) => {
            const rank = i + 4;
            const rowY = listStartY + (i * rowHeight) + (rowHeight / 2);
            
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
            ctx.fillRect(80, rowY - rowHeight/2, width - 160, rowHeight);

            ctx.font = `bold ${nameFontSize}px sans-serif`;
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`${rank}º`, 120, rowY + (nameFontSize / 3));

            ctx.fillStyle = '#ffffff';
            ctx.fillText(s.player.name.toUpperCase(), 220, rowY + (nameFontSize / 3));
            
            ctx.textAlign = 'right';
            ctx.font = `bold ${nameFontSize - 2}px sans-serif`;
            ctx.fillText(`LET: ${s.letalidade.toFixed(2)}`, width - 120, rowY + (nameFontSize / 3));
            ctx.textAlign = 'left';
        });
    }

    setExportImageUrl(canvas.toDataURL('image/png'));
    setIsStoryMode(isStory);
  };

  const currentPeriodLabel = useMemo(() => {
    if (filter === 'Hoje') return viewDate.toLocaleDateString('pt-BR');
    if (filter === 'Mensal') return viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (filter === 'Anual') return viewDate.getFullYear().toString();
    return filter;
  }, [filter, viewDate]);
  
  const handleExport = () => {
    setShowReportSelector(false);
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
        alert("Não foi possível abrir a janela de exportação. Verifique se seu navegador está bloqueando pop-ups.");
        return;
    }
    
    const reportTitle = `Ranking ${arenaName || 'Placar Elite Pro'} - ${filter}`;
    const dateLabel = currentPeriodLabel;

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 2rem; background: #f8f9fa; }
                .report-container { max-width: 800px; margin: auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { font-size: 1.5rem; font-weight: 900; text-transform: uppercase; color: #343a40; }
                p { font-size: 1rem; color: #6c757d; border-bottom: 2px solid #dee2e6; padding-bottom: 1rem; margin-bottom: 1.5rem; }
                table { width: 100%; border-collapse: collapse; }
                th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #dee2e6; }
                th { font-weight: 700; text-transform: uppercase; font-size: 0.75rem; color: #495057; }
                tbody tr:nth-child(odd) { background-color: #f8f9fa; }
                .center { text-align: center; }
                .letalidade { font-weight: 900; color: ${themeHex}; }
                @media print {
                    body { background: white; padding: 0; }
                    .report-container { box-shadow: none; border: none; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <h1>${reportTitle}</h1>
                <p>${dateLabel}</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Atleta</th>
                            <th class="center">Vitórias</th>
                            <th class="center">Sem Pontuar</th>
                            <th class="center">Letalidade (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.map((s, i) => `
                            <tr>
                                <td><strong>${i + 1}º</strong></td>
                                <td>${s.player.name}</td>
                                <td class="center">${s.wins}</td>
                                <td class="center">${s.zeroWinsDays > 0 ? `${s.zeroWinsDays}d` : '-'}</td>
                                <td class="center letalidade">${s.letalidade.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        ${stats.length === 0 ? '<tr><td colspan="5" class="center">Nenhum dado registrado.</td></tr>' : ''}
                    </tbody>
                </table>
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

  return (
    <div className="w-full flex flex-col gap-3 p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-3 print:hidden">
        <div className="flex bg-gray-800/90 backdrop-blur rounded-2xl p-1.5 shadow-2xl w-full max-w-xl border border-gray-700/50">
          {(['Hoje', 'Semanal', 'Mensal', 'Anual', 'Total'] as Filter[]).map(f => (
            <button 
              key={f} onClick={() => { setFilter(f); setViewDate(new Date()); }}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${filter === f ? `${THEME_BG_CLASSES[arenaColor]} text-white shadow-lg` : 'text-gray-500 hover:text-white'}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {filter !== 'Total' && (
          <div className="flex items-center gap-4 bg-gray-800/40 px-4 py-2 rounded-full border border-gray-700/30">
            <button onClick={() => navigateDate(-1)} className={`${THEME_TEXT_CLASSES[arenaColor]} hover:text-white p-2 text-xl active:scale-90 transition-transform`}>◀</button>
            <span className="text-2xl font-black text-gray-200 capitalize w-64 text-center tracking-tighter">{currentPeriodLabel}</span>
            <button onClick={() => navigateDate(1)} className={`${THEME_TEXT_CLASSES[arenaColor]} hover:text-white p-2 text-xl active:scale-90 transition-transform`}>▶</button>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => generateExportImage(true)} className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-${arenaColor}-600 to-indigo-700 text-white rounded-xl text-[10px] font-black shadow-xl hover:scale-105 transition-transform active:scale-95 uppercase`}>
            <Share2Icon className="w-4 h-4" /> Exportar Story
          </button>
          <button onClick={() => setShowReportSelector(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-xl text-[10px] font-black shadow-xl hover:bg-gray-600 transition-colors uppercase">
            <FileDownIcon className="w-4 h-4" /> Relatório PDF
          </button>
        </div>
      </div>

      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Relatório {arenaName || 'Placar Elite Pro'}</h1>
          <p className="text-xl font-bold mt-2">Ranking {filter}: {currentPeriodLabel}</p>
          <p className="text-sm text-gray-500 mt-1">Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
      </div>

      <div className="bg-gray-800/40 rounded-3xl p-3 border border-gray-700/50 shadow-inner mt-4 print:border-none print:shadow-none print:p-0 print:bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm print-table">
            <thead className="text-gray-500 font-black uppercase tracking-widest border-b border-gray-700/50 print:text-black print:border-black">
              <tr>
                <th className="px-3 py-4 print-th">#</th>
                <th className="px-3 py-4 print-th">ATLETA</th>
                <th className="px-3 py-4 text-center print-th">VITÓRIAS</th>
                <th className="px-3 py-4 text-center print-th">SEM PONTUAR</th>
                <th className={`px-3 py-4 text-center print:text-black ${THEME_TEXT_CLASSES[arenaColor]}`}>LETALIDADE (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/20 print:divide-none">
              {stats.map((s, i) => (
                <tr key={s.player.id} className={`${i < 3 ? 'bg-indigo-500/10' : ''} hover:bg-white/5 transition-colors print:bg-transparent print-tr`}>
                  <td className="px-3 py-4 font-mono font-bold text-gray-500 print:text-black print-td">
                    <span className={i < 3 ? `${THEME_TEXT_CLASSES[arenaColor]} font-black text-lg` : ''}>{i + 1}º</span>
                  </td>
                  <td className={`px-3 py-4 font-black ${i < 3 ? 'text-white' : 'text-gray-300'} print:text-black print:font-bold print-td`}>
                    <div className="flex items-center gap-2 print:block">
                       {i === 0 && <span className="text-yellow-400 text-lg print:hidden">👑</span>}
                       <span className="truncate">{s.player.name}</span>
                       {s.wins === 0 && <span title="Sem vitórias no período">😢</span>}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center font-bold text-gray-400 print:text-black print-td">{s.wins}</td>
                  <td className="px-3 py-4 text-center font-bold text-red-500/60 print:text-black print-td">
                    {s.zeroWinsDays > 0 ? `${s.zeroWinsDays}d` : '-'}
                  </td>
                  <td className="px-3 py-4 text-center print-td">
                    <div className="flex flex-col items-center">
                      <span className={`font-mono font-black ${i < 3 ? `${THEME_TEXT_CLASSES[arenaColor]} text-lg` : 'text-gray-300 text-base'} print:text-black`}>
                        {s.letalidade.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-gray-500 font-black print:text-black/60">{s.winRate.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                   <td colSpan={5} className="text-center py-20 text-gray-500 italic uppercase tracking-widest text-[10px] print:text-black">Nenhum dado registrado para o período {filter}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReportSelector && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6 print:hidden" onClick={() => setShowReportSelector(false)}>
          <div className="bg-gray-900 border border-indigo-500/20 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-2 tracking-tighter uppercase">Gerar Relatório PDF</h2>
            <p className="text-gray-500 text-center text-xs mb-8 sm:mb-10 font-bold uppercase tracking-widest">Baseado no período: <strong>{filter} ({currentPeriodLabel})</strong></p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleExport}
                className={`w-full ${THEME_BG_CLASSES[arenaColor]} hover:opacity-90 text-white py-5 sm:py-6 rounded-2xl sm:rounded-[2rem] flex flex-col items-center gap-2 transition-all active:scale-95 shadow-xl`}
              >
                <span className="text-lg sm:text-xl font-black tracking-tighter uppercase">Imprimir Relatório</span>
                <span className="text-[10px] font-bold opacity-70">ABRIR RELATÓRIO EM NOVA ABA</span>
              </button>
              
              <button 
                onClick={() => setShowReportSelector(false)}
                className="w-full p-4 sm:p-5 bg-white/5 text-gray-500 rounded-2xl sm:rounded-3xl font-black hover:text-white transition-colors uppercase tracking-[0.3em] text-[10px]"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {exportImageUrl && (isStoryMode ? (
        <StoryPreviewModal imageUrl={exportImageUrl} onClose={() => setExportImageUrl(null)} />
      ) : (
        <ExportPreviewModal imageUrl={exportImageUrl} title={`Ranking ${filter}`} onClose={() => setExportImageUrl(null)} />
      ))}
    </div>
  );
};

export default Ranking;
