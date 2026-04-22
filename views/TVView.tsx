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
        // James: players, attackTime (incluindo null=pausado) e nomes garantem que toda mudança chega na TV
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

      // James: CANAL BROADCAST (NOVO) — tablets atualizados usam canal prefixado por ambiente
      const ENV_PREFIX = import.meta.env.DEV ? 'dev' : 'prod';
      const broadcastChannelName = `${ENV_PREFIX}_tv_live_${channelSafeId.substring(0, 20)}`;
      const broadcastChannel = supabase.channel(broadcastChannelName)
        .on('broadcast', { event: 'TV_SYNC' }, ({ payload }) => {
          if (payload) handleSync(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('TV: Canal broadcast (novo) conectado:', broadcastChannelName);
            setSignalStatus('listening');
            if (!connectedRef.current) {
              setConnected(true);
              connectedRef.current = true;
            }
          }
        });

      // James: CANAL BROADCAST LEGADO — tablets com versão antiga (cache do browser) usam canal sem prefixo
      // O filtro de env no handleSync evita que dados do servidor local passem mesmo neste canal
      const legacyChannelName = `tv_live_${channelSafeId.substring(0, 20)}`;
      const legacyBroadcastChannel = supabase.channel(legacyChannelName)
        .on('broadcast', { event: 'TV_SYNC' }, ({ payload }) => {
          if (payload) handleSync(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('TV: Canal broadcast (legado) conectado:', legacyChannelName);
            if (!connectedRef.current) {
              setConnected(true);
              connectedRef.current = true;
            }
          }
        });

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(broadcastChannel);
        supabase.removeChannel(legacyBroadcastChannel);
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

  // James: RELÓGIO DE PARTIDA E POSSE (Sincronia de Fase Precision Clock)
  const [displayAttackTime, setDisplayAttackTime] = useState<number | null>(null);
  const elapsedAccumRef = useRef<number>(0);
  const prevGameStartRef = useRef<any>(null);
  const localTickTimeoutRef = useRef<any>(null);

  // James: Lógica de Sincronia de Posse (Remove o "pulo" e o lag)
  useEffect(() => {
    // Para o timer local se o tablet pausar (null)
    if (tvAttackTime === null) {
      setDisplayAttackTime(null);
      if (localTickTimeoutRef.current) clearTimeout(localTickTimeoutRef.current);
      return;
    }

    // Sincroniza IMEDIATAMENTE com o valor do tablet
    setDisplayAttackTime(tvAttackTime);

    // Inicia um "Local Tick" — se o próximo sinal do tablet atrasar, a TV conta sozinha
    // Isso mantém a fluidez e elimina a sensação de estar "atrás"
    if (localTickTimeoutRef.current) clearTimeout(localTickTimeoutRef.current);
    
    // Agendamos o próximo decremento local para daqui a 1000ms
    // Se um novo sinal do tablet chegar antes, este timeout é cancelado e resetado
    const scheduleLocalTick = () => {
      localTickTimeoutRef.current = setTimeout(() => {
        setDisplayAttackTime(prev => {
          if (prev === null || prev <= 0) return prev;
          // Incrementa o relógio de partida junto com o tick da posse
          elapsedAccumRef.current += 1;
          setElapsedSeconds(elapsedAccumRef.current);
          return prev - 1;
        });
        scheduleLocalTick();
      }, 1000);
    };
    
    scheduleLocalTick();

    return () => {
      if (localTickTimeoutRef.current) clearTimeout(localTickTimeoutRef.current);
    };
  }, [tvAttackTime]);

  // Reseta ao começar nova partida
  useEffect(() => {
    const gst = activeMatch?.gameStartTime;
    if (gst && gst !== prevGameStartRef.current) {
      prevGameStartRef.current = gst;
      elapsedAccumRef.current = 0;
      setElapsedSeconds(0);
    }
  }, [activeMatch?.gameStartTime]);

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
    <div className="min-h-screen w-full bg-[#020617] text-white font-sans overflow-hidden flex flex-col relative px-[max(5vw,24px)] py-[max(4vh,20px)] gap-[max(2vh,16px)]">
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
      
      <div className="flex justify-between items-end border-b border-white/10 pb-6 relative">
         <div className="flex items-center gap-6">
            <div className="w-5 h-5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_30px_#10b981,0_0_10px_white]"></div>
            <h1 className="text-[clamp(2.2rem,4.5vw,4rem)] font-black uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] leading-none">
              LIVE <span className={`${currentTheme.text} drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent`}>{customArenaName || 'ARENA'}</span>
            </h1>
         </div>

        <div className="text-right">
          <div className="text-[clamp(3rem,6vw,5rem)] font-black tracking-tighter tabular-nums text-white/90 leading-none">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[clamp(0.7rem,1vw,1rem)] font-black text-white/20 uppercase tracking-[0.4em] font-mono mt-2">Placar Elite Pro</div>
        </div>
      </div>

      <div className="flex-1 lg:grid lg:grid-cols-12 gap-[max(2vw,24px)] h-full min-h-0 pt-2">
        <div className="col-span-8 flex flex-col gap-[max(2vh,16px)] h-full">
          {/* Main Scoreboard Area - James: Estética 10ft UI Premium */}
          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-[clamp(1.5rem,3vw,3rem)] flex flex-col justify-center relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden min-h-[52vh]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none opacity-50"></div>
            <div className={`absolute inset-0 opacity-10 bg-radial-gradient from-${arenaColor}-500/20 to-transparent pointer-events-none`}></div>

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
                  if (color.includes('blue')) return 'blue';
                  if (color.includes('red') || color.includes('rose')) return 'rose';
                  return 'indigo';
                };

                return (
                  <>
                    {/* James: Ambient Glows Dinâmicos */}
                    {leftServing && (
                       <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[40%] h-[80%] bg-radial-gradient from-${getTeamTheme(isSwitched ? 'red' : 'blue') === 'rose' ? 'rose' : 'blue'}-500/10 to-transparent blur-3xl ambient-glow`}></div>
                    )}
                    {rightServing && (
                       <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[40%] h-[80%] bg-radial-gradient from-${getTeamTheme(isSwitched ? 'blue' : 'red') === 'rose' ? 'rose' : 'red'}-500/10 to-transparent blur-3xl ambient-glow`}></div>
                    )}

                    {/* Time Esquerdo */}
                    <div className="flex-1 flex flex-col items-center relative z-10">
                      <div className="flex items-center gap-4 mb-2">
                        {leftServing && (
                          <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_25px_white] animate-pulse"></div>
                        )}
                        <h3 className={`text-[1.2vw] font-black uppercase tracking-[0.3em] ${leftServing ? 'text-white' : 'text-white/20'}`}>TIME A</h3>
                      </div>
                      <div className="h-[8vh] flex flex-col justify-center gap-2 mb-4">
                        {(leftTeam?.players || []).map((p: any, idx: number) => (
                           <div key={idx} className={`bg-white/[0.04] border border-white/5 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 w-full max-w-[22vw] shadow-lg transition-all`}>
                             <div className={`w-1 h-5 rounded-full ${leftServing ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/10'}`}></div>
                             <span className={`text-[clamp(0.9rem,1.3vw,1.8vw)] font-black uppercase tracking-tighter leading-none ${leftColor} truncate flex-1`}>
                               {typeof p === 'string' ? p : (p?.name || '---')}
                             </span>
                           </div>
                        ))}
                      </div>
                      <div key={`score-left-${leftTeam?.score}`} className="text-[clamp(8rem,17vw,22rem)] leading-[0.6] font-black tabular-nums drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] text-white score-change">{leftTeam?.score || 0}</div>
                    </div>

                    {/* James: CRONÔMETRO CENTRAL INTEGRADO */}
                    <div className="flex flex-col items-center gap-8 relative z-10 px-8">
                       <div className="flex flex-col items-center gap-2">
                          <div className="bg-white/5 px-6 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                             <span className="text-3xl font-mono font-black tabular-nums text-white/80">
                               {Math.floor((activeMatch?.matchTime || 0) / 60)}:{((activeMatch?.matchTime || 0) % 60).toString().padStart(2, '0')}
                             </span>
                          </div>
                          <div className="text-[10px] font-black text-white/10 italic tracking-[0.4em] uppercase">Partida</div>
                       </div>

                       <div className={`px-[clamp(2rem,5vw,5rem)] py-[clamp(1rem,3vh,4rem)] rounded-[3rem] border-4 flex flex-col items-center justify-center transition-all duration-300 ${currentTheme.glow} ${(tvAttackTime !== null && tvAttackTime <= 10) ? 'bg-red-600/30 border-red-500 animate-pulse scale-110 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-black/90 border-white/10'}`}>
                          <span className="text-[clamp(0.8rem,1vw,1.2rem)] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Posse</span>
                          <span className={`text-[clamp(5rem,10vw,12rem)] font-mono font-black tabular-nums leading-none ${(tvAttackTime !== null && tvAttackTime <= 10) ? 'text-red-500' : currentTheme.text}`}>
                            {displayAttackTime ?? 24}
                          </span>
                       </div>
                    </div>

                    {/* Time Direito */}
                    <div className="flex-1 flex flex-col items-center relative z-10">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className={`text-[1.2vw] font-black uppercase tracking-[0.3em] ${rightServing ? 'text-white' : 'text-white/20'}`}>TIME B</h3>
                        {rightServing && (
                          <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_25px_white] animate-pulse"></div>
                        )}
                      </div>
                      <div className="h-[8vh] flex flex-col justify-center gap-2 mb-4">
                        {(rightTeam?.players || []).map((p: any, idx: number) => (
                           <div key={idx} className={`bg-white/[0.04] border border-white/5 backdrop-blur-md px-4 py-2 rounded-xl flex flex-row-reverse items-center gap-3 w-full max-w-[22vw] shadow-lg transition-all`}>
                             <div className={`w-1 h-5 rounded-full ${rightServing ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/10'}`}></div>
                             <span className={`text-[clamp(0.9rem,1.3vw,1.8vw)] font-black uppercase tracking-tighter leading-none ${rightColor} text-right truncate flex-1`}>
                               {typeof p === 'string' ? p : (p?.name || '---')}
                             </span>
                           </div>
                        ))}
                      </div>
                      <div key={`score-right-${rightTeam?.score}`} className="text-[clamp(8rem,17vw,22rem)] leading-[0.6] font-black tabular-nums drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] text-white score-change">{rightTeam?.score || 0}</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Ranking Compacto - James: Glassmorphism Premium */}
          <div className={`bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 flex flex-col shadow-2xl relative overflow-hidden flex-1 min-h-0`}>
              <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent`}></div>
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
          <div className="flex-1 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden h-full">
            <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-white/40">Auditoria de partidas</h2>
            </div>
            
            {/* James: SISTEMA DE AUTO-SCROLL INDUSTRIAL - Mais lento e suave para produção */}
            <div className="flex-1 relative overflow-hidden">
              <style>{`
                @keyframes score-bounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); filter: brightness(1.5); }
          100% { transform: scale(1); }
        }
        .score-change { animation: score-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        
        @keyframes scrollList {
                  0% { transform: translateY(0); }
                  90% { transform: translateY(calc(-100% + 60vh)); }
                  100% { transform: translateY(0); }
                }
                .auto-scroll-list {
                  animation: scrollList ${historyMatches.length > 5 ? historyMatches.length * 4 : 0}s ease-in-out infinite;
                }
                .auto-scroll-list:hover {
                   animation-play-state: paused;
                }

                @keyframes ambient-pulse {
                  0% { transform: scale(1); opacity: 0.3; }
                  50% { transform: scale(1.1); opacity: 0.5; }
                  100% { transform: scale(1); opacity: 0.3; }
                }
                .ambient-glow {
                  animation: ambient-pulse 3s ease-in-out infinite;
                }
              `}</style>

              
              <div className={`${historyMatches.length > 5 ? 'auto-scroll-list' : ''} flex flex-col gap-2 py-2 px-1`}>
                {historyMatches.map((m: any, idx: number) => (
                  <div key={m.id} className={`flex items-center justify-between gap-4 p-4 rounded-2xl transition-all border group ${idx % 2 === 0 ? 'bg-white/[0.03] border-white/5' : 'bg-transparent border-transparent'}`}>
                     <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`text-[10px] font-black uppercase tracking-tighter truncate ${m.winner === 'A' ? 'text-white' : 'text-white/20'}`}>
                             {Array.isArray(m.teamA?.players) ? m.teamA.players.filter(Boolean).join(' / ') : '---'}
                           </span>
                        </div>
                        <div className={`h-[2px] w-full rounded-full ${m.winner === 'A' ? (m.teamA?.color === 'rose' ? 'bg-rose-600' : 'bg-blue-600') : 'bg-white/5'}`}></div>
                     </div>

                     <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-lg border border-white/5 shadow-inner">
                        <span className={`text-lg font-black tabular-nums ${m.winner === 'A' ? 'text-white' : 'text-white/20'}`}>{m.teamA?.score || 0}</span>
                        <span className="text-[8px] font-black text-white/5 italic">vs</span>
                        <span className={`text-lg font-black tabular-nums ${m.winner === 'B' ? 'text-white' : 'text-white/20'}`}>{m.teamB?.score || 0}</span>
                     </div>

                     <div className="flex flex-col flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-2 mb-1 justify-end">
                           <span className={`text-[10px] font-black uppercase tracking-tighter truncate ${m.winner === 'B' ? 'text-white' : 'text-white/20'}`}>
                             {Array.isArray(m.teamB?.players) ? m.teamB.players.filter(Boolean).join(' / ') : '---'}
                           </span>
                        </div>
                        <div className={`h-[2px] w-full rounded-full ${m.winner === 'B' ? (m.teamB?.color === 'rose' ? 'bg-rose-600' : 'bg-red-600') : 'bg-white/5'}`}></div>
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
