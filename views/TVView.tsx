import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { supabase } from '../lib/supabase';
import { TrophyIcon, ClockIcon } from '../components/icons';
import VictoryModal from '../components/VictoryModal';
import VaiATresModal from '../components/VaiATresModal';
import { ArenaColor } from '../types';

// James: Componente de Fundo Dinâmico de Alta Performance (Broadcast 2.0)
const Background: React.FC<{ color: any }> = memo(({ color }) => {
  const bgMap: Record<string, string> = {
    indigo: '#030712', blue: '#020617', emerald: '#022c22', amber: '#451a03', rose: '#450519', violet: '#1e1b4b'
  };
  const glowMap: Record<string, string> = {
    indigo: 'rgba(99, 102, 241, 0.4)', blue: 'rgba(59, 130, 246, 0.4)', emerald: 'rgba(16, 185, 129, 0.5)',
    amber: 'rgba(245, 158, 11, 0.5)', rose: 'rgba(244, 63, 94, 0.5)', violet: 'rgba(139, 92, 246, 0.5)'
  };
  
  const baseBg = bgMap[color] || bgMap.indigo;
  const glowColor = glowMap[color] || glowMap.indigo;

  return (
    <div className="fixed inset-0 -z-10 bg-black overflow-hidden">
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-2%, 2%) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .bg-float { animation: float 20s ease-in-out infinite; }
      `}</style>
      
      {/* Camada Base */}
      <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: baseBg }}></div>
      
      {/* Gradientes Animados para Profundidade */}
      <div className="absolute inset-0 bg-float opacity-40" style={{ 
        background: `radial-gradient(circle at 20% 30%, ${glowColor} 0%, transparent 70%),
                     radial-gradient(circle at 80% 70%, ${glowColor} 0%, transparent 70%)` 
      }}></div>
      
      {/* Textura e Vinheta */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black/60"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}></div>
      
      {/* Grid Sutil */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
    </div>
  );
});

const TEMAS: Record<string, any> = {
  indigo: { text: 'text-indigo-400', border: 'border-indigo-500/50', from: 'from-indigo-900/40', via: 'via-indigo-500/20', bg: 'bg-indigo-500/10', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.2)]' },
  blue: { text: 'text-blue-400', border: 'border-blue-500/50', from: 'from-blue-900/40', via: 'via-blue-500/20', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_30_rgba(59,130,246,0.2)]' },
  emerald: { text: 'text-emerald-400', border: 'border-emerald-500/50', from: 'from-emerald-900/40', via: 'via-emerald-500/20', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]' },
  amber: { text: 'text-amber-400', border: 'border-amber-500/50', from: 'from-amber-900/40', via: 'via-amber-500/20', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]' },
  rose: { text: 'text-rose-400', border: 'border-rose-500/50', from: 'from-rose-900/40', via: 'via-rose-500/20', bg: 'bg-rose-500/10', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.2)]' },
  violet: { text: 'text-violet-400', border: 'border-violet-500/50', from: 'from-violet-900/40', via: 'via-violet-500/20', bg: 'bg-violet-500/10', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.2)]' },
};

interface TVViewProps {
  arenaId: string;
}

const TVView: React.FC<TVViewProps> = ({ arenaId }) => {
  const [tvData, setTvData] = useState<any>(null);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [internalArenaId, setInternalArenaId] = useState<string>(() => {
    try {
        const INVALID = ['', 'auto', 'default'];
        const saved = localStorage.getItem('tv_paired_arena');
        const savedIsReal = saved && !INVALID.includes(saved);
        const propIsReal = arenaId && !INVALID.includes(arenaId);
        return (savedIsReal ? saved! : null) || (propIsReal ? arenaId : '') || '';
    } catch(e) {
        const INVALID = ['', 'auto', 'default'];
        return (arenaId && !INVALID.includes(arenaId)) ? arenaId : '';
    }
  });
  const [customArenaName, setCustomArenaName] = useState<string>('');
  const [tvAttackTime, setTvAttackTime] = useState<number | null>(null);
  const [lastSignalTime, setLastSignalTime] = useState<number>(Date.now());
  const [reconnectCounter, setReconnectCounter] = useState(0);
  const [signalStatus, setSignalStatus] = useState<'off' | 'listening'>('off');
  const [connected, setConnected] = useState(false);
  const [signalLost, setSignalLost] = useState(false);
  const [arenaColor, setArenaColor] = useState<string>('indigo');
  const [pairingPin, setPairingPin] = useState<string | null>(null);
  const [isPairingMode, setIsPairingMode] = useState(false);

  const lockedSenderId = useRef<string | null>(null);
  const lastSenderTime = useRef<number>(0);
  const fingerprintRef = useRef<string>("");
  const connectedRef = useRef<boolean>(false);
  const arenaColorRef = useRef<string>('indigo');
  const lastInteractionRef = useRef<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let mId = params.get('m') || params.get('master') || localStorage.getItem('tv_paired_master');
    let autoMode = params.get('tv') === 'auto' || (localStorage.getItem('tv_paired_master') !== null && !params.get('tv'));

    let savedArena = localStorage.getItem('tv_paired_arena');
    if (savedArena && savedArena !== 'default' && !internalArenaId) {
      setInternalArenaId(savedArena);
    }
    const masterId = mId;
    const isAuto = autoMode;
    const isDirectTv = params.get('tv') && params.get('tv') !== 'auto';
    
    const arenaIdIsInvalid = !internalArenaId || internalArenaId === 'default';
    if (!isDirectTv && ((!isAuto || !masterId) || (arenaIdIsInvalid && !isAuto))) {
        setIsPairingMode(true);
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        setPairingPin(pin);
        const channel = supabase.channel(`pairing_${pin}`);
        channel.on('broadcast', { event: 'PAIRING_SUCCESS' }, ({ payload }) => {
            localStorage.setItem('tv_paired_master', payload.masterId);
            if (payload.arenaId) {
                setInternalArenaId(payload.arenaId);
                localStorage.setItem('tv_paired_arena', payload.arenaId);
            }
            setIsPairingMode(false);
            window.location.reload();
        });
        channel.subscribe();
        return () => { supabase.removeChannel(channel); };
    }

    if (isAuto && masterId) {
      const shortToken = masterId.replace(/-/g, '').substring(0, 8);
      const masterChannelName = `master_control_${shortToken}`;
      const channel = supabase.channel(masterChannelName);
      channel.on('broadcast', { event: 'TV_MIGRATE' }, ({ payload }) => {
        if (payload.arenaId) {
          setInternalArenaId(prev => {
            if (prev !== payload.arenaId) {
              lockedSenderId.current = null;
              return payload.arenaId;
            }
            return prev;
          });
        }
      });
      channel.subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, []);

    useEffect(() => {
      const targetId = internalArenaId || arenaId;
      if (!targetId || targetId === 'auto') return;

      const handleSync = (payload: any) => {
        const currentEnv = import.meta.env.DEV ? 'dev' : 'prod';
        if (payload.env && payload.env !== currentEnv) return;

        const incomingTime = payload.lastInteractionTime || 0;
        if (incomingTime < lastInteractionRef.current) return;
        lastInteractionRef.current = incomingTime;

        const now = Date.now();
        const incomingSenderId = payload.senderId || 'unknown';

        if (!lockedSenderId.current || (now - lastSenderTime.current > 5000)) {
          lockedSenderId.current = incomingSenderId;
        }

        if (lockedSenderId.current !== incomingSenderId) {
           if (incomingTime > lastInteractionRef.current) {
               lockedSenderId.current = incomingSenderId;
           } else {
               return;
           }
        }
        lastSenderTime.current = now;

        const historyHash = payload.history?.length || 0;
        const teamAPlayers = (payload.activeMatch?.teamA?.players || []).map((p: any) => p?.id || p?.name || '').join(',');
        const teamBPlayers = (payload.activeMatch?.teamB?.players || []).map((p: any) => p?.id || p?.name || '').join(',');
        const attackStr = payload.activeMatch?.attackTime === null ? 'null' : String(payload.activeMatch?.attackTime ?? 'null');
        const newFinger = `${payload.arenaColor}|${payload.activeMatch?.teamA?.score}|${payload.activeMatch?.teamB?.score}|${payload.activeMatch?.servingTeam}|${attackStr}|${payload.activeMatch?.modals?.victoryData?.winner}|H${historyHash}|${teamAPlayers}|${teamBPlayers}`;
        
        const colorChanged = payload.arenaColor && payload.arenaColor !== arenaColorRef.current;
        const dataChanged = newFinger !== fingerprintRef.current;

        if (!colorChanged && !dataChanged && connectedRef.current) return;
        
        fingerprintRef.current = newFinger;
        if (colorChanged) {
          setArenaColor(payload.arenaColor);
          arenaColorRef.current = payload.arenaColor;
        }
        
        if (!connectedRef.current) {
           setConnected(true);
           connectedRef.current = true;
        }

        setLastSignalTime(Date.now());
        setTvData(payload);
        setActiveMatch(payload.activeMatch);
        if (payload.activeMatch?.attackTime !== undefined) {
           setTvAttackTime(payload.activeMatch.attackTime);
        }
        setCustomArenaName(payload.arenaName || '');
        setSignalLost(false);
      };

      const fetchInitial = async () => {
        const { data } = await supabase.from('arenas').select('id, name, color, live_sync_state');
        if (data) {
           const targetNormalized = targetId.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();
           const match = data.find(a => a.id === targetId || (a.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim() === targetNormalized);
           if (match) {
              setSignalLost(false);
              if (!connectedRef.current) {
                setConnected(true);
                connectedRef.current = true;
                setCustomArenaName(match.name || '');
                if (match.color) {
                  setArenaColor(match.color);
                  arenaColorRef.current = match.color;
                }
              }
              if (match.live_sync_state) {
                 handleSync(match.live_sync_state);
              }
           }
        }
      };
      fetchInitial();

       const channelSafeId = targetId.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
       const channel = supabase.channel(`tv_db_sync_${channelSafeId.substring(0, 20)}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arenas' }, (payload) => {
            const updatedArena = payload.new as any;
            const targetNormalized = targetId.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();
            const arenaNormalized = (updatedArena.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();
            if (updatedArena.id === targetId || arenaNormalized === targetNormalized) {
               if (updatedArena.live_sync_state) handleSync(updatedArena.live_sync_state);
            }
        }).subscribe((status) => {
          if (status === 'SUBSCRIBED') setSignalStatus('listening');
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setTimeout(() => setReconnectCounter(prev => prev + 1), 3000);
        });

      const ENV_PREFIX = import.meta.env.DEV ? 'dev' : 'prod';
      const broadcastChannelName = `${ENV_PREFIX}_tv_live_${channelSafeId.substring(0, 20)}`;
      const broadcastChannel = supabase.channel(broadcastChannelName)
        .on('broadcast', { event: 'TV_SYNC' }, ({ payload }) => { if (payload) handleSync(payload); })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setSignalStatus('listening');
            if (!connectedRef.current) { setConnected(true); connectedRef.current = true; }
          }
        });

      const legacyChannelName = `tv_live_${channelSafeId.substring(0, 20)}`;
      const legacyBroadcastChannel = supabase.channel(legacyChannelName)
        .on('broadcast', { event: 'TV_SYNC' }, ({ payload }) => { if (payload) handleSync(payload); })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            if (!connectedRef.current) { setConnected(true); connectedRef.current = true; }
          }
        });

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(broadcastChannel);
        supabase.removeChannel(legacyBroadcastChannel);
      };
    }, [internalArenaId, arenaId, reconnectCounter]);

  useEffect(() => {
    let lastWakeUp = 0;
    const handleWakeUp = () => {
      const now = Date.now();
      if (now - lastWakeUp < 5000) return;
      lastWakeUp = now;
      setSignalLost(true);
      setReconnectCounter(prev => prev + 1);
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') handleWakeUp(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastSignalTime;
      if (idleTime > 120000) {
        setConnected(false);
        connectedRef.current = false;
        setSignalStatus('off');
      }
    }, 10000);
    return () => clearInterval(checkInterval);
  }, [lastSignalTime]);

  const [displayAttackTime, setDisplayAttackTime] = useState<number | null>(null);

  useEffect(() => {
    setDisplayAttackTime(tvAttackTime);
  }, [tvAttackTime]);

  const stats = useMemo(() => tvData?.ranking || [], [tvData]);
  const historyMatches = useMemo(() => tvData?.history || [], [tvData]);

  const handleResetTV = () => {
    try {
      localStorage.removeItem('tv_paired_master');
      localStorage.removeItem('tv_paired_arena');
      window.location.href = '/tv';
    } catch(e) { window.location.reload(); }
  };

  if (isPairingMode) {
    return (
      <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }}></div>
        <div className="relative z-10 flex flex-col items-center gap-12 text-center px-6">
           <div className="space-y-4">
              <h1 className="text-4xl font-black uppercase tracking-[0.3em] text-white/40">Vincular Nova TV</h1>
              <p className="text-xl font-bold text-white/60 uppercase tracking-widest max-w-md">Abra as configurações no seu Tablet e digite o código abaixo para conectar.</p>
           </div>
           <div className="flex gap-4">
              {pairingPin?.split('').map((digit, i) => (
                  <div key={i} className="w-20 h-28 md:w-24 md:h-32 bg-white/5 border-2 border-white/10 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-xl">
                      <span className="text-6xl md:text-7xl font-black text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">{digit}</span>
                  </div>
              ))}
           </div>
           <div className="mt-8 flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Aguardando conexão...</p>
              </div>
              <button onClick={handleResetTV} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 transition-all">Limpar Memória da TV</button>
           </div>
        </div>
      </div>
    );
  }

  if (!connected) {
    const targetId = internalArenaId || arenaId;
    const isWaitingMaster = targetId === 'auto' || !targetId || targetId === 'default';
    return (
      <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }}></div>
        <div className="relative z-10 flex flex-col items-center gap-10">
           <div className="relative">
              <div className={`w-24 h-24 border-b-2 ${TEMAS[arenaColor as ArenaColor]?.border || 'border-indigo-500'} rounded-full animate-spin`}></div>
           </div>
           <div className="text-center space-y-4">
              <h1 className="text-5xl font-black uppercase tracking-[0.3em] text-white">{isWaitingMaster ? 'LINK INTELIGENTE ATIVO' : 'SINTONIZANDO PLACAR'}</h1>
              <p className="text-sm font-bold text-white/20 uppercase tracking-[0.3em] leading-relaxed">{isWaitingMaster ? 'Aguardando comando do Tablet Mestre...' : `Sincronizando: ${targetId}`}</p>
           </div>
           <button onClick={handleResetTV} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 transition-all">Reiniciar Conexão</button>
        </div>
      </div>
    );
  }

  const currentTheme = TEMAS[arenaColor as ArenaColor] || TEMAS.indigo;

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white font-sans overflow-hidden flex flex-col relative px-[max(5vw,24px)] py-[max(4vh,20px)] gap-[max(2vh,16px)]">
      <Background color={arenaColor} />
      
      {activeMatch?.modals?.victoryData && (
        <VictoryModal victoryData={activeMatch.modals.victoryData} onClose={()=>{}} onSave={()=>{}} onNewGame={()=>{}} onUndo={()=>{}} isTV={true} arenaColor={(arenaColor || 'indigo') as any} />
      )}
      {activeMatch?.modals?.showVaiATres && (
        <VaiATresModal onClose={()=>{}} onUndo={()=>{}} isTV={true} />
      )}
      
      <div className="flex justify-between items-end border-b border-white/10 pb-6 relative">
         <div className="flex items-center gap-6">
            <div className="w-5 h-5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_30px_#10b981,0_0_10px_white]"></div>
            <h1 className="text-[clamp(2.2rem,4.5vw,4rem)] font-black uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] leading-none">
              LIVE <span className={`${currentTheme.text} drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent`}>{customArenaName || 'ARENA'}</span>
            </h1>
         </div>
        <div className="text-right">
          <div className="text-[clamp(3rem,6vw,5rem)] font-black tracking-tighter tabular-nums text-white/90 leading-none">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-[clamp(0.7rem,1vw,1rem)] font-black text-white/20 uppercase tracking-[0.4em] font-mono mt-2">Placar Elite Pro</div>
        </div>
      </div>

      <div className="flex-1 lg:grid lg:grid-cols-12 gap-[max(2vw,24px)] h-full min-h-0 pt-2">
        <div className="col-span-8 flex flex-col gap-[max(2vh,16px)] h-full">
          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-[clamp(1.5rem,3vw,3rem)] flex flex-col justify-center relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden min-h-[52vh]">
            <div className="flex items-center justify-around gap-12 w-full mt-4">
              {(() => {
                const isSwitched = activeMatch?.isSidesSwitched !== activeMatch?.layoutMirrored;
                const leftTeam = isSwitched ? activeMatch?.teamB : activeMatch?.teamA;
                const rightTeam = isSwitched ? activeMatch?.teamA : activeMatch?.teamB;
                const leftServing = isSwitched ? activeMatch?.servingTeam === 'B' : activeMatch?.servingTeam === 'A';
                const rightServing = isSwitched ? activeMatch?.servingTeam === 'A' : activeMatch?.servingTeam === 'B';
                const leftColor = isSwitched ? "text-red-500" : "text-blue-400";
                const rightColor = isSwitched ? "text-blue-400" : "text-red-500";
                
                const getTeamTheme = (color: string) => {
                  if (!color) return 'indigo';
                  if (color.includes('blue')) return 'blue';
                  if (color.includes('red') || color.includes('rose')) return 'rose';
                  return 'indigo';
                };

                return (
                  <>
                    <div className="flex-1 flex flex-col items-center relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        {leftServing && <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_25px_white] animate-pulse"></div>}
                        <h3 className={`text-[1.5vw] font-black uppercase tracking-[0.3em] ${leftServing ? 'text-white' : 'text-white/20'}`}>TIME A</h3>
                      </div>
                      <div className="h-[9vh] flex flex-col justify-center mb-6">
                        {(leftTeam?.players || []).length > 0 ? (leftTeam?.players || []).map((p: any, idx: number) => (
                           <div key={idx} className={`text-[2.2vw] font-black uppercase tracking-tighter leading-tight drop-shadow-2xl ${leftColor}`}>{typeof p === 'string' ? p : (p?.name || '---')}</div>
                        )) : <div className={`text-[2.2vw] font-black uppercase tracking-tighter leading-tight drop-shadow-2xl ${leftColor} opacity-20`}>---</div>}
                      </div>
                      <div className="text-[clamp(10rem,19vw,26rem)] leading-[0.6] font-black tabular-nums drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] text-white">{leftTeam?.score || 0}</div>
                    </div>

                    <div className="flex flex-col items-center gap-8 relative z-10 px-8">
                       <div className="flex flex-col items-center gap-2">
                          <div className="bg-white/5 px-6 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                             <span className="text-3xl font-mono font-black tabular-nums text-white/80">{Math.floor((activeMatch?.matchTime || 0) / 60)}:{((activeMatch?.matchTime || 0) % 60).toString().padStart(2, '0')}</span>
                          </div>
                       </div>
                       <div className={`px-[clamp(2rem,5vw,5rem)] py-[clamp(1rem,3vh,4rem)] rounded-[3rem] border-4 flex flex-col items-center justify-center transition-all duration-300 ${currentTheme.glow} ${(tvAttackTime !== null && tvAttackTime <= 10) ? 'bg-red-600/30 border-red-500 animate-pulse scale-110' : 'bg-black/90 border-white/10'}`}>
                          <span className="text-[clamp(0.8rem,1vw,1.2rem)] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Posse</span>
                          <span className={`text-[clamp(5rem,10vw,12rem)] font-mono font-black tabular-nums leading-none ${(tvAttackTime !== null && tvAttackTime <= 10) ? 'text-red-500' : currentTheme.text}`}>{displayAttackTime ?? 24}</span>
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className={`text-[1.5vw] font-black uppercase tracking-[0.3em] ${rightServing ? 'text-white' : 'text-white/20'}`}>TIME B</h3>
                        {rightServing && <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_25px_white] animate-pulse"></div>}
                      </div>
                      <div className="h-[9vh] flex flex-col justify-center mb-6">
                        {(rightTeam?.players || []).length > 0 ? (rightTeam?.players || []).map((p: any, idx: number) => (
                          <div key={idx} className={`text-[2.2vw] font-black uppercase tracking-tighter leading-tight drop-shadow-2xl ${rightColor} text-right`}>{typeof p === 'string' ? p : (p?.name || '---')}</div>
                        )) : <div className={`text-[2.2vw] font-black uppercase tracking-tighter leading-tight drop-shadow-2xl ${rightColor} text-right opacity-20`}>---</div>}
                      </div>
                      <div className="text-[clamp(10rem,19vw,26rem)] leading-[0.6] font-black tabular-nums drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] text-white">{rightTeam?.score || 0}</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 flex flex-col shadow-2xl relative overflow-hidden flex-1 min-h-0">
              <div className="flex items-center gap-4 mb-6">
                <TrophyIcon className="w-8 h-8 text-yellow-500" />
                <h2 className="text-xl font-black uppercase tracking-tighter">Ranking Elite Pro</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {stats.slice(0, 10).map((s: any, i: number) => (
                      <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl border bg-white/5 border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs bg-white/10 text-white">{i + 1}</span>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{s.wins} VIT</span>
                          </div>
                          <p className="text-sm font-black uppercase truncate tracking-tighter">{s.name}</p>
                      </div>
                  ))}
              </div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-1 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden h-full">
            <h2 className="text-lg font-black uppercase tracking-widest text-white/40 mb-6 border-b border-white/5 pb-4">Auditoria</h2>
            <div className="flex-1 overflow-hidden">
               <style>{`
                @keyframes scrollList { 0% { transform: translateY(0); } 90% { transform: translateY(calc(-100% + 50vh)); } 100% { transform: translateY(0); } }
                .auto-scroll-list { animation: scrollList ${historyMatches.length * 4}s ease-in-out infinite; }
               `}</style>
               <div className={`${historyMatches.length > 5 ? 'auto-scroll-list' : ''} flex flex-col gap-2 py-2`}>
                {historyMatches.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                     <span className="text-[10px] font-black uppercase tracking-tighter truncate flex-1">{Array.isArray(m.teamA?.players) ? m.teamA.players[0] : '---'}</span>
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
                        <span className="text-lg font-black tabular-nums">{m.teamA?.score || 0} - {m.teamB?.score || 0}</span>
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-tighter truncate flex-1 text-right">{Array.isArray(m.teamB?.players) ? m.teamB.players[0] : '---'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVView;
