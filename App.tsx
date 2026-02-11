
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Navigation, { View } from './components/Navigation';
import OrientationLock from './components/OrientationLock';
import WelcomeModal from './components/WelcomeModal';
import LicenseExpiryModal from './components/LicenseExpiryModal';
import Placar from './views/Placar';
import Atletas from './views/Atletas';
import Ranking from './views/Ranking';
import Historico from './views/Historico';
import Config from './views/Config';
import Admin from './views/Admin';
import Login from './views/Login';
import ChangePassword from './views/ChangePassword';
import { Player, Match, Arena, ArenaColor, UserLicense, Team } from './types';
import { supabase } from './lib/supabase';
import { ShieldIcon } from './components/icons';
import { warmUpAudioContext } from './hooks';

export type SoundScheme = 'moderno' | 'classico' | 'intenso';

const Background: React.FC<{ color: ArenaColor }> = ({ color }) => {
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
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>('placar');
  const [lastUpdate, setLastUpdate] = useState<string>('--/-- --:--');
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [userLicense, setUserLicense] = useState<UserLicense | null>(null);

  const [activeModal, setActiveModal] = useState<'none' | 'welcome' | 'expiry'>('none');
  const modalFlowHandled = useRef(false);

  const [arenas, setArenas] = useState<Arena[]>([]);
  const [currentArenaId, setCurrentArenaId] = useState<string>('default');

  const currentArena: Arena = useMemo(() => arenas.find(a => a.id === currentArenaId) || arenas[0] || ({ id: 'default', name: 'Carregando...', color: 'indigo' as ArenaColor }), [arenas, currentArenaId]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [deletedPlayers, setDeletedPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Game settings state
  const [winScore, setWinScore] = useState(15);
  const [attackTime, setAttackTime] = useState(24);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundScheme, setSoundScheme] = useState<SoundScheme>('moderno');
  const [capoteEnabled, setCapoteEnabled] = useState(true);
  const [vaiATresEnabled, setVaiATresEnabled] = useState(true);

  // Game state lifted from Placar.tsx
  const [teamA, setTeamA] = useState<Team>({ players: [undefined, undefined], score: 0 });
  const [teamB, setTeamB] = useState<Team>({ players: [undefined, undefined], score: 0 });
  const [servingTeam, setServingTeam] = useState<'A' | 'B'>('A');
  const [history, setHistory] = useState<{ teamA: Team; teamB: Team; servingTeam: 'A' | 'B' }[]>([]);
  const [isSidesSwitched, setIsSidesSwitched] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);

  // Ranking state persistence
  const [rankingFilter, setRankingFilter] = useState<'Hoje' | 'Semanal' | 'Mensal' | 'Anual' | 'Total'>('Hoje');
  const [rankingViewDate, setRankingViewDate] = useState(new Date());

  const handleLogout = useCallback(async () => {
    setSession(null);
    setUserLicense(null);
    setActiveModal('none');
    modalFlowHandled.current = false;
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
  }, []);

  const checkLicense = useCallback(async (userId: string, email: string) => {
    try {
      if (modalFlowHandled.current) return;
      const welcomeDone = localStorage.getItem('elite_welcome_done') === 'true';
      const expiryShown = sessionStorage.getItem('expiry_modal_shown') === 'true';

      const { data } = await supabase.from('user_licenses').select('*').eq('email', email.toLowerCase()).maybeSingle();

      if (data) {
        setUserLicense(data);
        const isMaster = email.toLowerCase() === 'jjamesnt@gmail.com';

        if (data.is_active && !isMaster) {
          if (!data.first_access_done && !welcomeDone) setActiveModal('welcome');
          else if (!expiryShown) setActiveModal('expiry');
        }
      } else {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        await supabase.from('user_licenses').insert([{ user_id: userId, email: email.toLowerCase(), is_active: false, expires_at: expiry.toISOString(), first_access_done: false }]);
      }
    } catch (err) { console.error("Erro licença:", err); }
  }, []);

  const handleFirstAccessConfirm = async () => {
    if (!userLicense) return;
    warmUpAudioContext();
    localStorage.setItem('elite_welcome_done', 'true');

    const expiryShown = sessionStorage.getItem('expiry_modal_shown') === 'true';
    if (!expiryShown) setActiveModal('expiry');
    else { setActiveModal('none'); modalFlowHandled.current = true; }

    await supabase.from('user_licenses').update({ first_access_done: true }).eq('id', userLicense.id);
    setUserLicense(prev => prev ? { ...prev, first_access_done: true } : null);
  };

  const handleExpiryModalClose = () => {
    warmUpAudioContext();
    setActiveModal('none');
    modalFlowHandled.current = true;
    sessionStorage.setItem('expiry_modal_shown', 'true');
  };

  const refreshData = useCallback(async () => {
    if (!session || currentArenaId === 'default' || !userLicense?.is_active) return;
    try {
      const { data: pData } = await supabase.from('players').select('*').eq('arena_id', currentArenaId);
      const { data: mData } = await supabase.from('matches').select('*').eq('arena_id', currentArenaId).order('created_at', { ascending: false });

      if (pData) {
        setPlayers(pData.filter((p: any) => !p.deleted_at).sort((a, b) => a.name.localeCompare(b.name)));
        setDeletedPlayers(pData.filter((p: any) => p.deleted_at).sort((a, b) => a.name.localeCompare(b.name)));
      }
      if (mData) {
        setMatches(mData.map((m: any) => ({ ...m.data_json, id: m.id, timestamp: new Date(m.created_at) })));
      }
      setLastUpdate(new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }));
    } catch (err) { console.error("Refresh Error:", err); }
  }, [session, currentArenaId, userLicense]);

  const resetGame = useCallback((fullReset = false) => {
    setTeamA(prev => ({ ...prev, score: 0 }));
    setTeamB(prev => ({ ...prev, score: 0 }));
    setServingTeam('A');
    setHistory([]);
    setGameStartTime(null);
    if (fullReset) {
      setTeamA({ players: [undefined, undefined], score: 0 });
      setTeamB({ players: [undefined, undefined], score: 0 });
      setIsSidesSwitched(false);
      const prefix = `elite_arena_${currentArenaId}_`;
      setWinScore(Number(localStorage.getItem(`${prefix}winScore`)) || 15);
    }
  }, [currentArenaId]);

  useEffect(() => {
    const handleSession = (session: any) => {
      setSession(session);
      if (session?.user) {
        setIsAdmin(session.user.email.toLowerCase() === 'jjamesnt@gmail.com');
        setMustChangePassword(!!session.user.user_metadata?.must_change_password);
        checkLicense(session.user.id, session.user.email);
      } else setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    return () => subscription.unsubscribe();
  }, [checkLicense]);

  useEffect(() => { if (userLicense || !session) setLoading(false); }, [userLicense, session]);

  useEffect(() => {
    if (!session || !userLicense?.is_active) return;
    const fetchArenas = async () => {
      try {
        const { data } = await supabase.from('arenas').select('*').order('created_at', { ascending: true });
        if (data && data.length > 0) {
          setArenas(data);
          const lastArena = localStorage.getItem('elite_last_arena');
          const targetArena = (lastArena && data.find(a => a.id === lastArena)) ? lastArena : data[0].id;
          setCurrentArenaId(targetArena);
        } else {
          const { data: newArena } = await supabase.from('arenas').insert([{ name: 'Arena Principal', color: 'indigo' as ArenaColor, user_id: session.user.id }]).select().single();
          if (newArena) { setArenas([newArena]); setCurrentArenaId(newArena.id); }
        }
      } catch (e) { console.error("Erro Arenas:", e); }
    };
    fetchArenas();
  }, [session, userLicense]);

  useEffect(() => {
    if (currentArenaId !== 'default' && userLicense?.is_active) {
      refreshData();
      const prefix = `elite_arena_${currentArenaId}_`;
      setWinScore(Number(localStorage.getItem(`${prefix}winScore`)) || 15);
      setAttackTime(Number(localStorage.getItem(`${prefix}attackTime`)) || 24);
      setSoundEnabled(localStorage.getItem(`${prefix}soundEnabled`) !== 'false');
      setVibrationEnabled(localStorage.getItem(`${prefix}vibrationEnabled`) !== 'false');
      setSoundScheme((localStorage.getItem(`${prefix}soundScheme`) as SoundScheme) || 'moderno');
      setCapoteEnabled(localStorage.getItem(`${prefix}capoteEnabled`) !== 'false');
      setVaiATresEnabled(localStorage.getItem(`${prefix}vaiATresEnabled`) !== 'false');
      localStorage.setItem('elite_last_arena', currentArenaId);
    }
  }, [currentArenaId, session, refreshData, userLicense]);

  useEffect(() => {
    if (!userLicense?.is_active || currentArenaId === 'default') {
      return;
    }

    const channel = supabase.channel(`arena-${currentArenaId}-changes`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `arena_id=eq.${currentArenaId}` },
      () => refreshData()
    ).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `arena_id=eq.${currentArenaId}` },
      () => refreshData()
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentArenaId, userLicense]);

  // Audio warm-up and interaction listeners (Move out of dead code)
  useEffect(() => {
    const handleUserInteraction = () => {
      warmUpAudioContext();
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction, { capture: true });
    window.addEventListener('touchstart', handleUserInteraction, { capture: true });
    window.addEventListener('keydown', handleUserInteraction, { capture: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction, { capture: true });
      window.removeEventListener('touchstart', handleUserInteraction, { capture: true });
      window.removeEventListener('keydown', handleUserInteraction, { capture: true });
    };
  }, []);


  const handleSaveMatch = async (matchData: Omit<Match, 'id' | 'timestamp'>) => {
    if (!session || currentArenaId === 'default') return;
    const { data } = await supabase.from('matches').insert([{ arena_id: currentArenaId, user_id: session.user.id, data_json: matchData }]).select().single();
    if (data) {
      resetGame(true);
      refreshData();
    }
  };

  const handleClearMatches = async (mode: 'all' | 'day', date?: Date) => {
    if (!session || currentArenaId === 'default') return;

    let query = supabase.from('matches').delete().eq('arena_id', currentArenaId);

    if (mode === 'day' && date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    }

    const { error } = await query;
    if (!error) {
      refreshData();
      if (mode === 'all') resetGame(true);
    }
  };

  const handleAddArena = async (name: string, color: ArenaColor) => {
    if (!session) return;
    const { data } = await supabase.from('arenas').insert([{ name, color, user_id: session.user.id }]).select().single();
    if (data) { setArenas(prev => [...prev, data]); setCurrentArenaId(data.id); }
  };

  const handleUpdateArena = async (id: string, name: string, color: ArenaColor) => {
    const { data } = await supabase.from('arenas').update({ name, color }).eq('id', id).select().single();
    if (data) setArenas(prev => prev.map(a => a.id === id ? data : a));
  };

  const handleDeleteArena = async (id: string) => {
    if (!window.confirm("Excluir este grupo?")) return;
    const { error } = await supabase.from('arenas').delete().eq('id', id);
    if (!error) {
      setArenas(prev => prev.filter(a => a.id !== id));
      if (currentArenaId === id) setCurrentArenaId(arenas[0]?.id || 'default');
    }
  };

  const handleSaveSettings = () => {
    if (currentArenaId === 'default') return;
    const prefix = `elite_arena_${currentArenaId}_`;
    localStorage.setItem(`${prefix}winScore`, String(winScore));
    localStorage.setItem(`${prefix}attackTime`, String(attackTime));
    localStorage.setItem(`${prefix}soundEnabled`, String(soundEnabled));
    localStorage.setItem(`${prefix}vibrationEnabled`, String(vibrationEnabled));
    localStorage.setItem(`${prefix}soundScheme`, soundScheme);
    localStorage.setItem(`${prefix}capoteEnabled`, String(capoteEnabled));
    localStorage.setItem(`${prefix}vaiATresEnabled`, String(vaiATresEnabled));
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#030712]"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session) return <><Background color="indigo" /><Login onLogin={() => { }} /></>;
  if (mustChangePassword) return <ChangePassword onComplete={() => setMustChangePassword(false)} />;

  const isMaster = session?.user?.email?.toLowerCase() === 'jjamesnt@gmail.com';
  const isExpired = userLicense && new Date(userLicense.expires_at).getTime() < Date.now();
  const isBlocked = !isMaster && (!userLicense || !userLicense.is_active);

  if (isBlocked || (userLicense && isExpired)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-8 bg-[#030712] text-center">
        <Background color="rose" />
        <div className="mb-10 animate-in fade-in zoom-in duration-700">
          <img
            src="/logo.png"
            alt="Placar Elite Pro"
            className="h-24 sm:h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">{isBlocked ? 'Aguardando Aprovação' : 'Acesso Expirado'}</h1>
        <p className="text-white/40 max-w-md font-bold uppercase tracking-widest text-[10px] leading-relaxed mb-10">
          {isBlocked ? 'Sua solicitação de acesso foi enviada. O administrador mestre analisará seu perfil para ativação da licença.' : 'Seu período de licença expirou. Renove seu plano para continuar tendo acesso total aos recursos.'}
          <br /><br /> Fale com o suporte para liberação imediata.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <a href="https://wa.me/5531984211900" target="_blank" className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 text-center">Falar com Suporte</a>
          <button onClick={handleLogout} className="text-white/20 hover:text-white font-black uppercase text-[10px] tracking-widest py-4">Sair da Conta</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <OrientationLock />

      {activeModal === 'welcome' && <WelcomeModal onConfirm={handleFirstAccessConfirm} />}
      {activeModal === 'expiry' && userLicense && <LicenseExpiryModal expiryDate={userLicense.expires_at} onConfirm={handleExpiryModalClose} />}

      <Background color={(currentArena.color || 'indigo') as ArenaColor} />
      <div className="h-screen w-screen flex flex-col text-white font-sans overflow-hidden bg-transparent">
        <Navigation currentView={currentView} onNavigate={setCurrentView} lastUpdate={lastUpdate} currentArena={currentArena} onLogout={handleLogout} isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto">
          {currentView === 'placar' && <Placar allPlayers={players} onSaveGame={handleSaveMatch} winScore={winScore} setWinScore={setWinScore} attackTime={attackTime} soundEnabled={soundEnabled} vibrationEnabled={vibrationEnabled} soundScheme={soundScheme} currentArena={currentArena} teamA={teamA} setTeamA={setTeamA} teamB={teamB} setTeamB={setTeamB} servingTeam={servingTeam} setServingTeam={setServingTeam} history={history} setHistory={setHistory} isSidesSwitched={isSidesSwitched} setIsSidesSwitched={setIsSidesSwitched} gameStartTime={gameStartTime} setGameStartTime={setGameStartTime} resetGame={resetGame} capoteEnabled={capoteEnabled} vaiATresEnabled={vaiATresEnabled} />}
          {currentView === 'historico' && <Historico matches={matches} setMatches={setMatches} currentArena={currentArena} onClearMatches={handleClearMatches} />}
          {currentView === 'atletas' && <Atletas players={players} setPlayers={setPlayers} deletedPlayers={deletedPlayers} setDeletedPlayers={setDeletedPlayers} arenaId={currentArenaId} userId={session?.user?.id} />}
          {currentView === 'ranking' && (
            <Ranking
              players={players}
              matches={matches}
              arenaName={currentArena.name}
              arenaColor={currentArena.color}
              filter={rankingFilter}
              setFilter={setRankingFilter}
              viewDate={rankingViewDate}
              setViewDate={setRankingViewDate}
              onClearMatches={handleClearMatches}
            />
          )}
          {currentView === 'config' && <Config winScore={winScore} setWinScore={setWinScore} attackTime={attackTime} setAttackTime={setAttackTime} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} vibrationEnabled={vibrationEnabled} setVibrationEnabled={setVibrationEnabled} soundScheme={soundScheme} setSoundScheme={setSoundScheme} arenas={arenas} currentArenaId={currentArenaId} setCurrentArenaId={setCurrentArenaId} onAddArena={handleAddArena} onUpdateArena={handleUpdateArena} onDeleteArena={handleDeleteArena} onLogout={handleLogout} onSaveSettings={handleSaveSettings} capoteEnabled={capoteEnabled} setCapoteEnabled={setCapoteEnabled} vaiATresEnabled={vaiATresEnabled} setVaiATresEnabled={setVaiATresEnabled} />}
          {currentView === 'admin' && <Admin />}
        </main>
      </div>
    </>
  );
};

export default App;
