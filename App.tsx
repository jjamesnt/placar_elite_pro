import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import Navigation, { View } from './components/Navigation';
import OrientationLock from './components/OrientationLock';
import WelcomeModal from './components/WelcomeModal';
import ConfirmModal, { ModalType } from './components/ConfirmModal';
import Placar from './views/Placar';
import Atletas from './views/Atletas';
import Ranking from './views/Ranking';
import Historico from './views/Historico';
import Config from './views/Config';
import Admin from './views/Admin';
import TVView from './views/TVView';
import ClubManagement from './views/ClubManagement';
import Login from './views/Login';
import { supabase } from './lib/supabase';
import { warmUpAudioContext } from './hooks';

// James, normalize fora do componente para ser estável e não resetar o rádio
const normalize = (str: string) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();

export type SoundScheme = 'moderno' | 'classico' | 'intenso';

const Background: React.FC<{ color: ArenaColor }> = memo(({ color }) => {
  const bgMap: Record<ArenaColor, string> = {
    indigo: '#1e1b4b', blue: '#172554', emerald: '#064e3b', amber: '#451a03', rose: '#4c0519', violet: '#2e1065'
  };
  const glowMap: Record<ArenaColor, string> = {
    indigo: 'rgba(99, 102, 241, 0.45)', blue: 'rgba(59, 130, 246, 0.45)', emerald: 'rgba(16, 185, 129, 0.4)',
    amber: 'rgba(245, 158, 11, 0.4)', rose: 'rgba(244, 63, 94, 0.45)', violet: 'rgba(139, 92, 246, 0.45)'
  };
  return (
    <div className="fixed inset-0 -z-10 transition-colors duration-1000 ease-in-out" style={{ backgroundColor: bgMap[color] }}>
      <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-black/30"></div>
      <div className="absolute inset-0 transition-all duration-1000" style={{ background: `radial-gradient(circle at 50% 50%, ${glowMap[color]} 0%, transparent 85%)` }}></div>
    </div>
  );
});

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('view') === 'tv' || params.get('tv')) ? 'tv' : 'placar';
  });
  // James: ID único desta aba para evitar que outras abas interfiram na TV
  const senderId = useMemo(() => Math.random().toString(36).substring(7), []);
  const [lastUpdate, setLastUpdate] = useState<string>('--/-- --:--');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLicense, setUserLicense] = useState<UserLicense | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'welcome' | 'expiry'>('none');
  const modalFlowHandled = useRef(false);
  const [globalModal, setGlobalModal] = useState<{ isOpen: boolean; title: string; message: string; type?: ModalType; icon?: any; confirmLabel?: string; showCancel?: boolean; onConfirm?: () => void; }>({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = useCallback((title: string, message: string, type: ModalType = 'info', icon?: any) => setGlobalModal({ isOpen: true, title, message, type, icon, showCancel: false, onConfirm: () => setGlobalModal(prev => ({ ...prev, isOpen: false })) }), []);
  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, type: ModalType = 'warning', icon?: any) => setGlobalModal({ isOpen: true, title, message, type, icon, showCancel: true, onConfirm: () => { onConfirm(); setGlobalModal(prev => ({ ...prev, isOpen: false })); } }), []);

  const [arenas, setArenas] = useState<Arena[]>([]);
  const [currentArenaId, setCurrentArenaId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('arena') || params.get('tv') || 'default';
  });
  const currentArena: Arena = useMemo(() => arenas.find(a => a.id === currentArenaId) || arenas[0] || ({ id: 'default', name: 'Carregando...', color: 'indigo' as ArenaColor }), [arenas, currentArenaId]);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [deletedPlayers, setDeletedPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [winScore, setWinScore] = useState(15);
  const [attackTime, setAttackTime] = useState(24);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundScheme, setSoundScheme] = useState<SoundScheme>('moderno');
  const [capoteEnabled, setCapoteEnabled] = useState(true);
  const [vaiATresEnabled, setVaiATresEnabled] = useState(true);
  const [matchMode, setMatchMode] = useState<'normal' | 'set' | 'tempo'>('normal');
  const [matchTime, setMatchTime] = useState(12);

  const [rankingFilter, setRankingFilter] = useState<'Hoje' | 'Semanal' | 'Mensal' | 'Anual' | 'Total'>('Hoje');
  const [rankingViewDate, setRankingViewDate] = useState(new Date());

  const [teamA, setTeamA] = useState<Team>({ players: [undefined, undefined], score: 0, sets: 0 });
  const [teamB, setTeamB] = useState<Team>({ players: [undefined, undefined], score: 0, sets: 0 });
  const [servingTeam, setServingTeam] = useState<'A' | 'B'>('A');
  const [history, setHistory] = useState<{ teamA: Team; teamB: Team; servingTeam: 'A' | 'B' }[]>([]);
  const [isSidesSwitched, setIsSidesSwitched] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);

  const refreshData = useCallback(async () => {
    if (!session || !userLicense?.is_active || currentArenaId === 'default') return;
    try {
      // Busca jogadores APENAS da arena atual para evitar duplicados
      const { data: pData } = await supabase.from('players').select('*').eq('arena_id', currentArenaId);
      const { data: mData } = await supabase.from('matches').select('*').eq('arena_id', currentArenaId).order('created_at', { ascending: false }).limit(50);

      if (pData) {
        setPlayers(pData.filter((p: any) => !p.deleted_at).sort((a, b) => a.name.localeCompare(b.name)));
        setDeletedPlayers(pData.filter((p: any) => p.deleted_at).sort((a, b) => a.name.localeCompare(b.name)));
      }
      if (mData) {
        setMatches(mData.map((m: any) => ({ ...m.data_json, id: m.id, arena_id: m.arena_id?.toLowerCase(), timestamp: new Date(m.created_at) })));
      }
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) { console.error("Refresh Error:", err); }
  }, [session, userLicense, currentArenaId]);

  // LÓGICA DE SINCRONISMO SUPREMA (TABLET -> TV)
  const dataRef = useRef({ arenas, players, matches, teamA, teamB, servingTeam, gameStartTime, currentArenaId });
  useEffect(() => { dataRef.current = { arenas, players, matches, teamA, teamB, servingTeam, gameStartTime, currentArenaId }; }, [arenas, players, matches, teamA, teamB, servingTeam, gameStartTime, currentArenaId]);

  const tvSyncChannelRef = useRef<any>(null);
  const [tvModals, setTvModals] = useState<{ victoryData: any, showVaiATres: boolean }>({ victoryData: null, showVaiATres: false });
  const [tvAttackTime, setTvAttackTime] = useState<number | null>(null);
  const [tvLayoutMirrored, setTvLayoutMirrored] = useState<boolean>(false); // James: Novo estado para inversão prática de layout

  // James: Função agora lê diretamente dos estados para evitar o 'pulo de frame' que causava a oscilação
  const calculateSnapshot = useCallback(() => {
      const ars = arenas;
      const p = players;
      const m = matches;
      const tA = teamA;
      const tB = teamB;
      const sT = servingTeam;
      const gS = gameStartTime;
      const cA = currentArenaId;
      
      const curArena = ars.find(a => a.id === cA);
      const arenaMatches = m.filter(match => match.arena_id?.toLowerCase() === cA?.toLowerCase());
      
      // Criar mapa de nomes para busca ultra-rápida (O(1))
      const nameMap = new Map();
      p.forEach(pl => nameMap.set(pl.id, pl.name));

      // James: Filtra apenas partidas do dia atual — igual ao filtro 'Hoje' do tablet
      const today = new Date().toDateString();
      const todayMatches = arenaMatches.filter(match => new Date(match.timestamp).toDateString() === today);

      const playerStats = new Map<string, { wins: number, games: number, name: string }>();
      todayMatches.forEach(match => {
          const winner = match.winner === 'A' ? match.teamA : match.teamB;
          [match.teamA, match.teamB].forEach(t => { t.players.forEach(pl => {
              if (pl && !playerStats.has(pl.id)) playerStats.set(pl.id, { wins: 0, games: 0, name: nameMap.get(pl.id) || pl.name });
              const ps = pl ? playerStats.get(pl.id) : null;
              if (ps) {
                ps.games++;
                if (winner.players.some(wp => wp && wp.id === pl.id)) ps.wins++;
              }
          });});
      });

      const ranking = Array.from(playerStats.values())
        .sort((a, b) => b.wins - a.wins || (b.wins/b.games) - (a.wins/a.games) || a.name.localeCompare(b.name))
        .slice(0, 5);

      const history = todayMatches.slice(0, 20).map(match => ({
          id: match.id,
          teamA: { score: match.teamA.score, players: match.teamA.players.map((plyr: any) => nameMap.get(plyr?.id) || plyr?.name || '---') },
          teamB: { score: match.teamB.score, players: match.teamB.players.map((plyr: any) => nameMap.get(plyr?.id) || plyr?.name || '---') },
          winner: match.winner
      }));

      return {
        senderId, 
        arenaId: cA?.toLowerCase(),
        arenaSlug: normalize(curArena?.name || ''),
        arenaName: curArena?.name || 'ARENA',
        activeMatch: { 
          teamA: tA, teamB: tB, servingTeam: sT, gameStartTime: gS, status: 'playing',
          modals: tvModals,
          attackTime: tvAttackTime,
          isSidesSwitched: isSidesSwitched,
          layoutMirrored: tvLayoutMirrored // James: Enviando a preferência de layout para a TV
        },
        ranking,
        history
      };
  }, [tvModals, matches, arenas, players, teamA, teamB, servingTeam, gameStartTime, currentArenaId, senderId, isSidesSwitched, tvLayoutMirrored]); // James: Adicionado tvLayoutMirrored às dependências

  const [channelStatus, setChannelStatus] = useState<'connecting' | 'online' | 'offline'>('offline');

  const initializedArenaId = useRef<string | null>(null);
  useEffect(() => {
    if (currentArenaId === 'default') return;
    
    // James: ESCUDO V6 - Só reseta a rádio se a arena mudar DE VERDADE
    if (initializedArenaId.current === currentArenaId && tvSyncChannelRef.current) return;
    initializedArenaId.current = currentArenaId;

    const normalizedId = currentArenaId.toLowerCase().replace(/-/g, '');
    const channelName = `sync_arena_${normalizedId}`;
    
    if (tvSyncChannelRef.current) supabase.removeChannel(tvSyncChannelRef.current);
    
    console.log("Tablet: Ligando Rádio Blindado V6 na frequência:", channelName);
    const channel = supabase.channel(channelName);
    tvSyncChannelRef.current = channel;
    
    channel.subscribe((status) => {
      const isOnline = status === 'SUBSCRIBED';
      setChannelStatus(isOnline ? 'online' : 'connecting');
      if (isOnline) {
        channel.send({ type: 'broadcast', event: 'TV_SYNC', payload: calculateSnapshot() });
      }
    });

    return () => { 
       // James: Não removemos o canal no Cleanup para manter a rádio viva durante trocas rápidas de view
    };
  }, [currentArenaId]);

  // 2. Transmissão Imediata (Triggered)
  useEffect(() => {
    if (tvSyncChannelRef.current) {
      tvSyncChannelRef.current.send({
        type: 'broadcast', event: 'TV_SYNC',
        payload: calculateSnapshot()
      });
    }
  }, [teamA.score, teamB.score, servingTeam, players, matches, calculateSnapshot, isSidesSwitched, tvLayoutMirrored]); // James: Disparo imediato na troca de layout

  // 2.2 Canal de Ataque - James: Enviando APENAS os segundos de posse de forma ultra-leve
  useEffect(() => {
    if (tvSyncChannelRef.current && tvAttackTime !== null) {
       tvSyncChannelRef.current.send({
         type: 'broadcast', event: 'TV_ATTACK',
         payload: { attackTime: tvAttackTime }
       });
    }
  }, [tvAttackTime]);

  // James: Se os modais mudarem, envia NA HORA um pacote especial "TV_MODAL" para garantir que a TV abra a tela
  useEffect(() => {
    if (tvSyncChannelRef.current && (tvModals.victoryData || tvModals.showVaiATres)) {
       tvSyncChannelRef.current.send({
         type: 'broadcast', event: 'TV_MODAL',
         payload: tvModals
       });
    }
  }, [tvModals]);

  // 3. Batimento de Segurança (Heartbeat) V7 - ESTABILIZADO (Ref)
  const snapshotRef = useRef(calculateSnapshot);
  useEffect(() => { snapshotRef.current = calculateSnapshot; }, [calculateSnapshot]);

  useEffect(() => {
    console.log("Tablet: Iniciando batimento de segurança imortal (3s)...");
    const interval = setInterval(() => {
      if (tvSyncChannelRef.current) {
        tvSyncChannelRef.current.send({
          type: 'broadcast', event: 'TV_SYNC',
          payload: snapshotRef.current()
        });
      }
    }, 1500); // James: Reduzido de 3s para 1.5s - TV sintoniza mais rápido
    return () => clearInterval(interval);
  }, []); // James: Zero dependências - o batimento nunca morre nem reseta!

  // Link Auto desativado conforme solicitado


  const handleLogout = useCallback(async () => {
    setSession(null); setUserLicense(null); setActiveModal('none'); modalFlowHandled.current = false;
    localStorage.clear(); sessionStorage.clear(); await supabase.auth.signOut();
  }, []);

  const checkLicense = useCallback(async (userId: string, email: string) => {
    try {
      if (modalFlowHandled.current) return;
      const { data } = await supabase.from('user_licenses').select('*').eq('email', email.toLowerCase()).maybeSingle();
      if (data) {
        let updatedData = data;
        if (!data.user_id) {
          const { data: newData, error: updateError } = await supabase.from('user_licenses').update({ user_id: userId }).eq('id', data.id).select().single();
          if (!updateError && newData) updatedData = newData;
        }
        setUserLicense(updatedData);
        const welcomeDone = localStorage.getItem('elite_welcome_done') === 'true';
        if (updatedData.is_active && email.toLowerCase() !== 'jjamesnt@gmail.com') {
          if (!updatedData.first_access_done && !welcomeDone) setActiveModal('welcome');
        }
      } else {
        const expiry = new Date(); expiry.setDate(expiry.getDate() + 30);
        await supabase.from('user_licenses').insert([{ user_id: userId, email: email.toLowerCase(), is_active: false, expires_at: expiry.toISOString(), first_access_done: false }]);
      }
    } catch (err) { console.error("Erro licenca:", err); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleSession = (session: any) => {
      setSession(session);
      if (session?.user) {
        const email = session.user.email.toLowerCase();
        setIsAdmin(email === 'jjamesnt@gmail.com' || email.includes('jamesrizo') || email === 'jamesrizo@gmail.com');
        checkLicense(session.user.id, session.user.email);
      } else setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    return () => subscription.unsubscribe();
  }, [checkLicense]);

  useEffect(() => {
    if (!session && currentView !== 'tv') return;

    const fetchArenas = async () => {
      const { data } = await supabase.from('arenas').select('*').order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setArenas(data);
        const lastArena = localStorage.getItem('elite_last_arena');
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('arena') || params.get('tv');
        const isAuto = params.get('tv') === 'auto';
        
        // James: Se for Modo Auto, ele tenta pegar o último grupo ativo para não começar em branco
        if (isAuto && params.get('master')) {
             const fallbackId = (lastArena && data.find(a => a.id === lastArena)?.id) || data[0].id;
             setCurrentArenaId(fallbackId);
             return;
        }

        let resolvedArena = data.find(a => a.id === urlId);
        if (!resolvedArena && urlId) {
            resolvedArena = data.find(a => normalize(a.name) === normalize(urlId));
        }
        
        const finalId = resolvedArena?.id || (lastArena && data.find(a => a.id === lastArena)?.id) || data[0].id;
        setCurrentArenaId(finalId);
      }
    };
    fetchArenas();
  }, [session, userLicense]);

  const handleResetGame = useCallback((fullReset: boolean = false) => {
    const clearSetResults = () => {
      setTeamA(prev => ({ 
        ...prev, 
        score: 0, 
        sets: fullReset ? 0 : prev.sets,
        players: fullReset ? [null, null] : prev.players // James: Limpa nomes se for Reset de Partida
      }));
      setTeamB(prev => ({ 
        ...prev, 
        score: 0, 
        sets: fullReset ? 0 : prev.sets,
        players: fullReset ? [null, null] : prev.players // James: Limpa nomes se for Reset de Partida
      }));
      setHistory([]);
      setGameStartTime(null);
      setTvModals({ victoryData: null, showVaiATres: false });
    };

    if (fullReset) {
      if (showConfirm) {
        showConfirm("Zerar Partida", "Deseja realmente zerar todos os pontos e sets?", () => {
          clearSetResults();
        });
      } else {
        clearSetResults();
      }
    } else {
      clearSetResults();
    }
  }, [showConfirm]);

  useEffect(() => {
    if (currentArenaId !== 'default' && userLicense?.is_active) {
      refreshData();
      const prefix = `elite_arena_${currentArenaId}_`;
      setWinScore(Number(localStorage.getItem(`${prefix}winScore`)) || 15);
      localStorage.setItem('elite_last_arena', currentArenaId);
    }
  }, [currentArenaId, session, refreshData, userLicense]);

  const handleSaveMatch = async (matchData: Omit<Match, 'id' | 'timestamp'>) => {
    if (!session || currentArenaId === 'default') return;
    
    // James: SINCRO INSTANTÂNEO. Adicionamos a partida localmente primeiro
    const newMatch = { ...matchData, id: 'temp-' + Date.now(), arena_id: currentArenaId, created_at: new Date().toISOString() };
    setMatches(prev => [newMatch, ...prev]);
    
    // James: setTimeout(0) garante que o React processou o setMatches antes de enviar o snapshot
    // Assim a TV recebe a auditoria JÁ com a nova partida incluída
    setTimeout(() => {
      if (tvSyncChannelRef.current) {
        tvSyncChannelRef.current.send({
          type: 'broadcast', event: 'TV_SYNC',
          payload: calculateSnapshot()
        });
      }
    }, 0);

    const { data } = await supabase.from('matches').insert([{ arena_id: currentArenaId, user_id: session.user.id, data_json: matchData }]).select().single();
    if (data) refreshData();
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!session?.user?.id) return;
    try {
      setMatches(prev => prev.filter(m => m.id !== matchId));
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao deletar partida:", err);
      if (showAlert) showAlert("Erro ao Deletar", "Não foi possível remover do servidor. Verifique sua conexão.", 'danger', 'alert');
    }
  };

  const handleUpdateMatch = async (matchId: string, updatedData: Omit<Match, 'id' | 'timestamp'>) => {
    if (!session?.user?.id) return;
    try {
      const { error } = await supabase.from('matches').update({ data_json: updatedData }).eq('id', matchId);
      if (error) throw error;
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updatedData } : m));
    } catch (err) {
      console.error("Erro ao atualizar partida:", err);
      if (showAlert) showAlert("Erro ao Salvar", "Não foi possível salvar as alterações. Verifique sua conexão.", 'danger', 'alert');
    }
  };

  const handleSaveSettings = useCallback(() => {
    if (currentArenaId === 'default') return;
    const prefix = `elite_arena_${currentArenaId}_`;
    localStorage.setItem(`${prefix}winScore`, winScore.toString());
    localStorage.setItem(`${prefix}attackTime`, attackTime.toString());
    localStorage.setItem(`${prefix}soundEnabled`, soundEnabled.toString());
    localStorage.setItem(`${prefix}vibrationEnabled`, vibrationEnabled.toString());
    localStorage.setItem(`${prefix}soundScheme`, soundScheme);
    localStorage.setItem(`${prefix}capoteEnabled`, capoteEnabled.toString());
    localStorage.setItem(`${prefix}vaiATresEnabled`, vaiATresEnabled.toString());
    localStorage.setItem(`${prefix}matchMode`, matchMode);
    localStorage.setItem(`${prefix}matchTime`, matchTime.toString());
    localStorage.setItem(`${prefix}tvLayoutMirrored`, tvLayoutMirrored.toString());
    refreshData();
  }, [currentArenaId, winScore, attackTime, soundEnabled, vibrationEnabled, soundScheme, capoteEnabled, vaiATresEnabled, matchMode, matchTime, tvLayoutMirrored, refreshData]);

  const handleAddArena = async (name: string, color: ArenaColor) => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from('arenas').insert([{ name, color, user_id: session.user.id }]).select().single();
      if (error) throw error;
      if (data) setArenas(prev => [...prev, data]);
    } catch (err) { console.error("Erro ao adicionar arena:", err); }
  };

  const handleUpdateArena = async (id: string, name: string, color: ArenaColor) => {
    try {
      const { error } = await supabase.from('arenas').update({ name, color }).eq('id', id);
      if (error) throw error;
      setArenas(prev => prev.map(a => a.id === id ? { ...a, name, color } : a));
    } catch (err) { console.error("Erro ao atualizar arena:", err); }
  };

  const handleDeleteArena = async (id: string) => {
    try {
      const { error } = await supabase.from('arenas').delete().eq('id', id);
      if (error) throw error;
      setArenas(prev => prev.filter(a => a.id !== id));
      if (currentArenaId === id) setCurrentArenaId(arenas.find(a => a.id !== id)?.id || 'default');
    } catch (err) { console.error("Erro ao deletar arena:", err); }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#030712]"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session && currentView !== 'tv') return <><Background color="indigo" /><Login onLogin={() => { }} /></>;

  return (
    <>
      <OrientationLock />
      {activeModal === 'welcome' && <WelcomeModal onConfirm={() => {}} />}
      <Background color={(currentArena.color || 'indigo') as ArenaColor} />
      <div className="h-screen w-screen flex flex-col text-white font-sans overflow-hidden bg-transparent">
        {currentView !== 'tv' && (
            <Navigation currentView={currentView} onNavigate={setCurrentView} lastUpdate={lastUpdate} currentArena={currentArena} onLogout={handleLogout} isAdmin={isAdmin} isClub={userLicense?.is_club} showConfirm={showConfirm} channelStatus={channelStatus} />
        )}
        <main className={`flex-1 ${currentView !== 'tv' ? 'overflow-y-auto' : ''}`}>
          {currentView === 'placar' && <Placar allPlayers={players} onSaveGame={handleSaveMatch} winScore={winScore} setWinScore={setWinScore} attackTime={attackTime} soundEnabled={soundEnabled} vibrationEnabled={vibrationEnabled} soundScheme={soundScheme} currentArena={currentArena} teamA={teamA} setTeamA={setTeamA} teamB={teamB} setTeamB={setTeamB} servingTeam={servingTeam} setServingTeam={setServingTeam} history={history} setHistory={setHistory} isSidesSwitched={isSidesSwitched} setIsSidesSwitched={setIsSidesSwitched} gameStartTime={gameStartTime} setGameStartTime={setGameStartTime} resetGame={handleResetGame} capoteEnabled={capoteEnabled} vaiATresEnabled={vaiATresEnabled} matchMode={matchMode} matchTime={matchTime} showAlert={showAlert} showConfirm={showConfirm} setTvModals={setTvModals} setTvAttackTime={setTvAttackTime} />}
          {currentView === 'historico' && <Historico matches={matches} setMatches={setMatches} currentArena={currentArena} onClearMatches={() => {}} onUpdateMatch={handleUpdateMatch} players={players} showAlert={showAlert} showConfirm={showConfirm} onDeleteMatch={handleDeleteMatch} />}
          {currentView === 'atletas' && <Atletas players={players} setPlayers={setPlayers} deletedPlayers={deletedPlayers} setDeletedPlayers={setDeletedPlayers} arenaId={currentArenaId} userId={session?.user?.id} athletesLimit={userLicense?.athletes_limit} showAlert={showAlert} showConfirm={showConfirm} />}
          {currentView === 'tv' && <TVView arenaId={currentArenaId} />}
          {currentView === 'ranking' && <Ranking players={players} matches={matches} arenaName={currentArena.name} arenaColor={currentArena.color} filter={rankingFilter} setFilter={setRankingFilter} viewDate={rankingViewDate} setViewDate={setRankingViewDate} onClearMatches={() => {}} showAlert={showAlert} />}
          {currentView === 'config' && <Config winScore={winScore} setWinScore={setWinScore} attackTime={attackTime} setAttackTime={setAttackTime} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} vibrationEnabled={vibrationEnabled} setVibrationEnabled={setVibrationEnabled} soundScheme={soundScheme} setSoundScheme={setSoundScheme} capoteEnabled={capoteEnabled} setCapoteEnabled={setCapoteEnabled} vaiATresEnabled={vaiATresEnabled} setVaiATresEnabled={setVaiATresEnabled} matchMode={matchMode} setMatchMode={setMatchMode} matchTime={matchTime} setMatchTime={setMatchTime} arenas={arenas} currentArenaId={currentArenaId} setCurrentArenaId={setCurrentArenaId} onAddArena={handleAddArena} onUpdateArena={handleUpdateArena} onDeleteArena={handleDeleteArena} onLogout={handleLogout} onSaveSettings={handleSaveSettings} userLicense={userLicense} onRefreshLicense={() => checkLicense(session?.user?.id, session?.user?.email)} isAdmin={isAdmin} currentArena={currentArena} showAlert={showAlert} showConfirm={showConfirm} tvLayoutMirrored={tvLayoutMirrored} setTvLayoutMirrored={setTvLayoutMirrored} />}
          {currentView === 'admin' && isAdmin && <Admin showAlert={showAlert} showConfirm={showConfirm} />}
          {currentView === 'clube' && userLicense && <ClubManagement ownerLicense={userLicense} onRefresh={() => checkLicense(session.user.id, session.user.email)} showAlert={showAlert} showConfirm={showConfirm} />}
        </main>
      </div>
      <ConfirmModal isOpen={globalModal.isOpen && currentView !== 'tv'} title={globalModal.title} message={globalModal.message} type={globalModal.type} icon={globalModal.icon} confirmLabel={globalModal.confirmLabel} showCancel={globalModal.showCancel} onConfirm={globalModal.onConfirm || (() => {})} onCancel={() => setGlobalModal(prev => ({ ...prev, isOpen: false }))} />
    </>
  );
};

export default App;
