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
import { MatchAPI, ArenaAPI, PlayerAPI } from './lib/api';
import { supabase } from './lib/supabase';
import { Player, Team, Match, Arena, ArenaColor, UserProfile, UserLicense } from './types';
import { warmUpAudioContext } from './hooks';
import { useTVSync } from './hooks/useTVSync';
import { useMatchEngine, setupArenaConfig } from './hooks/useMatchEngine';

// James, normalize fora do componente para ser estável e não resetar o rádio
const normalize = (str: string) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();


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
    const isTvPath = window.location.pathname.startsWith('/tv');
    return (params.get('view') === 'tv' || params.get('tv') || isTvPath) ? 'tv' : 'placar';
  });
  // James: ID MATEMATICAMENTE ÚNICO DO DISPOSITIVO (Impede Ghost Tabs e SSR caching collision)
  const senderId = useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);
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

  const [rankingFilter, setRankingFilter] = useState<'Hoje' | 'Semanal' | 'Mensal' | 'Anual' | 'Total'>('Hoje');
  const [rankingViewDate, setRankingViewDate] = useState(new Date());

  const engine = useMatchEngine();

  const refreshData = useCallback(async () => {
    if (!session || !userLicense?.is_active || currentArenaId === 'default') return;
    try {
      // Busca jogadores APENAS da arena atual para evitar duplicados
      const { data: pData } = await PlayerAPI.fetchPlayers(currentArenaId);
      const { data: mData } = await MatchAPI.fetchMatches(currentArenaId, 50);

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

  const [tvModals, setTvModals] = useState<{ victoryData: any, showVaiATres: boolean }>({ victoryData: null, showVaiATres: false });
  const [tvAttackTime, setTvAttackTime] = useState<number | null>(null);
  const [tvLayoutMirrored, setTvLayoutMirrored] = useState<boolean>(false);

  const { channelStatus, forceSync } = useTVSync({
    senderId, arenas, currentArenaId, players, matches, teamA: engine.teamA, teamB: engine.teamB,
    servingTeam: engine.servingTeam, gameStartTime: engine.gameStartTime, tvModals, tvAttackTime, isSidesSwitched: engine.isSidesSwitched, tvLayoutMirrored,
    lastInteractionTime: engine.lastInteractionTime
  });


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
      let query = supabase.from('arenas').select('*').order('created_at', { ascending: true });
      if (session?.user?.id) {
        query = query.eq('user_id', session.user.id);
      }
      const { data } = await query;
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

  useEffect(() => {
    if (currentArenaId !== 'default' && userLicense?.is_active) {
      refreshData();
      setupArenaConfig(currentArenaId);
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
    setTimeout(() => forceSync(), 0);

    const { data } = await MatchAPI.saveMatch(currentArenaId, session.user.id, matchData);
    if (data) refreshData();
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!session?.user?.id) return;
    try {
      setMatches(prev => prev.filter(m => m.id !== matchId));
      const { error } = await MatchAPI.deleteMatch(matchId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao deletar partida:", err);
      if (showAlert) showAlert("Erro ao Deletar", "Não foi possível remover do servidor. Verifique sua conexão.", 'danger', 'alert');
    }
  };

  const handleUpdateMatch = async (matchId: string, updatedData: Omit<Match, 'id' | 'timestamp'>) => {
    if (!session?.user?.id) return;
    try {
      const { error } = await MatchAPI.updateMatch(matchId, updatedData);
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
    localStorage.setItem(`${prefix}winScore`, engine.winScore.toString());
    localStorage.setItem(`${prefix}attackTime`, engine.attackTime.toString());
    localStorage.setItem(`${prefix}soundEnabled`, engine.soundEnabled.toString());
    localStorage.setItem(`${prefix}vibrationEnabled`, engine.vibrationEnabled.toString());
    localStorage.setItem(`${prefix}soundScheme`, engine.soundScheme);
    localStorage.setItem(`${prefix}capoteEnabled`, engine.capoteEnabled.toString());
    localStorage.setItem(`${prefix}vaiATresEnabled`, engine.vaiATresEnabled.toString());
    localStorage.setItem(`${prefix}matchMode`, engine.matchMode);
    localStorage.setItem(`${prefix}matchTime`, engine.matchTime.toString());
    localStorage.setItem(`${prefix}tvLayoutMirrored`, tvLayoutMirrored.toString());
    refreshData();
  }, [currentArenaId, engine, tvLayoutMirrored, refreshData]);

  const handleAddArena = async (name: string, color: ArenaColor) => {
    if (!session?.user?.id) {
       if (showAlert) showAlert("Erro", "Sessão não encontrada. Tente sair e entrar novamente.", 'danger');
       return;
    }

    // James: Verificação proativa de limites do plano para evitar erro genérico de RLS
    const limit = userLicense?.arenas_limit || 1;
    if (arenas.length >= limit && !isAdmin) {
      if (showAlert) showAlert(
        "Limite Atingido", 
        `Seu plano atual permite apenas ${limit} arena(s). Remova uma existente ou faça upgrade para adicionar mais.`, 
        'warning', 
        'lock'
      );
      return;
    }
    
    try {
      const { data, error } = await ArenaAPI.addArena(name, color, session.user.id);
      
      if (error) {
        // Se for erro de RLS, dar uma dica sobre permissões
        if (error.code === '42501') {
           throw new Error("Permissão negada pelo banco (RLS). Por favor, execute o 'Reparo SQL' no painel Admin.");
        }
        throw error;
      }

      if (data) {
        setArenas(prev => [...prev, data]);
        if (showAlert) showAlert("Sucesso!", `Grupo "${name}" criado com sucesso.`, 'success', 'check');
      }
    } catch (err: any) { 
      console.error("Erro ao adicionar arena:", err); 
      if (showAlert) showAlert("Não foi possível criar", err.message || "Tente novamente ou contate o suporte.", 'danger', 'alert');
    }
  };

  const handleUpdateArena = async (id: string, name: string, color: ArenaColor) => {
    try {
      const { error } = await ArenaAPI.updateArena(id, name, color);
      if (error) throw error;
      setArenas(prev => prev.map(a => a.id === id ? { ...a, name, color } : a));
      if (showAlert) showAlert("Atualizado", "As alterações foram salvas.", 'success', 'check');
    } catch (err: any) { 
      console.error("Erro ao atualizar arena:", err);
      if (showAlert) showAlert("Erro ao Atualizar", err.message || "Não foi possível salvar as alterações.", 'danger', 'alert');
    }
  };

  const handleDeleteArena = async (id: string) => {
    try {
      const { error } = await ArenaAPI.deleteArena(id);
      if (error) throw error;
      setArenas(prev => prev.filter(a => a.id !== id));
      if (currentArenaId === id) setCurrentArenaId(arenas.find(a => a.id !== id)?.id || 'default');
      if (showAlert) showAlert("Excluído", "O grupo foi removido permanentemente.", 'info', 'check');
    } catch (err: any) { 
      console.error("Erro ao deletar arena:", err);
      if (showAlert) showAlert("Erro ao Deletar", err.message || "Não foi possível remover a arena.", 'danger', 'trash');
    }
  };

  const handleCloseWelcome = useCallback(async () => {
    setActiveModal('none');
    localStorage.setItem('elite_welcome_done', 'true');
    if (userLicense?.id) {
        await supabase.from('user_licenses').update({ first_access_done: true }).eq('id', userLicense.id);
    }
  }, [userLicense]);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#030712]"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session && currentView !== 'tv') return <><Background color="indigo" /><Login onLogin={() => { }} /></>;

  return (
    <>
      <OrientationLock />
      {activeModal === 'welcome' && <WelcomeModal onConfirm={handleCloseWelcome} />}
      <Background color={(currentArena.color || 'indigo') as ArenaColor} />
      <div className="h-screen w-screen flex flex-col text-white font-sans overflow-hidden bg-transparent">
        {currentView !== 'tv' && (
            <Navigation currentView={currentView} onNavigate={setCurrentView} lastUpdate={lastUpdate} currentArena={currentArena} onLogout={handleLogout} isAdmin={isAdmin} isClub={userLicense?.is_club} showConfirm={showConfirm} channelStatus={channelStatus} />
        )}
        <main className={`flex-1 ${currentView !== 'tv' ? 'overflow-y-auto' : ''}`}>
          {currentView === 'placar' && <Placar allPlayers={players} onSaveGame={handleSaveMatch} currentArena={currentArena} showAlert={showAlert} showConfirm={showConfirm} setTvModals={setTvModals} setTvAttackTime={setTvAttackTime} />}
          {currentView === 'historico' && <Historico matches={matches} setMatches={setMatches} currentArena={currentArena} onClearMatches={() => {}} onUpdateMatch={handleUpdateMatch} players={players} showAlert={showAlert} showConfirm={showConfirm} onDeleteMatch={handleDeleteMatch} />}
          {currentView === 'atletas' && <Atletas players={players} setPlayers={setPlayers} deletedPlayers={deletedPlayers} setDeletedPlayers={setDeletedPlayers} arenaId={currentArenaId} userId={session?.user?.id} athletesLimit={userLicense?.athletes_limit} showAlert={showAlert} showConfirm={showConfirm} />}
          {currentView === 'tv' && <TVView arenaId={currentArenaId} />}
          {currentView === 'ranking' && <Ranking players={players} matches={matches} arenaName={currentArena.name} arenaColor={currentArena.color} filter={rankingFilter} setFilter={setRankingFilter} viewDate={rankingViewDate} setViewDate={setRankingViewDate} onClearMatches={() => {}} showAlert={showAlert} />}
          {currentView === 'config' && <Config arenas={arenas} currentArenaId={currentArenaId} senderId={senderId} setCurrentArenaId={setCurrentArenaId} onAddArena={handleAddArena} onUpdateArena={handleUpdateArena} onDeleteArena={handleDeleteArena} onLogout={handleLogout} onSaveSettings={handleSaveSettings} onGoToSubscription={() => setCurrentView('assinatura')} userLicense={userLicense} onRefreshLicense={refreshData} showAlert={showAlert} showConfirm={showConfirm} tvLayoutMirrored={tvLayoutMirrored} setTvLayoutMirrored={setTvLayoutMirrored} />}
          {currentView === 'admin' && isAdmin && <Admin showAlert={showAlert} showConfirm={showConfirm} />}
          {currentView === 'clube' && userLicense && <ClubManagement ownerLicense={userLicense} onRefresh={() => checkLicense(session.user.id, session.user.email)} showAlert={showAlert} showConfirm={showConfirm} />}
        </main>
      </div>
      <ConfirmModal isOpen={globalModal.isOpen && currentView !== 'tv'} title={globalModal.title} message={globalModal.message} type={globalModal.type} icon={globalModal.icon} confirmLabel={globalModal.confirmLabel} showCancel={globalModal.showCancel} onConfirm={globalModal.onConfirm || (() => {})} onCancel={() => setGlobalModal(prev => ({ ...prev, isOpen: false }))} />
    </>
  );
};

export default App;
