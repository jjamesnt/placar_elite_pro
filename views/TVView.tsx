import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TrophyIcon, ClockIcon } from '../components/icons';
import VictoryModal from '../components/VictoryModal';
import VaiATresModal from '../components/VaiATresModal';

interface TVViewProps {
  arenaId: string;
}

const TVView: React.FC<TVViewProps> = ({ arenaId }) => {
  const [tvData, setTvData] = useState<any>(null);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [customArenaName, setCustomArenaName] = useState<string>('');
  const [tvAttackTime, setTvAttackTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [arenaColor, setArenaColor] = useState<string>('indigo');
  
  const lockedSenderId = useRef<string | null>(null);
  const lastSenderTime = useRef<number>(0);
  const fingerprintRef = useRef<string>(""); // James: Identidade única do último pacote sólido recebido

  const arenaTheme = useMemo(() => {
    const themes: Record<string, any> = {
      indigo: { primary: '#818cf8', bg: '#1e1b4b', border: 'rgba(129, 140, 248, 0.4)', pulse: '#6366f1', gradient: 'rgba(99, 102, 241, 0.1)' },
      blue: { primary: '#60a5fa', bg: '#172554', border: 'rgba(96, 165, 250, 0.4)', pulse: '#3b82f6', gradient: 'rgba(59, 130, 246, 0.1)' },
      emerald: { primary: '#34d399', bg: '#064e3b', border: 'rgba(52, 211, 153, 0.4)', pulse: '#10b981', gradient: 'rgba(16, 185, 129, 0.1)' },
      amber: { primary: '#fbbf24', bg: '#451a03', border: 'rgba(251, 191, 36, 0.4)', pulse: '#f59e0b', gradient: 'rgba(245, 158, 11, 0.1)' },
      rose: { primary: '#fb7185', bg: '#4c0519', border: 'rgba(251, 113, 133, 0.4)', pulse: '#f43f5e', gradient: 'rgba(244, 63, 94, 0.1)' },
      violet: { primary: '#a78bfa', bg: '#2e1065', border: 'rgba(167, 139, 250, 0.4)', pulse: '#8b5cf6', gradient: 'rgba(139, 92, 246, 0.1)' },
    };
    return themes[arenaColor] || themes.indigo;
  }, [arenaColor]);

  useEffect(() => {
    if (!arenaId) return;
    
    // James: SINTONIA DUAL-BAND (Lê ID e Nome para compatibilidade total)
    const channels = [
       supabase.channel(`sync_arena_${arenaId.toLowerCase()}`),
       supabase.channel(`master_control`) // Ouvir comando mestre de migração
    ];

    const handleSync = (payload: any) => {
      const now = Date.now();
      const incomingSenderId = payload.senderId || 'unknown';

      if (!lockedSenderId.current || (now - lastSenderTime.current > 5000)) {
        lockedSenderId.current = incomingSenderId;
      }

      if (lockedSenderId.current !== incomingSenderId) return;
      lastSenderTime.current = now;

      // James: TRAVA DE ESTABILIDADE (Fingerprint)
      // Comparamos apenas os dados que impactam o visual para ser ultra-veloz
      const newFinger = `${payload.arenaColor}|${payload.activeMatch?.teamA?.score}|${payload.activeMatch?.teamB?.score}|${payload.activeMatch?.servingTeam}|${payload.activeMatch?.modals?.victoryData?.winner}`;
      
      const colorChanged = payload.arenaColor && payload.arenaColor !== arenaColor;
      const dataChanged = newFinger !== fingerprintRef.current;

      if (!colorChanged && !dataChanged && connected) return;
      
      fingerprintRef.current = newFinger;
      if (colorChanged) setArenaColor(payload.arenaColor);
      
      setTvData(payload);
      setCustomArenaName(payload.arenaName || '');
      setConnected(true);
      if (payload.activeMatch) setActiveMatch(payload.activeMatch);
    };

    channels.forEach(ch => {
      ch.on('broadcast', { event: 'TV_SYNC' }, ({ payload }) => handleSync(payload));
      ch.on('broadcast', { event: 'TV_ATTACK' }, ({ payload }) => {
        if (lockedSenderId.current && payload.senderId !== lockedSenderId.current) return;
        setTvAttackTime(payload.attackTime);
      });
      ch.on('broadcast', { event: 'TV_MODAL' }, ({ payload }) => {
        if (lockedSenderId.current && payload.senderId !== lockedSenderId.current) return;
        setActiveMatch((prev: any) => prev ? { ...prev, modals: payload } : null);
      });
      // James: Se o tablet mandar mudar de arena, a TV obedece (Follow-Me)
      ch.on('broadcast', { event: 'FOLLOW_ME' }, ({ payload }) => {
        if (payload.arenaId && payload.arenaId !== arenaId) {
           window.location.search = `?tv=${payload.arenaId}`;
        }
      });
      ch.subscribe();
    });

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [arenaId]);

  useEffect(() => {
    let interval: any;
    if (activeMatch?.status === 'playing' && activeMatch?.gameStartTime) {
      const update = () => {
        const start = new Date(activeMatch.gameStartTime).getTime();
        setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
      };
      update();
      interval = setInterval(update, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeMatch]);

  const stats = useMemo(() => tvData?.ranking || [], [tvData]);
  const historyMatches = useMemo(() => tvData?.history || [], [tvData]);

  if (!connected) {
    return (
      <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center font-sans text-white">
        <div className="w-20 h-20 border-4 border-white/10 border-b-indigo-500 rounded-full animate-spin mb-8"></div>
        <h1 className="text-4xl font-black tracking-widest uppercase animate-pulse">Sintonizando...</h1>
        <p className="text-white/20 mt-4 font-mono text-xs uppercase letter-spacing-[0.3em]">Aguardando Sinal do Tablet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white p-8 font-sans overflow-hidden flex flex-col space-y-6">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${arenaTheme.gradient}, transparent)` }}></div>

      {activeMatch?.modals?.victoryData && (
        <VictoryModal 
          victoryData={activeMatch.modals.victoryData} 
          onClose={()=>{}} onSave={()=>{}} onNewGame={()=>{}} onUndo={()=>{}} 
          isTV={true} arenaColor={arenaColor as any} 
        />
      )}
      
      {activeMatch?.modals?.showVaiATres && (
        <VaiATresModal onClose={()=>{}} onUndo={()=>{}} isTV={true} />
      )}
      
      <div className="relative z-10 flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center space-x-4">
           <div className="w-4 h-4 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: arenaTheme.pulse }}></div>
           <h1 className="text-4xl font-black uppercase">
             LIVE <span style={{ color: arenaTheme.primary }}>{customArenaName || 'ARENA'}</span>
           </h1>
        </div>
        <div className="text-5xl font-black tabular-nums">
          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="relative z-10 flex-1 lg:grid lg:grid-cols-12 gap-8 min-h-0">
        <div className="col-span-8 flex flex-col space-y-6">
          <div className="bg-[#0f172a] border-4 rounded-[3.5rem] p-10 flex flex-col justify-center shadow-2xl min-h-[55vh]" style={{ borderColor: arenaTheme.border }}>
            <div className="flex items-center justify-around space-x-8">
              {(() => {
                const isSwitched = activeMatch?.isSidesSwitched !== activeMatch?.layoutMirrored;
                const leftTeam = isSwitched ? activeMatch?.teamB : activeMatch?.teamA;
                const rightTeam = isSwitched ? activeMatch?.teamA : activeMatch?.teamB;
                const leftServing = isSwitched ? activeMatch?.servingTeam === 'B' : activeMatch?.servingTeam === 'A';
                const rightServing = isSwitched ? activeMatch?.servingTeam === 'A' : activeMatch?.servingTeam === 'B';

                return (
                  <>
                    <div className="flex-1 text-center">
                      <div className="h-10 mb-2 flex justify-center">
                        {leftServing && <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: arenaTheme.pulse }}></div>}
                      </div>
                      <div className="mb-4">
                         {(Array.isArray(leftTeam?.players) ? leftTeam.players : []).slice(0, 2).map((p: any, idx: number) => (
                           <div key={idx} className="text-[2.2vw] font-black uppercase text-white truncate">
                             {typeof p === 'string' ? p : (p?.name || '---')}
                           </div>
                         ))}
                      </div>
                      <div className="text-[22vw] leading-none font-black">{leftTeam?.score || 0}</div>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-6">
                       <div className="bg-white/5 px-6 pt-3 pb-1 rounded-2xl border border-white/10">
                          <span className="text-4xl font-mono font-black">
                            {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                          </span>
                       </div>
                       <div className="bg-black/80 border-4 px-10 py-8 rounded-[3rem]" style={{ borderColor: (tvAttackTime !== null && tvAttackTime <= 5) ? '#ef4444' : arenaTheme.border }}>
                          <span className="text-9xl font-mono font-black leading-none" style={{ color: (tvAttackTime !== null && tvAttackTime <= 5) ? '#ef4444' : arenaTheme.primary }}>
                            {tvAttackTime ?? 24}
                          </span>
                       </div>
                    </div>

                    <div className="flex-1 text-center">
                      <div className="h-10 mb-2 flex justify-center">
                        {rightServing && <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: arenaTheme.pulse }}></div>}
                      </div>
                      <div className="mb-4">
                        {(Array.isArray(rightTeam?.players) ? rightTeam.players : []).slice(0, 2).map((p: any, idx: number) => (
                           <div key={idx} className="text-[2.2vw] font-black uppercase text-white truncate">
                             {typeof p === 'string' ? p : (p?.name || '---')}
                           </div>
                         ))}
                      </div>
                      <div className="text-[22vw] leading-none font-black">{rightTeam?.score || 0}</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-[#0f172a] border-2 rounded-[3rem] p-6" style={{ borderColor: arenaTheme.border }}>
              <h2 className="text-xl font-black uppercase mb-4 opacity-50">Ranking Hoje</h2>
              <div className="flex flex-wrap">
                  {(Array.isArray(stats) ? stats : []).slice(0, 5).map((s: any, i: number) => (
                      <div key={i} className="flex-1 min-w-[18%] bg-white/5 p-4 rounded-xl border border-white/5 mx-1">
                          <span className="text-[10px] font-black" style={{ color: arenaTheme.primary }}>{s.wins} VIT</span>
                          <p className="font-black uppercase truncate text-sm">{s.name}</p>
                      </div>
                  ))}
              </div>
          </div>
        </div>

        <div className="col-span-4 h-full">
          <div className="bg-[#070b14] border-2 h-full rounded-[3.5rem] p-8 flex flex-col" style={{ borderColor: arenaTheme.border }}>
             <h2 className="text-xl font-black uppercase text-white/20 mb-6">Auditoria</h2>
             <div className="flex flex-col space-y-4">
                {(Array.isArray(historyMatches) ? historyMatches : []).slice(0, 5).map((m: any, idx: number) => (
                   <div key={idx} className="bg-white/5 border border-white/5 rounded-[2rem] p-5">
                      <div className="flex justify-between items-center mb-2 space-x-4">
                         <p className="text-sm font-black truncate flex-1">{m.teamA?.players?.slice(0,1).join('')} vs {m.teamB?.players?.slice(0,1).join('')}</p>
                         <span className="text-xs font-black">{m.teamA?.score}x{m.teamB?.score}</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full" style={{ width: '100%', backgroundColor: m.winner === 'A' ? '#3b82f6' : '#f43f5e' }}></div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVView;
