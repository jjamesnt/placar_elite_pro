
import React, { useState, useCallback, useEffect } from 'react';
import OrientationLock from './components/OrientationLock';
import Navigation, { View } from './components/Navigation';
import Placar from './views/Placar';
import Atletas from './views/Atletas';
import Ranking from './views/Ranking';
import Historico from './views/Historico';
import Config from './views/Config';
import { Player, Match } from './types';
import { MOCK_PLAYERS, MOCK_MATCHES } from './data';

export type SoundScheme = 'moderno' | 'classico' | 'intenso';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('placar');
  
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('elite_players');
    return saved ? JSON.parse(saved) : MOCK_PLAYERS;
  });

  const [deletedPlayers, setDeletedPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('elite_deleted_players');
    return saved ? JSON.parse(saved) : [];
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('elite_matches');
    return saved ? JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : MOCK_MATCHES;
  });

  const [winScore, setWinScore] = useState(() => Number(localStorage.getItem('elite_winScore')) || 15);
  const [attackTime, setAttackTime] = useState(() => Number(localStorage.getItem('elite_attackTime')) || 24);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('elite_soundEnabled') !== 'false');
  const [vibrationEnabled, setVibrationEnabled] = useState(() => localStorage.getItem('elite_vibrationEnabled') !== 'false');
  const [soundScheme, setSoundScheme] = useState<SoundScheme>(() => (localStorage.getItem('elite_soundScheme') as SoundScheme) || 'moderno');
  
  const [lastUpdate, setLastUpdate] = useState<string>('--/-- --:--');

  // Data persistence
  useEffect(() => { localStorage.setItem('elite_players', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('elite_deleted_players', JSON.stringify(deletedPlayers)); }, [deletedPlayers]);
  useEffect(() => { localStorage.setItem('elite_matches', JSON.stringify(matches)); }, [matches]);
  useEffect(() => { localStorage.setItem('elite_winScore', String(winScore)); }, [winScore]);
  useEffect(() => { localStorage.setItem('elite_attackTime', String(attackTime)); }, [attackTime]);
  useEffect(() => { localStorage.setItem('elite_soundEnabled', String(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('elite_vibrationEnabled', String(vibrationEnabled)); }, [vibrationEnabled]);
  useEffect(() => { localStorage.setItem('elite_soundScheme', soundScheme); }, [soundScheme]);

  // Update last update time whenever data changes
  useEffect(() => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLastUpdate(formattedDate);
  }, [players, deletedPlayers, matches, winScore, attackTime, soundEnabled, vibrationEnabled, soundScheme]);

  const handleSaveGame = useCallback((match: Omit<Match, 'id' | 'timestamp'>) => {
    const newMatch: Match = {
      ...match,
      id: String(Date.now()),
      timestamp: new Date(),
    };
    setMatches(prev => [newMatch, ...prev]);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'placar':
        return <Placar allPlayers={players} onSaveGame={handleSaveGame} winScore={winScore} attackTime={attackTime} soundEnabled={soundEnabled} vibrationEnabled={vibrationEnabled} soundScheme={soundScheme} />;
      case 'historico':
        return <Historico matches={matches} setMatches={setMatches} />;
      case 'atletas':
        return <Atletas players={players} setPlayers={setPlayers} deletedPlayers={deletedPlayers} setDeletedPlayers={setDeletedPlayers} />;
      case 'ranking':
        const allPlayersForRanking = [...players, ...deletedPlayers];
        return <Ranking matches={matches} players={allPlayersForRanking} />;
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
        <Navigation currentView={currentView} onNavigate={setCurrentView} lastUpdate={lastUpdate} />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </>
  );
};

export default App;
