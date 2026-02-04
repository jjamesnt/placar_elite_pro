
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Navigation, { View } from './components/Navigation';
import OrientationLock from './components/OrientationLock';
import WelcomeModal from './components/WelcomeModal';
import Placar from './views/Placar';
import Atletas from './views/Atletas';
import Ranking from './views/Ranking';
import Historico from './views/Historico';
import Config from './views/Config';
import Admin from './views/Admin';
import Login from './views/Login';
import ChangePassword from './views/ChangePassword';
import { Player, Match, Arena, ArenaColor, UserLicense } from './types';
import { supabase } from './lib/supabase';
import { ShieldIcon } from './components/icons';

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
  const [showWelcome, setShowWelcome] = useState(false);

  const [arenas, setArenas] = useState<Arena[]>([]);
  const [currentArenaId, setCurrentArenaId] = useState<string>('default');

  const currentArena = useMemo(() => arenas.find(a => a.id === currentArenaId) || arenas[0] || { id: 'default', name: 'Carregando...', color: 'indigo' }, [arenas, currentArenaId]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [deletedPlayers, setDeletedPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [winScore, setWinScore] = useState(15);
  const [attackTime, setAttackTime] = useState(24);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundScheme, setSoundScheme] = useState<SoundScheme>('moderno');

  const handleLogout = useCallback(async () => {
    setSession(null);
    setUserLicense(null);
    setCurrentView('placar');
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
  }, []);

  const checkLicense = useCallback(async (userId: string, email: string) => {
    try {
      // O trigger no banco já garantiu que a licença existe
      const { data, error } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (data) {
        setUserLicense(data);
        if (data.is_active && !data.first_access_done && email !== 'jjamesnt@gmail.com') {
          setShowWelcome(true);
        }
      } else {
        // Fallback caso o trigger falhe (segurança extra)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        const isMaster = email.toLowerCase() === 'jjamesnt@gmail.com';
        const { data: newLicense } = await supabase.from('user_licenses').insert([{
            user_id: userId,
            email: email.toLowerCase(),
            is_active: isMaster,
            expires_at: expiry.toISOString()
        }]).select().single();
        if (newLicense) setUserLicense(newLicense);
      }
    } catch (err) {
      console.error("Erro licença:", err);
    }
  }, []);

  const handleFirstAccessConfirm = async () => {
    if (!userLicense) return;
    const { error } = await supabase.from('user_licenses').update({ first_access_done: true }).eq('id', userLicense.id);
    if (!error) {
      setUserLicense(prev => prev ? { ...prev, first_access_done: true } : null);
      setShowWelcome(false);
    }
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
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) { console.error("Refresh Error:", err); }
  }, [session, currentArenaId, userLicense]);

  useEffect(() => {
    const handleSession = (session: any) => {
      setSession(session);
      if (session?.user) {
        setIsAdmin(session.user.email.toLowerCase() === 'jjamesnt@gmail.com');
        setMustChangePassword(!!session.user.user_metadata?.must_change_password);
        checkLicense(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
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
          const { data: newArena } = await supabase.from('arenas').insert([{ name: 'Arena Principal', color: 'indigo', user_id: session.user.id }]).select().single();
          if (newArena) {
            setArenas([newArena]);
            setCurrentArenaId(newArena.id);
          }
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
      localStorage.setItem('elite_last_arena', currentArenaId);
    }
  }, [currentArenaId, session, refreshData, userLicense]);

  const handleSaveMatch = async (matchData: Omit<Match, 'id' | 'timestamp'>) => {
    if (!session || currentArenaId === 'default') return;
    const { data } = await supabase.from('matches').insert([{ arena_id: currentArenaId, user_id: session.user.id, data_json: matchData }]).select().single();
    if (data) refreshData();
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

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#030712]"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session) return <><Background color="indigo" /><Login onLogin={() => {}} /></>;
  if (mustChangePassword) return <ChangePassword onComplete={() => setMustChangePassword(false)} />;

  const isExpired = userLicense && new Date(userLicense.expires_at).getTime() < Date.now();
  const isBlocked = userLicense && !userLicense.is_active;

  if (userLicense && (isBlocked || isExpired)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-8 bg-[#030712] text-center">
        <Background color="rose" />
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
          <ShieldIcon className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">{isBlocked ? 'Aguardando Aprovação' : 'Acesso Expirado'}</h1>
        <p className="text-white/40 max-w-md font-bold uppercase tracking-widest text-[10px] leading-relaxed mb-10">
          {isBlocked ? 'Sua conta foi criada, mas o administrador mestre ainda não ativou sua licença.' : 'Seu período de licença expirou. Renove seu plano para continuar.'}
          <br /><br /> Fale com o suporte para liberação.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <a href="https://wa.me/5531988124233" target="_blank" className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 text-center">Falar com Suporte</a>
          <button onClick={handleLogout} className="text-white/20 hover:text-white font-black uppercase text-[10px] tracking-widest py-4">Sair da Conta</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <OrientationLock />
      {showWelcome && <WelcomeModal onConfirm={handleFirstAccessConfirm} />}
      <Background color={currentArena.color || 'indigo'} />
      <div className="h-screen w-screen flex flex-col text-white font-sans overflow-hidden bg-transparent">
        <Navigation currentView={currentView} onNavigate={setCurrentView} lastUpdate={lastUpdate} currentArena={currentArena} onLogout={handleLogout} isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto">
           {currentView === 'placar' && <Placar allPlayers={players} onSaveGame={handleSaveMatch} winScore={winScore} attackTime={attackTime} soundEnabled={soundEnabled} vibrationEnabled={vibrationEnabled} soundScheme={soundScheme} currentArena={currentArena} />}
           {currentView === 'historico' && <Historico matches={matches} setMatches={setMatches} currentArena={currentArena} />}
           {currentView === 'atletas' && <Atletas players={players} setPlayers={setPlayers} deletedPlayers={deletedPlayers} setDeletedPlayers={setDeletedPlayers} arenaId={currentArenaId} userId={session?.user?.id} />}
           {currentView === 'ranking' && <Ranking matches={matches} players={[...players, ...deletedPlayers]} arenaName={currentArena.name} arenaColor={currentArena.color} />}
           {currentView === 'config' && <Config winScore={winScore} setWinScore={setWinScore} attackTime={attackTime} setAttackTime={setAttackTime} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} vibrationEnabled={vibrationEnabled} setVibrationEnabled={setVibrationEnabled} soundScheme={soundScheme} setSoundScheme={setSoundScheme} arenas={arenas} currentArenaId={currentArenaId} setCurrentArenaId={setCurrentArenaId} onAddArena={handleAddArena} onUpdateArena={handleUpdateArena} onDeleteArena={handleDeleteArena} onLogout={handleLogout} />}
           {currentView === 'admin' && <Admin />}
        </main>
      </div>
    </>
  );
};

export default App;
