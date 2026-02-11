
import React from 'react';
import { useState, useMemo } from 'react';
import { Match, Player, ArenaColor } from '../types';
import { FileDownIcon, Share2Icon, Trash2Icon } from '../components/icons';
import ExportPreviewModal from '../components/ExportPreviewModal';
import StoryPreviewModal from '../components/StoryPreviewModal';

type Filter = 'Hoje' | 'Semanal' | 'Mensal' | 'Anual' | 'Total';

interface RankingProps {
  players: Player[];
  matches: Match[];
  arenaName: string;
  arenaColor: string;
  filter: Filter;
  setFilter: (f: Filter) => void;
  viewDate: Date;
  setViewDate: (d: Date) => void;
  onClearMatches: (mode: 'all' | 'day', date?: Date) => Promise<void>;
}

interface PlayerStats {
  player: Player;
  wins: number;
  games: number;
  days: number;
  letalidade: number;
  winRate: number;
  zeroWinsDays: number;
  totalDuration: number;
}

const THEME_TEXT_CLASSES: Record<ArenaColor, string> = {
  indigo: 'text-indigo-400', blue: 'text-blue-400', emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400', violet: 'text-violet-400'
};
const THEME_BG_CLASSES: Record<ArenaColor, string> = {
  indigo: 'bg-indigo-600', blue: 'bg-blue-600', emerald: 'bg-emerald-600', amber: 'bg-amber-600', rose: 'bg-rose-600', violet: 'bg-violet-600'
};

const THEME_SVG_COLORS: Record<ArenaColor, { bgStart: string; bgEnd: string; primary: string; secondary: string; text: string; }> = {
  indigo: { bgStart: '#1e1b4b', bgEnd: '#030712', primary: '#818cf8', secondary: '#a5b4fc', text: '#ffffff' },
  blue: { bgStart: '#172554', bgEnd: '#030712', primary: '#60a5fa', secondary: '#93c5fd', text: '#ffffff' },
  emerald: { bgStart: '#064e3b', bgEnd: '#020617', primary: '#34d399', secondary: '#6ee7b7', text: '#ffffff' },
  amber: { bgStart: '#451a03', bgEnd: '#0c0a09', primary: '#f59e0b', secondary: '#fbbf24', text: '#ffffff' },
  rose: { bgStart: '#4c0519', bgEnd: '#1f2937', primary: '#f43f5e', secondary: '#fb7185', text: '#ffffff' },
  violet: { bgStart: '#2e1065', bgEnd: '#1e293b', primary: '#a78bfa', secondary: '#c4b5fd', text: '#ffffff' },
};

