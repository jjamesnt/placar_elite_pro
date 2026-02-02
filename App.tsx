
import React, { useState, useCallback, useEffect } from 'react';
import OrientationLock from './components/OrientationLock';
import Navigation, { View } from './components/Navigation';
import Placar from './views/Placar';
import Atletas from './views/Atletas';
import Ranking from './views/Ranking';
import Historico from './views/Historico';
import Config from './views/Config';
import { Player, Match, Arena } from './types';
import { MOCK_PLAYERS, MOCK_MATCHES } from './data';

export type SoundScheme = 'moderno' | 'classico' | 'intenso';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('placar');
  const [lastUpdate, setLastUpdate] = useState<string>('--/-- --:--');

  // Gestão de Arenas
  const [arenas, setArenas] = useState<Arena[]>(() => {
    const saved = localStorage.getItem('elite_arenas');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Arena Principal' }];
  });

  const [currentArenaId, setCurrentArenaId] = useState<string>(() => {
    return localStorage.getItem('elite_current_arena_id') || 'default';
  });

  // Dados Dinâmicos baseados na Arena
  const [players, setPlayers] = useState<Player[]>([]);
  const [deletedPlayers, setDeletedPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [winScore, setWinScore] = useState(15);
  const [attackTime, setAttackTime] = useState(24);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundScheme, setSoundScheme] = useState<SoundScheme>('moderno');

  // Carregar dados quando a Arena muda
  useEffect(() => {
    const prefix = `elite_arena_${currentArenaId}_`;
    
    const savedPlayers = localStorage.getItem(`${prefix}players`);
    setPlayers(savedPlayers ? JSON.parse(savedPlayers) : (currentArenaId === 'default' ? MOCK_PLAYERS : []));

    const savedDeleted = localStorage.getItem(`${prefix}deleted_players`);
    setDeletedPlayers(savedDeleted ? JSON.parse(savedDeleted) : []);

    const savedMatches = localStorage.getItem(`${prefix}matches`);
    setMatches(savedMatches ? JSON.parse(savedMatches).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : (currentArenaId === 'default' ? MOCK_MATCHES : []));

    setWinScore(Number(localStorage.getItem(`${prefix}winScore`)) || 15);
    setAttackTime(Number(localStorage.getItem(`${prefix}attackTime`)) || 24);
    setSoundEnabled(localStorage.getItem(`${prefix}soundEnabled`) !== 'false');
    setVibrationEnabled(localStorage.getItem(`${prefix}vibrationEnabled`) !== 'false');
    setSoundScheme((localStorage.getItem(`${prefix}soundScheme`) as SoundScheme) || 'moderno');

    localStorage.setItem('elite_current_arena_id', currentArenaId);
  }, [currentArenaId]);

  // Salvar Arenas
  useEffect(() => {
    localStorage.setItem('elite_arenas', JSON.stringify(arenas));
  }, [arenas]);

  // Persistência de Dados da Arena Ativa
  useEffect(() => {
    const prefix = `elite_arena_${currentArenaId}_`;
    localStorage.setItem(`${prefix}players`, JSON.stringify(players));
    localStorage.setItem(`${prefix}deleted_players`, JSON.stringify(deletedPlayers));
    localStorage.setItem(`${prefix}matches`, JSON.stringify(matches));
    localStorage.setItem(`${prefix}winScore`, String(winScore));
    localStorage.setItem(`${prefix}attackTime`, String(attackTime));
    localStorage.setItem(`${prefix}soundEnabled`, String(soundEnabled));
    localStorage.setItem(`${prefix}vibrationEnabled`, String(vibrationEnabled));
    localStorage.setItem(`${prefix}soundScheme`, soundScheme);

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLastUpdate(formattedDate);
  }, [players, deletedPlayers, matches, winScore, attackTime, soundEnabled, vibrationEnabled, soundScheme, currentArenaId]);

  const handleSaveGame = useCallback((match: Omit<Match, 'id' | 'timestamp'>) => {
    const newMatch: Match = {
      ...match,
      id: String(Date.now()),
      timestamp: new Date(),
    };
    setMatches(prev => [newMatch, ...prev]);
  }, []);

  const renderView = () => {
    const currentArenaName = arenas.find(a => a.id === currentArenaId)?.name || 'Arena';
    
    switch (currentView) {
      case 'placar':
        return <Placar allPlayers={players} onSaveGame={handleSaveGame} winScore={winScore} attackTime={attackTime} soundEnabled={soundEnabled} vibrationEnabled={vibrationEnabled} soundScheme={soundScheme} arenaName={currentArenaName} />;
      case 'historico':
        return <Historico matches={matches} setMatches={setMatches} />;
      case 'atletas':
        return <Atletas players={players} setPlayers={setPlayers} deletedPlayers={deletedPlayers} setDeletedPlayers={setDeletedPlayers} />;
      case 'ranking':
        const allPlayersForRanking = [...players, ...deletedPlayers];
        return <Ranking matches={matches} players={allPlayersForRanking} arenaName={currentArenaName} />;
      case 'config':
        return (
          <Config
            players={players}
            setPlayers={setPlayers}
            deletedPlayers={deletedPlayers}
            setDeletedPlayers={setDeletedPlayers}
            matches={matches}
            setMatches={setMatches}
            winScore={winScore}
            setWinScore={setWinScore}
            attackTime={attackTime}
            setAttackTime={setAttackTime}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            vibrationEnabled={vibrationEnabled}
            setVibrationEnabled={setVibrationEnabled}
            soundScheme={soundScheme}
            setSoundScheme={setSoundScheme}
            arenas={arenas}
            setArenas={setArenas}
            currentArenaId={currentArenaId}
            setCurrentArenaId={setCurrentArenaId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <OrientationLock />
      <div className="h-screen w-screen flex flex-col bg-gray-900 text-white font-sans overflow-hidden">
        <Navigation currentView={currentView} onNavigate={setCurrentView} lastUpdate={lastUpdate} arenaName={arenas.find(a => a.id === currentArenaId)?.name} />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </>
  );
};

export default App;
