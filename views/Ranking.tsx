
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

const getRankingTitle = (filter: Filter) => {
    switch (filter) {
        case 'Hoje': return `Ranking do Dia`;
        case 'Semanal': return 'Ranking Semanal';
        case 'Mensal': return 'Ranking Mensal';
        case 'Anual': return 'Ranking Anual';
        case 'Total': return 'Ranking Geral';
        default: return 'Ranking';
    }
}

const getReportTitleFragment = (filter: Filter) => {
    switch (filter) {
        case 'Hoje': return `do Dia`;
        case 'Semanal': return 'Semanal';
        case 'Mensal': return 'Mensal';
        case 'Anual': return 'Anual';
        case 'Total': return 'Geral';
        default: return '';
    }
}

const generateReportSVG = (individualRanking: any[], partnershipRanking: any[], filter: Filter) => {
  const reportTitle = `Relatório ${getReportTitleFragment(filter)} - Placar Elite Pro`;
  const date = new Date().toLocaleDateString('pt-BR');
  const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const renderIndividualRows = () => {
    if (!individualRanking || individualRanking.length === 0) {
      return `<text x="400" y="320" font-size="16" fill="#666" text-anchor="middle">Nenhum dado para o período.</text>`;
    }
    return individualRanking.map((p, i) => {
      const y = 300 + i * 35;
      return `
        <g class="td">
          <text x="70" y="${y}" text-anchor="middle">${i + 1}</text>
          <text x="120" y="${y}">${p.player.name}</text>
          <text x="495" y="${y}" text-anchor="middle">${p.wins}</text>
          <text x="595" y="${y}" text-anchor="middle">${p.games}</text>
          <text x="695" y="${y}" text-anchor="middle">${p.efficiency.toFixed(0)}%</text>
        </g>
        <line x1="50" y1="${y + 10}" x2="750" y2="${y + 10}" stroke="#eee" />
      `;
    }).join('');
  };
  
  const partnershipStartY = 300 + (Math.max(1, individualRanking.length) * 35) + 50;

  const renderPartnershipRows = () => {
    if (!partnershipRanking || partnershipRanking.length === 0) {
      return `<text x="400" y="${partnershipStartY + 60}" font-size="16" fill="#666" text-anchor="middle">Nenhum dado para o período.</text>`;
    }
    return partnershipRanking.map((p, i) => {
      const y = partnershipStartY + 40 + i * 35;
      const playerNames = p.players.map((pl: Player) => pl.name).join(' & ');
      const displayName = playerNames.length > 25 ? `${playerNames.substring(0, 22)}...` : playerNames;
      return `
        <g class="td">
          <text x="70" y="${y}" text-anchor="middle">${i + 1}</text>
          <text x="120" y="${y}">${displayName}</text>
          <text x="495" y="${y}" text-anchor="middle">${p.wins}</text>
          <text x="595" y="${y}" text-anchor="middle">${p.games}</text>
          <text x="695" y="${y}" text-anchor="middle">${p.efficiency.toFixed(1)}%</text>
        </g>
        <line x1="50" y1="${y + 10}" x2="750" y2="${y + 10}" stroke="#eee" />
      `;
    }).join('');
  };

  const finalHeight = partnershipStartY + 40 + (Math.max(1, partnershipRanking.length) * 35) + 100;

  return `
    <svg width="800" height="${finalHeight}" viewBox="0 0 800 ${finalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family: ${FONT_FAMILY};">
      <style>
        .title { font-size: 32px; fill: #2563eb; text-anchor: middle; font-weight: bold; }
        .date { font-size: 24px; fill: #2563eb; text-anchor: middle; }
        .subtitle { font-size: 28px; fill: #2563eb; text-anchor: middle; font-weight: 500; }
        .th { font-size: 16px; fill: #666; font-weight: 500; }
        .td { font-size: 16px; fill: #111; }
      </style>
      <rect width="100%" height="100%" fill="white" />
      
      <text x="400" y="80" class="title">${reportTitle}</text>
      <text x="400" y="120" class="date">${date}</text>
      
      <text x="400" y="220" class="subtitle">Ranking Individual</text>
      <g class="th">
          <text x="70" y="265" text-anchor="middle">#</text>
          <text x="120" y="265">Nome</text>
          <text x="495" y="265" text-anchor="middle">V</text>
          <text x="595" y="265" text-anchor="middle">J</text>
          <text x="695" y="265" text-anchor="middle">%</text>
      </g>
      <line x1="50" y1="245" x2="750" y2="245" stroke="#ccc" />
      <line x1="50" y1="275" x2="750" y2="275" stroke="#ccc" />
      ${renderIndividualRows()}
      
      <text x="400" y="${partnershipStartY}" class="subtitle">Ranking de Duplas</text>
      <g class="th">
          <text x="70" y="${partnershipStartY + 40}" text-anchor="middle">#</text>
          <text x="120" y="${partnershipStartY + 40}">Dupla</text>
          <text x="495" y="${partnershipStartY + 40}" text-anchor="middle">V</text>
          <text x="595" y="${partnershipStartY + 40}" text-anchor="middle">J</text>
          <text x="695" y="${partnershipStartY + 40}" text-anchor="middle">% Efic.</text>
      </g>
      <line x1="50" y1="${partnershipStartY + 20}" x2="750" y2="${partnershipStartY + 20}" stroke="#ccc" />
      <line x1="50" y1="${partnershipStartY + 50}" x2="750" y2="${partnershipStartY + 50}" stroke="#ccc" />
      ${renderPartnershipRows()}

      <text x="400" y="${finalHeight - 50}" font-size="16" fill="#888" text-anchor="middle">Compartilhar Relatório</text>
    </svg>
  `;
}