// Fix: Changed arenaColor parameter type to string and added validation to prevent type errors.
const generateStoryImage = (stats: PlayerStats[], arenaName: string, arenaColor: string, periodLabel: string, filter: Filter, viewDate: Date, logoDataUrl?: string): string => {
  const safeColor = (Object.keys(THEME_SVG_COLORS).includes(arenaColor) ? arenaColor : 'indigo') as ArenaColor;
  const theme = THEME_SVG_COLORS[safeColor];
  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  const escapeHtml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const podiumCardsSvg = () => {
    if (top3.length === 0) return '';

    const [p1, p2, p3] = top3;

    const p1Card = p1 ? `
            <g transform="translate(340, 620)">
                <rect x="0" y="0" width="400" height="380" rx="40" fill="rgba(255, 255, 255, 0.05)" stroke="${theme.primary}" stroke-width="4" />
                <text x="200" y="80" font-size="80" font-weight="900" fill="${theme.primary}" text-anchor="middle">1º</text>
                <text x="200" y="145" font-size="45" font-weight="700" fill="${theme.text}" text-anchor="middle" style="text-transform: uppercase;">${escapeHtml(p1.player.name)}</text>
                <text x="200" y="185" font-size="25" font-weight="500" fill="${theme.text}" opacity="0.6" text-anchor="middle" style="text-transform: uppercase;">Vitórias</text>
                <text x="200" y="265" font-size="90" font-weight="900" fill="${theme.text}" text-anchor="middle">${p1.wins}</text>
                <text x="200" y="315" font-size="25" font-weight="500" fill="${theme.text}" opacity="0.6" text-anchor="middle" style="text-transform: uppercase;">Letalidade</text>
                <text x="200" y="350" font-size="40" font-weight="700" fill="${theme.primary}" text-anchor="middle">${p1.winRate.toFixed(0)}%</text>
            </g>
        ` : '';

    const p2Card = p2 ? `
            <g transform="translate(10, 690)">
                <rect x="0" y="0" width="320" height="300" rx="40" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="2" />
                <text x="160" y="65" font-size="65" font-weight="900" fill="${theme.secondary}" text-anchor="middle">2º</text>
                <text x="160" y="120" font-size="38" font-weight="700" fill="${theme.text}" text-anchor="middle" style="text-transform: uppercase;">${escapeHtml(p2.player.name)}</text>
                <text x="160" y="160" font-size="20" font-weight="500" fill="${theme.text}" opacity="0.6" text-anchor="middle" style="text-transform: uppercase;">Vitórias</text>
                <text x="160" y="215" font-size="65" font-weight="900" fill="${theme.text}" text-anchor="middle">${p2.wins}</text>
                <text x="160" y="255" font-size="20" font-weight="500" fill="${theme.text}" opacity="0.6" text-anchor="middle" style="text-transform: uppercase;">Letalidade</text>
                <text x="160" y="285" font-size="30" font-weight="700" fill="${theme.secondary}" text-anchor="middle">${p2.winRate.toFixed(0)}%</text>
            </g>
        ` : '';

    const p3Card = p3 ? `
            <g transform="translate(750, 690)">
                <rect x="0" y="0" width="320" height="300" rx="40" fill="rgba(255, 255, 255, 0.05)" stroke="#f59e0b" stroke-width="2" />
                <text x="160" y="65" font-size="65" font-weight="900" fill="#fbbf24" text-anchor="middle">3º</text>
                <text x="160" y="120" font-size="38" font-weight="700" fill="${theme.text}" text-anchor="middle" style="text-transform: uppercase;">${escapeHtml(p3.player.name)}</text>
                <text x="160" y="160" font-size="20" font-weight="500" fill="${theme.text}" opacity="0.6" text-anchor="middle" style="text-transform: uppercase;">Vitórias</text>
                <text x="160" y="215" font-size="65" font-weight="900" fill="${theme.text}" text-anchor="middle">${p3.wins}</text>
                <text x="160" y="255" font-size="20" font-weight="500" fill="${theme.text}" opacity="0.6" text-anchor="middle" style="text-transform: uppercase;">Letalidade</text>
                <text x="160" y="285" font-size="30" font-weight="700" fill="#fbbf24" text-anchor="middle">${p3.winRate.toFixed(0)}%</text>
            </g>
        ` : '';

    return `${p2Card}${p3Card}${p1Card}`;
  };

  const listSvg = () => {
    if (rest.length === 0) return '';

    const header = `
            <g transform="translate(90, 1120)" font-size="30" font-weight="700" fill="${theme.text}" opacity="0.5" style="text-transform: uppercase; letter-spacing: 0.1em;">
                <text x="0" y="0" text-anchor="start">Atleta</text>
                <text x="480" y="0" text-anchor="middle">Vit</text>
                <text x="630" y="0" text-anchor="middle">S.P.</text>
                <text x="900" y="0" text-anchor="end">Letalidade</text>
            </g>
            <line x1="90" y1="1145" x2="990" y2="1145" stroke="${theme.text}" stroke-width="1" opacity="0.1" />
        `;

    const rows = rest.slice(0, 10).map((s, i) => {
      const yBase = 1200 + i * 70;
      return `
                <g transform="translate(90, ${yBase})" font-size="35" font-weight="700" fill="${theme.text}">
                    <text x="0" y="12" text-anchor="start">
                        <tspan font-weight="900" fill="${theme.secondary}">${i + 4}º</tspan>
                        <tspan dx="15">${escapeHtml(s.player.name)}</tspan>
                    </text>
                    <text x="480" y="12" text-anchor="middle">${s.wins}</text>
                    <text x="630" y="12" text-anchor="middle">${s.zeroWinsDays > 0 ? `${s.zeroWinsDays}d` : '-'}</text>
                    <text x="900" y="12" text-anchor="end" font-size="30">
                        <tspan>${s.letalidade.toFixed(0)}</tspan>
                        <tspan font-weight="900" fill="${theme.secondary}" dx="5">(${s.winRate.toFixed(0)}%)</tspan>
                    </text>
                </g>
            `;
    }).join('');

    return header + rows;
  };

  const weekday = viewDate.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
  const arenaNameRaw = arenaName || '';
  const arenaNameUpper = arenaNameRaw.toUpperCase().trim();

  // Ensure it starts with "ARENA"
  const formattedArenaName = arenaNameUpper.startsWith('ARENA')
    ? arenaNameRaw
    : `Arena ${arenaNameRaw}`;

  const headerTop = escapeHtml(formattedArenaName);
  const headerTitle = filter === 'Hoje' ? "RANKING DO DIA" :
    filter === 'Semanal' ? "RANKING DA SEMANA" :
      filter === 'Mensal' ? "RANKING DO MÊS" :
        filter === 'Anual' ? "RANKING DO ANO" : "RANKING GERAL";
  const headerSubtitle = periodLabel;

  const logoSvg = logoDataUrl ? `
    <image xlink:href="${logoDataUrl}" x="340" y="60" width="400" height="200" preserveAspectRatio="xMidYMid meet" />
  ` : '';

  const svgString = `
        <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <defs>
                <linearGradient id="bgGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stop-color="${theme.bgStart}" />
                    <stop offset="100%" stop-color="${theme.bgEnd}" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bgGradient)" />

            ${logoSvg}

            <g transform="translate(540, 320)" text-anchor="middle">
                <text y="-30" font-size="40" font-weight="700" fill="${theme.text}" opacity="0.6" style="text-transform: uppercase;">${headerTop}</text>
                <text y="70" font-size="90" font-weight="900" fill="${theme.text}" letter-spacing="-3" style="text-transform: uppercase;">${headerTitle}</text>
                <text y="200" font-size="60" font-weight="700" fill="${theme.text}" opacity="0.8">${escapeHtml(headerSubtitle)}</text>
                ${filter === 'Hoje' ? `<text y="280" font-size="40" font-weight="700" fill="${theme.text}" opacity="0.6" style="text-transform: uppercase;">${weekday}</text>` : ''}
            </g>

            ${podiumCardsSvg()}
            ${listSvg()}

            <text x="540" y="1880" font-size="22" font-weight="600" fill="${theme.text}" opacity="0.3" text-anchor="middle" style="text-transform: uppercase; letter-spacing: 0.05em;">
                O placar foi auditado pelo App Placar Elite Pro
            </text>
        </svg>
    `;

  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  return 'data:image/svg+xml;base64,' + base64;
}

