import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { supabase } from '../lib/supabase';
import { TrophyIcon, ClockIcon } from '../components/icons';
import VictoryModal from '../components/VictoryModal';
import VaiATresModal from '../components/VaiATresModal';
import { ArenaColor } from '../types';

// James: Componente de Fundo Dinâmico (Sincronizado com o Placar)
const Background: React.FC<{ color: any }> = memo(({ color }) => {
  const bgMap: Record<string, string> = {
    indigo: '#0f172a', blue: '#0f172a', emerald: '#064e3b', amber: '#451a03', rose: '#4c0519', violet: '#2e1065'
  };
  const glowMap: Record<string, string> = {
    indigo: 'rgba(99, 102, 241, 0.45)', blue: 'rgba(59, 130, 246, 0.45)', emerald: 'rgba(16, 185, 129, 0.65)',
    amber: 'rgba(245, 158, 11, 0.6)', rose: 'rgba(244, 63, 94, 0.65)', violet: 'rgba(139, 92, 246, 0.65)'
  };
  
  // James: Se for Verde (emerald), o fundo já começa com um tom verde escuro, não azul.
  const baseBg = bgMap[color] || bgMap.indigo;
  const glowColor = glowMap[color] || glowMap.indigo;

  return (
    <div className="fixed inset-0 -z-10 transition-colors duration-1000 ease-in-out" style={{ backgroundColor: baseBg }}>
      <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/40"></div>
      <div className="absolute inset-0 transition-all duration-1000" style={{ background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 80%)` }}></div>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
    </div>
  );
});

const TEMAS: Record<string, any> = {
  indigo: { text: 'text-indigo-400', border: 'border-indigo-500', from: 'from-indigo-900/40', via: 'via-indigo-500/50', bg: 'bg-indigo-500/10', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]' },
  blue: { text: 'text-blue-400', border: 'border-blue-500', from: 'from-blue-900/40', via: 'via-blue-500/50', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
  emerald: { text: 'text-emerald-400', border: 'border-emerald-500', from: 'from-emerald-900/40', via: 'via-emerald-500/50', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
  amber: { text: 'text-amber-400', border: 'border-amber-500', from: 'from-amber-900/40', via: 'via-amber-500/50', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
  rose: { text: 'text-rose-400', border: 'border-rose-500', from: 'from-rose-900/40', via: 'via-rose-500/50', bg: 'bg-rose-500/10', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
  violet: { text: 'text-violet-400', border: 'border-violet-500', from: 'from-violet-900/40', via: 'via-violet-500/50', bg: 'bg-violet-500/10', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]' },
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
  }); // James: ID real da arena — nunca 'auto' ou 'default'
  const [customArenaName, setCustomArenaName] = useState<string>('');
  const [tvAttackTime, setTvAttackTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastSignalTime, setLastSignalTime] = useState<number>(Date.now());
  const [detectedArenas, setDetectedArenas] = useState<string[]>([]);
  const [reconnectCounter, setReconnectCounter] = useState(0);
  const [signalStatus, setSignalStatus] = useState<'off' | 'listening'>('off');
  const [connected, setConnected] = useState(false);
  const [signalLost, setSignalLost] = useState(false); // James: Novo estado para queda temporária
  const [arenaColor, setArenaColor] = useState<string>('indigo');
  const [pairingPin, setPairingPin] = useState<string | null>(null);
  const [isPairingMode, setIsPairingMode] = useState(false);

  // James: ESCUDO ANTI-INTERFERÊNCIA V5 - Tranca no tablet principal usando REF para estabilidade total
  const lockedSenderId = useRef<string | null>(null);
  const lastSenderTime = useRef<number>(0);
  
  // James: TRAVA DE ESTABILIDADE (Fingerprint) para não flashear o DOM em TVs antigas
  const fingerprintRef = useRef<string>("");
  const connectedRef = useRef<boolean>(false);
  const arenaColorRef = useRef<string>('indigo');
  const lastInteractionRef = useRef<number>(0);

  // 1. SINCRONISMO GLOBAL (AUTO-MIGRATE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let mId = null;
    let autoMode = false;
    try {
        mId = params.get('m') || params.get('master') || localStorage.getItem('tv_paired_master');
        autoMode = params.get('tv') === 'auto' || (localStorage.getItem('tv_paired_master') !== null && !params.get('tv'));
    } catch (e) {
        mId = params.get('m') || params.get('master');
        autoMode = params.get('tv') === 'auto';
    }

    // James: Se já temos a arena salva do pareamento anterior, conecta direto sem esperar TV_MIGRATE
    // Isso elimina o "LINK INTELIGENTE ATIVO" preso quando o tablet demora a enviar o sinal
    let savedArena: string | null = null;
    try { savedArena = localStorage.getItem('tv_paired_arena'); } catch(e) {}
    if (savedArena && savedArena !== 'default' && !internalArenaId) {
      setInternalArenaId(savedArena);
    }
    const masterId = mId;
    const isAuto = autoMode;
    const isDirectTv = params.get('tv') && params.get('tv') !== 'auto';
    
    // James: Se não tiver ID de arena nem comando master, OU se a arena for o ID genérico 'default', entra em modo de pareamento
    const arenaIdIsInvalid = !internalArenaId || internalArenaId === 'default';
    if (!isDirectTv && ((!isAuto || !masterId) || (arenaIdIsInvalid && !isAuto))) {
        setIsPairingMode(true);
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        setPairingPin(pin);
        
        console.log("TV: Entrando em modo de pareamento. PIN:", pin);
        const channel = supabase.channel(`pairing_${pin}`);
        
        channel.on('broadcast', { event: 'PAIRING_SUCCESS' }, ({ payload }) => {
            console.log("TV: Pareamento bem sucedido! Master ID ->", payload.masterId);
            try {
                localStorage.setItem('tv_paired_master', payload.masterId);
                if (payload.arenaId) {
                    setInternalArenaId(payload.arenaId);
                    localStorage.setItem('tv_paired_arena', payload.arenaId);
                }
            } catch (e) {
                console.error("TV: Erro ao salvar pareamento no localStorage", e);
            }
            setIsPairingMode(false);
            window.location.reload(); // Recarrega para entrar no modo Auto limpo
        });
        
        channel.subscribe();
        return () => { supabase.removeChannel(channel); };
    }

    if (isAuto && masterId) {
      // James: Normaliza para 8 dígitos se for o ID completo
      const shortToken = masterId.replace(/-/g, '').substring(0, 8);
      console.log("TV: Modo Follow-Me Ativado. Escutando Master Control:", shortToken);
      const masterChannelName = `master_control_${shortToken}`;
      const channel = supabase.channel(masterChannelName);
      
      channel.on('broadcast', { event: 'TV_MIGRATE' }, ({ payload }) => {
        console.log("TV: Recebido comando de migração para arena ->", payload.arenaId);
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

    // 2. RECEPTOR PRINCIPAL — Escuta o Postgres (Fonte Única da Verdade)
    useEffect(() => {
      const targetId = internalArenaId || arenaId;
      if (!targetId || targetId === 'auto') return;

      console.log(`TV: Sintonizando Banco de Dados para a arena: ${targetId}`);

      const handleSync = (payload: any) => {
        // James: FILTRO DE AMBIENTE — ignora dados do ambiente errado (ex: servidor local → TV produção)
        const currentEnv = import.meta.env.DEV ? 'dev' : 'prod';
        if (payload.env && payload.env !== currentEnv) return;

        // James: BALA DE PRATA - RELÓGIO MONOTÔNICO TEMPORAL
        const incomingTime = payload.lastInteractionTime || 0;
        if (incomingTime < lastInteractionRef.current) return;
        lastInteractionRef.current = incomingTime;

        // Ao ler direto do banco não tem "bate e volta" instantâneo, mas mantemos o Shield
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

        // Fingerprint para evitar flicker de reagendamento DOM
        const historyHash = payload.history?.length || 0;
        const newFinger = `${payload.arenaColor}|${payload.activeMatch?.teamA?.score}|${payload.activeMatch?.teamB?.score}|${payload.activeMatch?.servingTeam}|${payload.activeMatch?.modals?.victoryData?.winner}|H${historyHash}`;
        
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

      // Puxar o estado inicial IMEDIATAMENTE do banco via REST
      const fetchInitial = async () => {
        const { data } = await supabase.from('arenas').select('id, name, color, live_sync_state');
        if (data) {
           const targetNormalized = targetId.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();
           const match = data.find(a => a.id === targetId || (a.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim() === targetNormalized);
           if (match) {
              setSignalLost(false);
              // James: Se achou a arena, já está conectado — mesmo sem live_sync_state ainda
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

       // James: Normaliza o nome do canal para remover espaços e caracteres que Smart TVs odeiam
       const channelSafeId = targetId.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
       const channel = supabase.channel(`tv_db_sync_${channelSafeId.substring(0, 20)}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'arenas' },
          (payload) => {
            const updatedArena = payload.new as any;
            const targetNormalized = targetId.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();
            const arenaNormalized = (updatedArena.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();
            
            if (updatedArena.id === targetId || arenaNormalized === targetNormalized) {
               if (updatedArena.live_sync_state) {
                  handleSync(updatedArena.live_sync_state);
               }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setSignalStatus('listening');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setTimeout(() => setReconnectCounter(prev => prev + 1), 3000);
          }
        });

      // James: CANAL BROADCAST — recebe dados do tablet sem necessitar autenticação (bypass RLS)
      // Prefixo de ambiente garante isolamento entre local e produção
      const ENV_PREFIX = import.meta.env.DEV ? 'dev' : 'prod';
      const broadcastChannelName = `${ENV_PREFIX}_tv_live_${channelSafeId.substring(0, 20)}`;
      const broadcastChannel = supabase.channel(broadcastChannelName)
        .on('broadcast', { event: 'TV_SYNC' }, ({ payload }) => {
          if (payload) handleSync(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('TV: Canal broadcast conectado:', broadcastChannelName);
            setSignalStatus('listening');
            // James: Marca como conectado ao estabelecer o canal — não depende de dados do banco
            // Os dados chegarão no próximo heartbeat do tablet (máx. 3s)
            if (!connectedRef.current) {
              setConnected(true);
              connectedRef.current = true;
            }
          }
        });

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(broadcastChannel);
      };
    }, [internalArenaId, arenaId, reconnectCounter]);

  // James: DETECTOR DE DESPERTAR — quando a TV acorda, força reconexão (com debounce para evitar loops)
  useEffect(() => {
    let lastWakeUp = 0;
    const handleWakeUp = () => {
      const now = Date.now();
      if (now - lastWakeUp < 5000) return;
      lastWakeUp = now;
      console.log("TV: Tela acordou! Forçando reconexão...");
      setSignalLost(true);
      setReconnectCounter(prev => prev + 1);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') handleWakeUp();
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // James: Monitor de Silêncio — só marca como desconectado após 120s (tolerante com produção)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastSignalTime;
      if (idleTime > 120000) {
        console.warn("TV: 120s sem sinal — marcando como desconectado");
        setConnected(false);
        connectedRef.current = false;
        setSignalStatus('off');
      }
    }, 10000);
    return () => clearInterval(checkInterval);
  }, [lastSignalTime]);

  // Cronômetro do Placar
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

  const handleResetTV = () => {
    try {
      localStorage.removeItem('tv_paired_master');
      localStorage.removeItem('tv_paired_arena');
      window.location.href = '/tv';
    } catch(e) {
      window.location.reload();
    }
  };

  if (isPairingMode) {
    return (
      <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }}></div>
        <div className="relative z-10 flex flex-col items-center gap-12 text-center px-6">
           <div className="space-y-4">
              <h1 className="text-4xl font-black uppercase tracking-[0.3em] text-white/40">Vincular Nova TV</h1>
              <p className="text-xl font-bold text-white/60 uppercase tracking-widest max-w-md">
                 Abra as configurações no seu Tablet e digite o código abaixo para conectar.
              </p>
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
              <button
                onClick={handleResetTV}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 transition-all"
              >
                Limpar Memória da TV
              </button>
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
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className={`w-3 h-3 rounded-full ${signalStatus === 'listening' ? 'bg-emerald-400 shadow-[0_0_15px_#10b981]' : 'bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse'}`}></div>
              </div>
           </div>
           <div className="text-center space-y-4">
              <h1 className="text-5xl font-black uppercase tracking-[0.3em] text-white">
                {isWaitingMaster ? 'LINK INTELIGENTE ATIVO' : 'SINTONIZANDO PLACAR'}
              </h1>
              <p className="text-sm font-bold text-white/20 uppercase tracking-[0.3em] leading-relaxed">
                 {isWaitingMaster ? 'Aguardando comando do Tablet Mestre...' : `Sincronizando: ${targetId}`}
              </p>
           </div>
           <div className="flex flex-col items-center gap-4 mt-4">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-sm w-full text-center backdrop-blur-md">
               <code className="text-[10px] font-mono text-white/40 block bg-black/40 py-2 rounded-lg break-all px-4">
                 MODO {isWaitingMaster ? 'AUTOMÁTICO' : 'SELETIVO'}
               </code>
             </div>
             <button
               onClick={handleResetTV}
               className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 transition-all"
             >
               Reiniciar Conexão
             </button>
           </div>
        </div>
      </div>
    );
  }

  const currentTheme = TEMAS[arenaColor as ArenaColor] || TEMAS.indigo;

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white p-8 font-sans overflow-hidden flex flex-col gap-8 relative">
      <Background color={arenaColor} />
      
      {/* Indicadores de Status Invisíveis / Diagnóstico */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-[100]">
        {signalLost && (
          <div className="bg-amber-500/10 text-amber-500/80 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse border border-amber-500/20 backdrop-blur-md">
            Sinal Recuperando...
          </div>
        )}
      </div>

      {activeMatch?.modals?.victoryData && (
        <VictoryModal 
          victoryData={activeMatch.modals.victoryData} 
          onClose={()=>{}} 
          onSave={()=>{}} 
          onNewGame={()=>{}} 
          onUndo={()=>{}} 
          isTV={true} 
          arenaColor={(arenaColor || 'indigo') as any} 
        />
      )}
      
      {activeMatch?.modals?.showVaiATres && (
        <VaiATresModal 
          onClose={()=>{}} 
          onUndo={()=>{}} 
          isTV={true}
        />
      )}
      
      {/* Header com Design Limpo */}
      <div className="flex justify-between items-start border-b border-white/5 pb-4">
         <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]"></div>
            <h1 className="text-4xl font-black uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              LIVE <span className={`${currentTheme.text} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>{customArenaName || 'ARENA'}</span>
            </h1>
         </div>

        <div className="text-right">
          <div className="text-5xl font-black tracking-tighter tabular-nums text-white/90 leading-tight">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm font-bold text-white/20 uppercase tracking-[0.3em] font-mono">Placar Elite Pro</div>
        </div>
      </div>

      <div className="flex-1 lg:grid lg:grid-cols-12 gap-8 h-full min-h-0 pt-2">
        <div className="col-span-8 flex flex-col gap-6 h-full">
          {/* Main Scoreboard Area */}
          <div className="bg-gray-900/60 border border-white/5 rounded-[3.5rem] p-10 flex flex-col justify-center relative shadow-2xl overflow-hidden min-h-[55vh]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

            <div className="flex items-center justify-around gap-12 w-full mt-4">
              {/* Lógica de Espelhamento (Lado da Quadra) - James: Inverte os blocos se isSidesSwitched ou layoutMirrored forem true (XOR) */}
              {(() => {
                const isSwitched = activeMatch?.isSidesSwitched !== activeMatch?.layoutMirrored; // James: XOR para inversão independente na TV
                const leftTeam = isSwitched ? activeMatch?.teamB : activeMatch?.teamA;
                const rightTeam = isSwitched ? activeMatch?.teamA : activeMatch?.teamB;
                const leftServing = isSwitched ? activeMatch?.servingTeam === 'B' : activeMatch?.servingTeam === 'A';
                const rightServing = isSwitched ? activeMatch?.servingTeam === 'A' : activeMatch?.servingTeam === 'B';
                const leftColor = isSwitched ? "text-red-500" : "text-blue-400";
                const rightColor = isSwitched ? "text-blue-400" : "text-red-500";

                return (
                  <>
                    {/* Time da ESQUERDA */}
                    <div className="flex-1 text-center flex flex-col items-center">
                      <div className="h-[4vh] mb-2 flex items-center justify-center">
                        {leftServing && <div className="w-8 h-8 bg-white rounded-full animate-pulse shadow-[0_0_40px_white]"></div>}
                      </div>
                      <div className="h-[8vh] flex flex-col justify-center mb-4">
                        {(leftTeam?.players || []).map((p: any, idx: number) => (
                          <div key={idx} className={`text-[2vw] font-black uppercase tracking-tighter leading-tight drop-shadow-lg ${leftColor}`}>
                            {typeof p === 'string' ? p : (p?.name || '---')}
                          </div>
                        ))}
                      </div>
                      <div className="text-[20vw] leading-[0.6] font-black tabular-nums drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">{leftTeam?.score || 0}</div>
                    </div>

                    {/* CRONÔMETRO CENTRAL (PARTIDA + ATAQUE/POSSE) */}
                    <div className="flex flex-col items-center justify-center gap-2 min-w-[15vw]">
                       {/* Tempo de Jogo Integrado ao Placar */}
                       <div className="bg-white/5 px-6 py-2 rounded-xl border border-white/5 flex items-center gap-3 mb-2">
                          <ClockIcon className="w-4 h-4 text-white/40" />
                          <span className="text-4xl font-mono font-black tabular-nums text-white/80">
                            {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                          </span>
                       </div>

                       <div className="text-white/10 text-2xl font-black italic tracking-widest mb-2">VS</div>

                       <div className={`px-12 py-8 rounded-[2.5rem] border-4 flex flex-col items-center justify-center transition-all duration-300 ${currentTheme.glow} ${(tvAttackTime !== null && tvAttackTime <= 5) ? 'bg-red-600/30 border-red-500 animate-pulse scale-110 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-black/90 border-white/10'}`}>
                          <span className="text-[14px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Posse</span>
                        <span className={`text-9xl font-mono font-black tabular-nums leading-none ${(tvAttackTime !== null && tvAttackTime <= 5) ? 'text-red-500' : currentTheme.text}`}>
                          {tvAttackTime ?? 24}
                        </span>
                     </div>
                  </div>

                    {/* Time da DIREITA */}
                    <div className="flex-1 text-center flex flex-col items-center">
                      <div className="h-[4vh] mb-2 flex items-center justify-center">
                        {rightServing && <div className="w-8 h-8 bg-white rounded-full animate-pulse shadow-[0_0_40px_white]"></div>}
                      </div>
                      <div className="h-[8vh] flex flex-col justify-center mb-4">
                        {(rightTeam?.players || []).map((p: any, idx: number) => (
                          <div key={idx} className={`text-[2vw] font-black uppercase tracking-tighter leading-tight drop-shadow-lg ${rightColor}`}>
                            {typeof p === 'string' ? p : (p?.name || '---')}
                          </div>
                        ))}
                      </div>
                      <div className="text-[20vw] leading-[0.6] font-black tabular-nums drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">{rightTeam?.score || 0}</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Ranking */}
          <div className={`bg-gradient-to-br ${currentTheme.from} to-transparent border border-white/5 rounded-[3rem] p-8 flex flex-col shadow-2xl relative overflow-hidden flex-1 min-h-0`}>
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via ${currentTheme.via} to-transparent`}></div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <TrophyIcon className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Ranking Elite Pro</h2>
                </div>
                {tvData?.rankingDate && (
                  <span className="text-xs font-black text-white/30 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                    📅 {tvData.rankingDate}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {stats.slice(0, 10).map((s: any, i: number) => (
                      <div key={`rank-${i}-${s.name}`} className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'}`}>
                                {i + 1}
                            </span>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{s.wins} VIT</span>
                          </div>
                          <p className="text-sm font-black uppercase truncate tracking-tighter">{s.name}</p>
                      </div>
                  ))}
              </div>
          </div>
        </div>

        {/* Auditoria Sidebar Right - FULL HEIGHT WITH AUTO-SCROLL */}
        <div className="col-span-4 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-1 bg-gray-900/40 border border-white/5 rounded-[3.5rem] p-8 flex flex-col shadow-inner relative overflow-hidden h-full">
            <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-white/40">Auditoria de partidas</h2>
            </div>
            
            {/* James: SISTEMA DE AUTO-SCROLL INDUSTRIAL - Mais lento e suave para produção */}
            <div className="flex-1 relative overflow-hidden">
              <style>{`
                @keyframes scrollList {
                  0% { transform: translateY(0); }
                  85% { transform: translateY(calc(-100% + 55vh)); }
                  100% { transform: translateY(0); }
                }
                .auto-scroll-list {
                  animation: scrollList ${historyMatches.length > 4 ? historyMatches.length * 5 : 0}s ease-in-out infinite;
                }
                .auto-scroll-list:hover {
                  animation-play-state: paused;
                }
              `}</style>
              
              <div className={`${historyMatches.length > 4 ? 'auto-scroll-list' : ''} flex flex-col gap-3 py-2 px-1`}>
                {historyMatches.map((m: any) => (
                  <div key={m.id} className={`bg-gray-800/40 border border-white/10 rounded-[2rem] p-6 flex flex-col gap-2 transition-all hover:${currentTheme.bg} shadow-lg`}>
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Partida Finalizada</span>
                        <div className="h-px flex-1 mx-4 bg-white/5"></div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                       <div className="flex-1 flex flex-col">
                          <p className={`text-sm font-black uppercase truncate tracking-tighter ${m.winner === 'A' ? 'text-white' : 'text-white/40'}`}>
                            {Array.isArray(m.teamA?.players) ? m.teamA.players.filter(Boolean).join(' & ') : '---'}
                          </p>
                          <div className={`mt-1 h-1 w-full rounded-full ${m.winner === 'A' ? 'bg-blue-600' : 'bg-white/5'}`}></div>
                       </div>
                       <div className={`text-2xl font-black w-12 text-center py-1 rounded-xl shadow-inner ${m.winner === 'A' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/20'}`}>{m.teamA?.score || 0}</div>
                       <div className="text-[10px] font-bold text-white/10">X</div>
                       <div className={`text-2xl font-black w-12 text-center py-1 rounded-xl shadow-inner ${m.winner === 'B' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/20'}`}>{m.teamB?.score || 0}</div>
                       <div className="flex-1 flex flex-col text-right">
                          <p className={`text-sm font-black uppercase truncate tracking-tighter ${m.winner === 'B' ? 'text-white' : 'text-white/40'}`}>
                            {Array.isArray(m.teamB?.players) ? m.teamB.players.filter(Boolean).join(' & ') : '---'}
                          </p>
                          <div className={`mt-1 h-1 w-full rounded-full ${m.winner === 'B' ? 'bg-red-600' : 'bg-white/5'}`}></div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Footer */}
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Rádio Isolado</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVView;