const generateStorySVG = (individualRanking: any[], filter: Filter) => {
  const players = individualRanking;
  const playerCount = players.length;

  const getTitle = () => {
    switch(filter) {
        case 'Hoje': return 'RANKING DO DIA';
        case 'Semanal': return 'RANKING SEMANAL';
        case 'Mensal': return 'RANKING MENSAL';
        case 'Anual': return 'RANKING ANUAL';
        case 'Total': return 'RANKING GERAL';
    }
  }

  const minWins = playerCount > 1 ? players[players.length - 1].wins : -1;

  const header = `
    <g transform="translate(540, 165)">
        <g transform="translate(-315, 0)">
            <g transform="translate(0, -42) scale(3.5)">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            <text text-anchor="start" dominant-baseline="middle" x="100" y="0" font-family="sans-serif" font-size="70" fill="white" font-weight="bold">Placar Elite Pro</text>
        </g>
    </g>
    <text x="540" y="400" font-family="sans-serif" font-size="100" fill="#facc15" text-anchor="middle" font-weight="bold">${getTitle()}</text>
    <text x="540" y="480" font-family="sans-serif" font-size="50" fill="white" text-anchor="middle">${new Date().toLocaleDateString('pt-BR')}</text>
  `;

  const headerHeight = 520;
  const footerHeight = 100;
  const contentHeight = 1920 - headerHeight - footerHeight;
  const contentStartY = headerHeight;

  let playerLines = '';

  if (playerCount > 0) {
      const rowHeight = contentHeight / playerCount;
      const cardPaddingY = Math.min(20, rowHeight * 0.1);
      const cardHeight = rowHeight - (cardPaddingY * 2);

      const scaleFactor = Math.sqrt(Math.min(1, 7 / playerCount));
      const mainFontSize = Math.max(20, 55 * scaleFactor);
      const subFontSize = Math.max(16, 40 * scaleFactor);
      
      const cardFills = ['url(#gold)', 'url(#silver)', 'url(#bronze)'];
      const strokeColors = ['#FBBF24', '#D1D5DB', '#D97706'];

      playerLines = players.map((p, i) => {
          const cardY = contentStartY + (i * rowHeight) + cardPaddingY;
          const textY = cardY + cardHeight / 2;
          const textCenterX = 540;
          const fill = i < 3 ? cardFills[i] : 'rgba(255,255,255,0.05)';
          const stroke = i < 3 ? `stroke="${strokeColors[i]}" stroke-width="2"` : '';

          let rankDisplay;
          if (i < 3) {
            const medals = ['🥇', '🥈', '🥉'];
            rankDisplay = `<text x="120" y="${textY + mainFontSize * 0.35}" font-size="${mainFontSize * 1.5}" text-anchor="middle">${medals[i]}</text>`;
          } else {
            rankDisplay = `<text x="120" y="${textY + mainFontSize * 0.35}" font-size="${mainFontSize * 0.9}" fill="#cbd5e1" text-anchor="middle" font-weight="bold">${i + 1}.</text>`;
          }

          const isLoser = playerCount > 1 && p.wins === minWins;
          const nameWithEmoji = isLoser ? `${p.player.name} 😥` : p.player.name;

          return `
            <rect x="40" y="${cardY}" width="1000" height="${cardHeight}" rx="25" fill="${fill}" ${stroke} />
            ${rankDisplay}
            <text x="${textCenterX}" y="${textY}" dy="-${mainFontSize * 0.3}" font-family="sans-serif" font-size="${mainFontSize}" fill="#f3f4f6" text-anchor="middle" font-weight="bold">${nameWithEmoji}</text>
            <text x="${textCenterX}" y="${textY}" dy="${mainFontSize * 0.9}" font-family="sans-serif" font-size="${subFontSize}" fill="#a5b4fc" text-anchor="middle">${p.wins}V / ${p.games}J (${p.efficiency.toFixed(0)}%)</text>
          `;
      }).join('');
  } else {
     playerLines = `<text x="540" y="960" font-size="80" fill="#9ca3af" text-anchor="middle">Nenhum dado para o período.</text>`;
  }

  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1e3a8a;" /><stop offset="100%" style="stop-color:#111827;" /></linearGradient>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:rgba(17, 24, 39, 0.8);" /><stop offset="100%" style="stop-color:rgba(17, 24, 39, 0);" /></linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FDE047" stop-opacity="0.3"/><stop offset="100%" stop-color="#FDE047" stop-opacity="0.05"/></linearGradient>
        <linearGradient id="silver" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#E5E7EB" stop-opacity="0.3"/><stop offset="100%" stop-color="#E5E7EB" stop-opacity="0.05"/></linearGradient>
        <linearGradient id="bronze" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#F97316" stop-opacity="0.3"/><stop offset="100%" stop-color="#F97316" stop-opacity="0.05"/></linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      ${header}
      ${playerLines}
      <text x="540" y="1850" font-size="40" fill="#9ca3af" text-anchor="middle">Gerado por Placar Elite Pro</text>
    </svg>
  `;
};


const Ranking: React.FC<RankingProps> = ({ matches, players }) => {
  const [filter, setFilter] = useState<Filter>('Hoje');
  const [storyImageUrl, setStoryImageUrl] = useState<string | null>(null);

  const filteredMatches = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return matches.filter(match => {
      const matchDate = new Date(match.timestamp);
      switch (filter) {
        case 'Hoje': return matchDate >= startOfToday;
        case 'Semanal': {
          const lastWeek = new Date(startOfToday);
          lastWeek.setDate(startOfToday.getDate() - 7);
          return matchDate >= lastWeek;
        }
        case 'Mensal': {
          const lastMonth = new Date(startOfToday);
          lastMonth.setMonth(startOfToday.getMonth() - 1);
          return matchDate >= lastMonth;
        }
        case 'Anual': {
            const lastYear = new Date(startOfToday);
            lastYear.setFullYear(startOfToday.getFullYear() - 1);
            return matchDate >= lastYear;
        }
        case 'Total': return true;
        default: return true;
      }
    });
  }, [matches, filter]);

  const calculateRankings = (filteredMatches: Match[], players: Player[]) => {
      const individualStats = new Map<string, { wins: number, games: number, totalDuration: number, activeDays: Set<string> }>();
      players.forEach(p => individualStats.set(p.id, { wins: 0, games: 0, totalDuration: 0, activeDays: new Set() }));

      filteredMatches.forEach(match => {
        const allMatchPlayers = [...match.teamA.players, ...match.teamB.players];
        const winningTeam = match.winner === 'A' ? match.teamA : match.teamB;
        allMatchPlayers.forEach(p => {
          const pStats = individualStats.get(p.id);
          if (pStats) {
            pStats.games += 1;
            pStats.totalDuration += match.duration;
            pStats.activeDays.add(match.timestamp.toDateString());
            if (winningTeam.players.some(wp => wp.id === p.id)) pStats.wins += 1;
          }
        });
      });
      
      const individualRanking = Array.from(individualStats.entries())
        .map(([id, data]) => ({ player: players.find(p => p.id === id)!, ...data, efficiency: data.games > 0 ? (data.wins / data.games) * 100 : 0, avgTime: data.games > 0 ? data.totalDuration / data.games : 0}))
        .filter(s => s.games > 0).sort((a, b) => b.wins - a.wins || b.efficiency - a.efficiency);

      const partnershipStats = new Map<string, { players: Player[], wins: number, games: number }>();
      filteredMatches.forEach(match => {
          [match.teamA, match.teamB].forEach(team => {
              if (team.players.length !== 2) return;
              const [p1, p2] = team.players.sort((a,b) => a.id.localeCompare(b.id));
              const key = `${p1.id}-${p2.id}`;
              if (!partnershipStats.has(key)) partnershipStats.set(key, { players: [p1, p2], wins: 0, games: 0 });
              const pairStats = partnershipStats.get(key)!;
              pairStats.games += 1;
              const winningTeam = match.winner === 'A' ? match.teamA : match.teamB;
              if (winningTeam.players.some(p => p.id === p1.id) && winningTeam.players.some(p => p.id === p2.id)) pairStats.wins += 1;
          });
      });
      
      const partnershipRanking = Array.from(partnershipStats.values())
          .map(data => ({ ...data, efficiency: data.games > 0 ? (data.wins / data.games) * 100 : 0 }))
          .sort((a, b) => b.wins - a.wins || b.efficiency - a.efficiency).slice(0, 10);

      return { individualRanking, partnershipRanking };
  }

  const { individualRanking, partnershipRanking } = useMemo(() => calculateRankings(filteredMatches, players), [filteredMatches, players]);
  
  const handleExport = () => {
    const svgString = generateReportSVG(individualRanking, partnershipRanking, filter);
    const title = getRankingTitle(filter);

    const reportHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { 
              margin: 0; 
              padding: 1rem;
              background-color: #f3f4f6; 
              display: flex; 
              justify-content: center; 
              align-items: flex-start;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            .report-container {
              background-color: white;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
              border-radius: 0.5rem;
              padding: 1rem;
              max-width: 800px;
              width: 100%;
            }
            @media print {
              body {
                background-color: white;
                padding: 0;
              }
              .report-container {
                box-shadow: none;
                border-radius: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            ${svgString}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      alert('Não foi possível abrir o relatório. Por favor, desative o bloqueador de pop-ups.');
    }
  };

  const handleGenerateStory = () => {
    const svgString = generateStorySVG(individualRanking, filter);
    const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 1080, 1920);
      
      const pngUrl = canvas.toDataURL('image/png');
      setStoryImageUrl(pngUrl);
    };
    img.onerror = () => {
      console.error("Erro ao carregar a imagem SVG para o canvas.");
    };
    img.src = svgDataUrl;
  };

  return (
    <>
      <div className="w-full p-4 flex flex-col">
        <h1 className="text-2xl font-bold text-center text-gray-100 mb-3">Ranking Elite Pro</h1>
        
        <div className="flex justify-center items-center gap-1 sm:gap-2 mb-3 bg-gray-800 p-1 rounded-xl max-w-lg mx-auto">
          {(['Hoje', 'Semanal', 'Mensal', 'Anual', 'Total'] as Filter[]).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${filter === f ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="flex justify-center items-center gap-4 mb-4">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-transform active:scale-95"><FileDownIcon /> Ranking</button>
          <button onClick={handleGenerateStory} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition-transform active:scale-95"><Share2Icon /> Story</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-2xl p-4">
            <h2 className="text-xl font-semibold text-cyan-400 mb-3">Ranking Individual</h2>
            <div className="overflow-y-auto max-h-[50vh]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 bg-gray-800">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Nome</th>
                    <th className="p-2">V</th>
                    <th className="p-2">J</th>
                    <th className="p-2">%</th>
                    <th className="p-2 hidden sm:table-cell">Dias</th>
                    <th className="p-2 hidden sm:table-cell">Tempo médio em quadra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {individualRanking.map((p, i) => (
                    <tr key={p.player.id} className="hover:bg-gray-700/50">
                      <td className="p-2 font-mono">{i + 1}</td>
                      <td className="p-2 font-semibold">{p.player.name}</td>
                      <td className="p-2">{p.wins}</td>
                      <td className="p-2">{p.games}</td>
                      <td className="p-2 text-green-400">{`${p.efficiency.toFixed(0)}%`}</td>
                      <td className="p-2 hidden sm:table-cell">{p.activeDays.size}</td>
                      <td className="p-2 hidden sm:table-cell">{`${p.avgTime.toFixed(0)}m`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-2xl p-4">
            <h2 className="text-xl font-semibold text-cyan-400 mb-3">Ranking de Duplas</h2>
            <div className="overflow-y-auto max-h-[50vh]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 bg-gray-800">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Dupla</th>
                    <th className="p-2">V</th>
                    <th className="p-2">J</th>
                    <th className="p-2">% Efic.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {partnershipRanking.map((pair, i) => (
                    <tr key={pair.players.map(p=>p.id).join('-')} className="hover:bg-gray-700/50">
                      <td className="p-2 font-mono">{i + 1}</td>
                      <td className="p-2 font-semibold">{pair.players.map(p => p.name).join(' & ')}</td>
                      <td className="p-2">{pair.wins}</td>
                      <td className="p-2">{pair.games}</td>
                      <td className="p-2 text-green-400">{`${pair.efficiency.toFixed(1)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {storyImageUrl && (
        <StoryPreviewModal 
          imageUrl={storyImageUrl}
          onClose={() => setStoryImageUrl(null)}
        />
      )}
    </>
  );
};

export default Ranking;