const convertSvgToJpeg = (svgDataUrl: string, width: number, height: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // JPEG requires a solid background as it doesn't support transparency
      // We fill with black (or the theme's bg start color if we wanted to be precise, 
      // but the SVG rect already covers the whole area with a gradient).
      ctx.fillStyle = '#030712'; // Base dark color
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);
      try {
        const jpegUrl = canvas.toDataURL('image/jpeg', 0.9); // 90% quality
        resolve(jpegUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = svgDataUrl;
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 1) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) {
    return `${h}h ${m} m`;
  }
  return `${m} m`;
};

const Ranking: React.FC<RankingProps> = ({ players, matches, arenaName, arenaColor, filter, setFilter, viewDate, setViewDate, onClearMatches }) => {
  // State lifted to App.tsx for persistence
  const [exportImageUrl, setExportImageUrl] = useState<string | null>(null);
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleClearConfirmed = async (mode: 'all' | 'day') => {
    await onClearMatches(mode, mode === 'day' ? viewDate : undefined);
    setShowClearModal(false);
  };

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

  const stats: PlayerStats[] = useMemo(() => {
    const playerDailyStats = new Map<string, Map<string, { wins: number, games: number, duration: number }>>();

    filteredMatches.forEach(match => {
      const winningTeam = match.winner === 'A' ? match.teamA : match.teamB;
      const dateKey = new Date(match.timestamp).toDateString();

      [match.teamA, match.teamB].forEach(team => {
        team.players.forEach(p => {
          if (!playerDailyStats.has(p.id)) playerDailyStats.set(p.id, new Map());
          const daily = playerDailyStats.get(p.id)!;
          if (!daily.has(dateKey)) daily.set(dateKey, { wins: 0, games: 0, duration: 0 });
          const dStats = daily.get(dateKey)!;
          dStats.games += 1;
          dStats.duration += match.duration || 0;
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
      let totalDuration = 0;
      const days = dailyMap.size;

      dailyMap.forEach(d => {
        totalWins += d.wins;
        totalGames += d.games;
        totalDuration += d.duration;
        if (d.wins === 0) zeroWinsDays += 1;
      });

      const letalidade = totalWins / (days || 1);
      const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      return { player, wins: totalWins, games: totalGames, days, letalidade, winRate, zeroWinsDays, totalDuration };
    })
      .filter((s): s is NonNullable<typeof s> => s !== null && s.days > 0)
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  }, [filteredMatches, players]);

  const navigateDate = (amount: number) => {
    const newDate = new Date(viewDate);
    if (filter === 'Mensal') newDate.setMonth(viewDate.getMonth() + amount);
    else if (filter === 'Anual') newDate.setFullYear(viewDate.getFullYear() + amount);
    else newDate.setDate(viewDate.getDate() + amount);
    setViewDate(newDate);
  };

  const currentPeriodLabel = useMemo(() => {
    if (filter === 'Hoje') return viewDate.toLocaleDateString('pt-BR');
    if (filter === 'Semanal') {
      const startOfWeek = new Date(viewDate);
      startOfWeek.setDate(viewDate.getDate() - viewDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')} `;
    }
    if (filter === 'Mensal') return viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (filter === 'Anual') return viewDate.getFullYear().toString();
    return filter;
  }, [filter, viewDate]);

  const handleExport = () => {
    setShowReportSelector(false);
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert("Pop-up bloqueado. Libere para gerar o relatório.");
      return;
    }
    const reportTitle = `Ranking - ${arenaName || 'Arena'} `;
    const periodLabel = `${filter}: ${currentPeriodLabel} `;

    const htmlContent = `
  < !DOCTYPE html >
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
          <title>${reportTitle}</title>
          <style>
            body {font - family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 1.5rem; background: white; color: #111827; font-size: 10pt; line-height: 1.5; }
            .report-container {max - width: 800px; margin: auto; }
            h1 {font - size: 1.5rem; font-weight: 700; text-transform: uppercase; color: #111827; margin: 0; }
            h2 {font - size: 0.9rem; font-weight: 500; color: #6b7280; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; text-transform: capitalize; }
            table {width: 100%; border-collapse: collapse; }
            th {text - align: left; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #111827; padding: 0.5rem 0.75rem; }
            td {padding: 0.75rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; font-size: 0.9rem; }
            .rank-col {font - weight: 700; color: #111827; width: 40px; }
            .player-col {font - weight: 600; }
            .stat-col {text - align: center; font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
            tr:last-child td {border - bottom: none; }
            @media print {
              body {padding: 0; }
            .report-container {box - shadow: none; border: none; margin: 0; max-width: 100%; }
            }
          </style>
      </head>
      <body>
        <div class="report-container">
          <h1>${reportTitle}</h1>
          <h2>${periodLabel}</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Atleta</th>
                <th style="text-align: center;">Vitórias</th>
                <th style="text-align: center;">Jogos</th>
                <th style="text-align: center;">Aproveitamento (%)</th>
                <th style="text-align: center;">Dias em Quadra</th>
                <th style="text-align: center;">Letalidade (V/D)</th>
                <th style="text-align: center;">Sem Pontuar (Dias)</th>
              </tr>
            </thead>
            <tbody>
              ${stats.map((s, i) => `
                        <tr>
                            <td class="rank-col">${i + 1}º</td>
                            <td class="player-col">${s.player.name}</td>
                            <td class="stat-col">${s.wins}</td>
                            <td class="stat-col">${s.games}</td>
                            <td class="stat-col">${s.winRate.toFixed(0)}%</td>
                            <td class="stat-col">${s.days}</td>
                            <td class="stat-col">${s.letalidade.toFixed(2)}</td>
                            <td class="stat-col">${s.zeroWinsDays > 0 ? `${s.zeroWinsDays}` : '-'}</td>
                        </tr>
                    `).join('')}
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

  const handleExportStory = async () => {
    if (stats.length === 0) {
      alert("Não há dados de ranking para gerar um story.");
      return;
    }
    try {
      // Fetch logo and convert to Data URL for embedding
      let logoDataUrl = '';
      try {
        const logoResponse = await fetch('/logo.png');
        const logoBlob = await logoResponse.blob();
        logoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
      } catch (e) {
        console.warn("Logo not found for story export, proceeding without it.");
      }

      const svgUrl = generateStoryImage(stats, arenaName || 'Arena', arenaColor, currentPeriodLabel, filter, viewDate, logoDataUrl);
      // Converter SVG para JPEG (1080x1920 é o padrão do story gerado)
      const jpegUrl = await convertSvgToJpeg(svgUrl, 1080, 1920);
      setExportImageUrl(jpegUrl);
      setIsStoryMode(true);
    } catch (error) {
      console.error("Erro ao gerar imagem do story:", error);
      alert("Erro ao gerar imagem para o telefone. Tente novamente.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-3 print:hidden">
        <div className="flex bg-gray-800/90 backdrop-blur rounded-2xl p-1.5 shadow-2xl w-full max-w-xl md:max-w-3xl border border-gray-700/50">
          {(['Hoje', 'Semanal', 'Mensal', 'Anual', 'Total'] as Filter[]).map(f => (
            <button
              key={f} onClick={() => { setFilter(f); setViewDate(new Date()); }}
              className={`flex-1 py-2 md:py-3 text-[10px] md:text-sm font-black rounded-xl transition-all ${filter === f ? `${THEME_BG_CLASSES[arenaColor]} text-white shadow-lg` : 'text-gray-500 hover:text-white'}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {filter !== 'Total' && (
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8 bg-gray-800/40 px-2 sm:px-4 md:px-8 py-2 md:py-4 rounded-full border border-gray-700/30">
            <button onClick={() => navigateDate(-1)} className={`${THEME_TEXT_CLASSES[arenaColor]} hover:text-white p-2 text-xl md:text-4xl active:scale-90 transition-transform`}>◀</button>
            <span className="text-lg sm:text-2xl md:text-4xl font-black text-gray-200 capitalize w-48 sm:w-64 md:w-96 text-center tracking-tighter">{currentPeriodLabel}</span>
            <button onClick={() => navigateDate(1)} className={`${THEME_TEXT_CLASSES[arenaColor]} hover:text-white p-2 text-xl md:text-4xl active:scale-90 transition-transform`}>▶</button>
          </div>
        )}

        <div className="flex gap-3 md:gap-6">
          <button onClick={() => setShowClearModal(true)} className="p-2.5 md:p-4 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600/30 transition-colors shadow-lg border border-red-500/20 active:scale-95">
            <Trash2Icon className="w-4 h-4 md:w-6 md:h-6" />
          </button>
          <button onClick={handleExportStory} className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 md:px-8 py-2.5 md:py-4 bg-gradient-to-br from-${arenaColor}-600 to-indigo-700 text-white rounded-xl text-[10px] md:text-sm font-black shadow-xl hover:scale-105 transition-transform active:scale-95 uppercase`}>
            <Share2Icon className="w-4 h-4 md:w-6 md:h-6" /> Exportar Story
          </button>
          <button onClick={() => setShowReportSelector(true)} className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 md:px-8 py-2.5 md:py-4 bg-gray-700 text-white rounded-xl text-[10px] md:text-sm font-black shadow-xl hover:bg-gray-600 transition-colors uppercase">
            <FileDownIcon className="w-4 h-4 md:w-6 md:h-6" /> Relatório PDF
          </button>
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="mt-4 md:mt-8 print:mt-0">
          <div className="bg-gray-800/40 rounded-3xl md:rounded-[2.5rem] p-3 md:p-6 border border-gray-700/50 shadow-inner print:border-none print:shadow-none print:p-0 print:bg-transparent">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm print-table">
                <thead className="text-gray-500 font-black uppercase tracking-widest border-b border-gray-700/50 print:text-black print:border-black">
                  <tr>
                    <th className="px-3 md:px-6 py-4 md:py-6 print-th">#</th>
                    <th className="px-3 md:px-6 py-4 md:py-6 print-th">ATLETA</th>
                    <th className="px-3 md:px-6 py-4 md:py-6 text-center print-th">VITÓRIAS</th>
                    <th className="px-3 md:px-6 py-4 md:py-6 text-center print-th">JOGOS</th>
                    <th className="px-3 md:px-6 py-4 md:py-6 text-center print-th">TEMPO EM QUADRA</th>
                    <th className="px-3 md:px-6 py-4 md:py-6 text-center print-th">MÉDIA / JOGO</th>
                    <th className={`px-3 md:px-6 py-4 md:py-6 text-center print:text-black md:text-base ${THEME_TEXT_CLASSES[arenaColor as ArenaColor]}`}>LETALIDADE (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/20 print:divide-none">
                  {stats.map((s, i) => (
                    <tr key={s.player.id} className="hover:bg-white/5 transition-colors print:bg-transparent print-tr">
                      <td className="px-3 md:px-6 py-4 md:py-6 font-mono font-bold text-gray-500 print:text-black md:text-base print-td">{i + 1}º</td>
                      <td className="px-3 md:px-6 py-4 md:py-6 font-black text-gray-300 print:text-black print:font-bold md:text-base print-td">{s.player.name}</td>
                      <td className="px-3 md:px-6 py-4 md:py-6 text-center font-bold text-gray-400 print:text-black md:text-base print-td">{s.wins}</td>
                      <td className="px-3 md:px-6 py-4 md:py-6 text-center font-bold text-gray-400 print:text-black md:text-base print-td">{s.games}</td>
                      <td className="px-3 md:px-6 py-4 md:py-6 text-center font-bold text-gray-400 print:text-black md:text-base print-td">{formatDuration(s.totalDuration)}</td>
                      <td className="px-3 md:px-6 py-4 md:py-6 text-center font-bold text-gray-400 print:text-black md:text-base print-td">{s.games > 0 ? (s.totalDuration / s.games).toFixed(0) : '0'} min</td>
                      <td className={`px-3 md:px-6 py-4 md:py-6 text-center font-mono font-black ${THEME_TEXT_CLASSES[arenaColor as ArenaColor]} print:text-black md:text-lg print-td`}>
                        {s.winRate.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center gap-4 bg-gray-800/20 rounded-[3rem] border border-dashed border-gray-700/30 print:hidden">
          <span className="text-gray-600 italic uppercase tracking-widest text-[9px]">Nenhum dado registrado para o período {filter}.</span>
        </div>
      )}

      {showClearModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 print:hidden" onClick={() => setShowClearModal(false)}>
          <div className="bg-gray-900 border border-red-500/20 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter text-center">Limpar Ranking?</h2>
            <p className="text-gray-500 mb-8 text-center text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              Você deseja apagar as partidas da Arena <span className="text-indigo-400">{arenaName}</span>? Isso resetará as estatísticas.
            </p>

            <div className="flex flex-col gap-3">
              {filter !== 'Total' && (
                <button
                  onClick={() => handleClearConfirmed('day')}
                  className="w-full p-4 bg-gray-800 text-white border border-gray-700 rounded-2xl font-black uppercase text-[10px] flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span>Apagar dia visualizado</span>
                  <span className="text-indigo-400 opacity-70">{viewDate.toLocaleDateString('pt-BR')}</span>
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
                <span className="text-lg sm:text-xl font-black tracking-tighter uppercase">Gerar e Imprimir</span>
                <span className="text-[10px] font-bold opacity-70">ABRIR JANELA DE IMPRESSÃO</span>
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
        <StoryPreviewModal imageUrl={exportImageUrl} onClose={() => { setExportImageUrl(null); setIsStoryMode(false); }} />
      ) : (
        <ExportPreviewModal imageUrl={exportImageUrl} title={`Ranking ${filter} `} onClose={() => { setExportImageUrl(null); setIsStoryMode(false); }} />
      ))}
    </div>
  );
};

export default Ranking;
