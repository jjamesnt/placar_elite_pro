
import React, { useState, useMemo } from 'react';
import { Match, Player } from '../types';
import { FileDownIcon, Share2Icon } from '../components/icons';
import StoryPreviewModal from '../components/StoryPreviewModal';
import ExportPreviewModal from '../components/ExportPreviewModal';

type Filter = 'Hoje' | 'Semanal' | 'Mensal' | 'Anual' | 'Total';

interface RankingProps {
  matches: Match[];
  players: Player[];
}

const Ranking: React.FC<RankingProps> = ({ matches, players }) => {
  const [filter, setFilter] = useState<Filter>('Hoje');
  const [viewDate, setViewDate] = useState(new Date());
  const [exportImageUrl, setExportImageUrl] = useState<string | null>(null);
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);

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
        player: players.find(p => p.id === id)!,
        wins: totalWins,
        games: totalGames,
        days,
        letalidade,
        winRate,
        zeroWinsDays
      };
    })
    .filter(s => s.days > 0)
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

    const width = isStory ? 1080 : 1200;
    const height = isStory ? 1920 : 1600;
    canvas.width = width;
    canvas.height = height;

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    
    // Topo Story: Apenas Ranking e Data/Período
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 100px sans-serif';
    const dateLabel = filter === 'Mensal' 
      ? viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : viewDate.toLocaleDateString('pt-BR');
    
    const titleText = filter === 'Hoje' ? 'RANKING DO DIA' : `RANKING ${filter.toUpperCase()}`;
    ctx.fillText(titleText, centerX, 180);
    
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText(dateLabel, centerX, 265);

    // Marca d'água no rodapé
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('PLACAR ELITE PRO • v1.0', centerX, height - 80);

    const podiumBaseY = isStory ? 950 : 850;
    
    const drawPodium = (data: typeof stats[0], pos: 1|2|3, x: number, w: number, h: number, color: string) => {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(x - w/2, podiumBaseY - h, w, h, 40);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.stroke();

      const cardCenterX = x;
      const cardTopY = podiumBaseY - h;

      ctx.fillStyle = color;
      ctx.font = 'bold 110px sans-serif';
      ctx.fillText(`${pos}º`, cardCenterX, cardTopY + 140);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(data.player.name.toUpperCase().substring(0, 14), cardCenterX, cardTopY + 230);

      ctx.fillStyle = color;
      ctx.font = 'bold 80px sans-serif';
      ctx.fillText(data.letalidade.toFixed(2), cardCenterX, cardTopY + 320);
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('LETALIDADE', cardCenterX, cardTopY + 365);
      
      ctx.fillStyle = color;
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(`${data.winRate.toFixed(0)}%`, cardCenterX, cardTopY + 425);
    };

    if (podium[1]) drawPodium(podium[1], 2, centerX - 330, 310, 480, '#94a3b8');
    if (podium[2]) drawPodium(podium[2], 3, centerX + 330, 310, 420, '#d97706');
    if (podium[0]) drawPodium(podium[0], 1, centerX, 370, 600, '#fbbf24');

    const tableTopY = podiumBaseY + 150;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('ATLETA', 100, tableTopY);
    ctx.textAlign = 'center';
    ctx.fillText('VIT', width - 480, tableTopY);
    ctx.fillText('S.P.', width - 300, tableTopY);
    ctx.fillText('LETALIDADE', width - 120, tableTopY);

    stats.slice(0, isStory ? 10 : 25).forEach((s, i) => {
      const rowY = tableTopY + 100 + (i * 85);
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(60, rowY - 60, width - 120, 85);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = i < 3 ? '#fbbf24' : '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      const name = s.wins === 0 ? `${s.player.name} 😢` : s.player.name;
      ctx.fillText(`${i + 1}º ${name.substring(0, 18)}`, 80, rowY);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(s.wins.toString(), width - 480, rowY);
      ctx.fillText(`${s.zeroWinsDays}d`, width - 300, rowY);
      ctx.fillStyle = i < 3 ? '#fbbf24' : '#818cf8';
      ctx.fillText(`${s.letalidade.toFixed(2)} (${s.winRate.toFixed(0)}%)`, width - 120, rowY);
    });

    setExportImageUrl(canvas.toDataURL('image/png'));
    setIsStoryMode(isStory);
  };

  const currentPeriodLabel = useMemo(() => {
    if (filter === 'Hoje') return viewDate.toLocaleDateString('pt-BR');
    if (filter === 'Mensal') return viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (filter === 'Anual') return viewDate.getFullYear().toString();
    return filter;
  }, [filter, viewDate]);

  return (
    <div className="w-full flex flex-col gap-3 p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-500">
      {/* Navegação e Filtros */}
      <div className="flex flex-col items-center gap-3 print:hidden">
        <div className="flex bg-gray-800/90 backdrop-blur rounded-2xl p-1.5 shadow-2xl w-full max-w-xl border border-gray-700/50">
          {(['Hoje', 'Semanal', 'Mensal', 'Anual', 'Total'] as Filter[]).map(f => (
            <button 
              key={f} onClick={() => { setFilter(f); setViewDate(new Date()); }}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {filter !== 'Total' && (
          <div className="flex items-center gap-4 bg-gray-800/40 px-4 py-2 rounded-full border border-gray-700/30">
            <button onClick={() => navigateDate(-1)} className="text-indigo-400 hover:text-white p-2 text-xl active:scale-90 transition-transform">◀</button>
            <span className="text-sm font-black text-gray-200 capitalize w-44 text-center">{currentPeriodLabel}</span>
            <button onClick={() => navigateDate(1)} className="text-indigo-400 hover:text-white p-2 text-xl active:scale-90 transition-transform">▶</button>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => generateExportImage(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-xl text-[10px] font-black shadow-xl hover:scale-105 transition-transform active:scale-95">
            <Share2Icon className="w-4 h-4" /> EXPORTAR STORY
          </button>
          <button onClick={() => setShowReportSelector(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-xl text-[10px] font-black shadow-xl hover:bg-gray-600 transition-colors">
            <FileDownIcon className="w-4 h-4" /> RELATÓRIO PDF
          </button>
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-gray-800/40 rounded-3xl p-3 border border-gray-700/50 shadow-inner overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500 font-black uppercase tracking-widest border-b border-gray-700/50">
              <tr>
                <th className="px-3 py-4">#</th>
                <th className="px-3 py-4">ATLETA</th>
                <th className="px-3 py-4 text-center">VITÓRIAS</th>
                <th className="px-3 py-4 text-center">SEM PONTUAR</th>
                <th className="px-3 py-4 text-center text-indigo-400">LETALIDADE (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/20">
              {stats.map((s, i) => (
                <tr key={s.player.id} className={`${i < 3 ? 'bg-indigo-500/10' : ''} hover:bg-white/5 transition-colors`}>
                  <td className="px-3 py-4 font-mono font-bold text-gray-500">
                    <span className={i < 3 ? 'text-indigo-400 font-black' : ''}>{i + 1}º</span>
                  </td>
                  <td className={`px-3 py-4 font-black flex items-center gap-2 ${i < 3 ? 'text-white scale-105 origin-left' : 'text-gray-300'}`}>
                    {i === 0 && <span className="text-yellow-400">👑</span>}
                    <span className="truncate max-w-[120px] sm:max-w-none">{s.player.name}</span>
                    {s.wins === 0 && <span title="Sem vitórias no período">😢</span>}
                  </td>
                  <td className="px-3 py-4 text-center font-bold text-gray-400">{s.wins}</td>
                  <td className="px-3 py-4 text-center font-bold text-red-500/60">
                    {s.zeroWinsDays > 0 ? `${s.zeroWinsDays}d` : '-'}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`font-mono font-black ${i < 3 ? 'text-indigo-400' : 'text-gray-300'}`}>
                        {s.letalidade.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-gray-500 font-black">{s.winRate.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalhes Mensais */}
      {filter === 'Mensal' && filteredMatches.length > 0 && (
        <div className="mt-6 bg-gray-900/50 rounded-3xl p-5 border border-indigo-500/20">
          <h3 className="text-xs font-black text-indigo-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            Histórico de Resultados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from(new Set(filteredMatches.map(m => new Date(m.timestamp).toLocaleDateString()))).map(date => {
              const dayMatches = filteredMatches.filter(m => new Date(m.timestamp).toLocaleDateString() === date);
              return (
                <div key={date} className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/50 hover:border-indigo-500/40 transition-colors shadow-lg">
                  <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-3">
                    <span className="text-[11px] font-black text-gray-100">{date}</span>
                    <span className="text-[9px] bg-indigo-600/40 text-indigo-300 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                      {dayMatches.length} JOGOS
                    </span>
                  </div>
                  <div className="space-y-3">
                    {dayMatches.map(m => (
                      <div key={m.id} className="grid grid-cols-[1fr_auto_1fr] items-center text-[10px] gap-2">
                        <div className={`truncate font-bold ${m.winner === 'A' ? 'text-white' : 'text-gray-500'}`}>
                          {m.teamA.players.map(p => p.name).join(' & ')}
                        </div>
                        <div className="flex items-center gap-2 bg-gray-900/80 px-3 py-1 rounded-lg font-mono font-black shadow-inner">
                          <span className={m.winner === 'A' ? 'text-indigo-400' : 'text-gray-600'}>{m.teamA.score}</span>
                          <span className="text-gray-700">X</span>
                          <span className={m.winner === 'B' ? 'text-orange-400' : 'text-gray-600'}>{m.teamB.score}</span>
                        </div>
                        <div className={`truncate text-right font-bold ${m.winner === 'B' ? 'text-white' : 'text-gray-500'}`}>
                          {m.teamB.players.map(p => p.name).join(' & ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Seletor de Período do Relatório */}
      {showReportSelector && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setShowReportSelector(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-white text-center mb-2">Relatório PDF</h2>
            <p className="text-gray-400 text-center text-sm mb-8">Selecione o período desejado para o documento.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {(['Hoje', 'Semanal', 'Mensal', 'Anual'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setShowReportSelector(false);
                    setTimeout(() => window.print(), 500);
                  }}
                  className="bg-gray-700/50 hover:bg-indigo-600 border border-gray-600 hover:border-indigo-400 text-white p-6 rounded-[2rem] flex flex-col items-center gap-2 transition-all active:scale-95 group"
                >
                  <span className="text-lg font-black">{f.toUpperCase()}</span>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowReportSelector(false)}
              className="w-full mt-8 p-4 bg-gray-600/30 text-gray-400 rounded-2xl font-black hover:text-white transition-colors uppercase tracking-widest text-xs"
            >
              FECHAR
            </button>
          </div>
        </div>
      )}

      {/* Modais de Exportação */}
      {exportImageUrl && (isStoryMode ? (
        <StoryPreviewModal imageUrl={exportImageUrl} onClose={() => setExportImageUrl(null)} />
      ) : (
        <ExportPreviewModal imageUrl={exportImageUrl} title={`Ranking ${filter}`} onClose={() => setExportImageUrl(null)} />
      ))}
    </div>
  );
};

export default Ranking;
