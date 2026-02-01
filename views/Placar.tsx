
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Team, Match } from '../types';
import { SoundScheme } from '../App';
import { useAttackTimer, useSensoryFeedback } from '../hooks';
import ScoreCard from '../components/ScoreCard';
import CenterConsole from '../components/CenterConsole';

interface PlacarProps {
  allPlayers: Player[];
  onSaveGame: (match: Omit<Match, 'id' | 'timestamp'>) => void;
  winScore: number;
  attackTime: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundScheme: SoundScheme;
}

const Placar: React.FC<PlacarProps> = ({ allPlayers, onSaveGame, winScore, attackTime, soundEnabled, vibrationEnabled, soundScheme }) => {
  const [teamA, setTeamA] = useState<Team>({ players: [undefined, undefined], score: 0 });
  const [teamB, setTeamB] = useState<Team>({ players: [undefined, undefined], score: 0 });
  const [isSidesSwitched, setIsSidesSwitched] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const { playSound, vibrate } = useSensoryFeedback({ soundEnabled, vibrationEnabled, soundScheme });
  const attackTimer = useAttackTimer(attackTime);

  const isGameWon = useMemo(() => teamA.score >= winScore || teamB.score >= winScore, [teamA.score, teamB.score, winScore]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (isGameWon) {
      attackTimer.reset();
      playSound('win');
      vibrate([200, 100, 200]);
    }
  }, [isGameWon, attackTimer, playSound, vibrate]);

  useEffect(() => {
    if (attackTimer.isActive) {
        if (attackTimer.timeLeft <= 10 && attackTimer.timeLeft > 0) {
            playSound('countdownBeep');
        } else if (attackTimer.timeLeft === 0) {
            playSound('timerEndBeep');
            vibrate([150, 50, 150]);
        }
    }
  }, [attackTimer.timeLeft, attackTimer.isActive, playSound, vibrate]);
  
  const handleScoreChange = useCallback((setter: React.Dispatch<React.SetStateAction<Team>>, newScore: number) => {
    if (!gameStartTime && newScore > 0) {
      setGameStartTime(new Date());
    }
    setter(prev => ({ ...prev, score: newScore }));
    playSound('point');
    vibrate(50);
    attackTimer.reset();
  }, [playSound, vibrate, attackTimer, gameStartTime]);

  const handlePlayerSelect = useCallback((setter: React.Dispatch<React.SetStateAction<Team>>, player: Player, index: number) => {
    setter(prev => {
        const newPlayers = [...prev.players];
        newPlayers[index] = player;
        return { ...prev, players: newPlayers };
    });
  }, []);

  const resetGame = useCallback((fullReset = false) => {
    setTeamA(prev => ({ ...prev, score: 0 }));
    setTeamB(prev => ({ ...prev, score: 0 }));
    setGameStartTime(null);
    attackTimer.reset();
    vibrate([100, 50, 100]);
    playSound('error');
    if (fullReset) {
      setTeamA({ players: [undefined, undefined], score: 0 });
      setTeamB({ players: [undefined, undefined], score: 0 });
    }
  }, [attackTimer, vibrate, playSound]);

  const saveGame = useCallback(() => {
    if (!isGameWon) {
      setToastMessage("A partida precisa ser finalizada para salvar.");
      playSound('error');
      vibrate(100);
      return;
    }

    if (!teamA.players.every(p => p) || !teamB.players.every(p => p)) {
      setToastMessage("Selecione os 4 jogadores para salvar.");
      playSound('error');
      vibrate(100);
      return;
    }

    const duration = gameStartTime ? Math.round((new Date().getTime() - gameStartTime.getTime()) / 60000) : 0;

    const matchData = {
      teamA: { players: teamA.players.filter(p => p) as Player[], score: teamA.score },
      teamB: { players: teamB.players.filter(p => p) as Player[], score: teamB.score },
      winner: teamA.score > teamB.score ? 'A' : 'B',
      duration,
    } as Omit<Match, 'id' | 'timestamp'>;
    
    onSaveGame(matchData);
    setToastMessage("Partida salva com sucesso!");
    resetGame(true);

  }, [isGameWon, teamA, teamB, onSaveGame, resetGame, gameStartTime, playSound, vibrate]);

  const switchSides = useCallback(() => {
      setIsSidesSwitched(prev => !prev);
      vibrate(50);
  }, [vibrate]);
  
  const handleToggleTimer = useCallback(() => {
    if (attackTimer.isActive) {
        attackTimer.pause();
    } else if (attackTimer.isPaused) {
        attackTimer.resume();
    } else {
        attackTimer.start();
        playSound('timerStartBeep');
    }
  }, [attackTimer, playSound]);

  const teamLeft = isSidesSwitched ? teamB : teamA;
  const setTeamLeft = isSidesSwitched ? setTeamB : setTeamA;
  const teamNameLeft = isSidesSwitched ? 'Time B' : 'Time A';

  const teamRight = isSidesSwitched ? teamA : teamB;
  const setTeamRight = isSidesSwitched ? setTeamA : setTeamB;
  const teamNameRight = isSidesSwitched ? 'Time A' : 'Time B';

  return (
    <div className="h-full w-full p-2 flex flex-col sm:grid sm:grid-cols-[1fr_min-content_1fr] sm:items-stretch gap-1 sm:gap-4 relative overflow-hidden">
      <div className="flex flex-col min-w-0 h-full">
        <ScoreCard 
          teamName={teamNameLeft}
          teamData={teamLeft}
          onScoreChange={(score) => handleScoreChange(setTeamLeft, score)}
          onPlayerSelect={(player, index) => handlePlayerSelect(setTeamLeft, player, index)}
          allPlayers={allPlayers}
          isGameWon={isGameWon}
          isLeft={true}
        />
      </div>

      <div className="w-full sm:w-48 lg:w-56 flex-shrink-0 flex flex-col items-center pt-2">
        <CenterConsole 
          timeLeft={attackTimer.timeLeft}
          isTimerActive={attackTimer.isActive}
          onToggleTimer={handleToggleTimer}
          onResetTimer={attackTimer.reset}
          onResetGame={() => resetGame(false)}
          onSaveGame={saveGame}
          onSwitchSides={switchSides}
          isGameWon={isGameWon}
        />
      </div>

      <div className="flex flex-col min-w-0 h-full">
        <ScoreCard 
          teamName={teamNameRight}
          teamData={teamRight}
          onScoreChange={(score) => handleScoreChange(setTeamRight, score)}
          onPlayerSelect={(player, index) => handlePlayerSelect(setTeamRight, player, index)}
          allPlayers={allPlayers}
          isGameWon={isGameWon}
          isLeft={false}
        />
      </div>

      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-700/90 text-white px-6 py-3 rounded-lg shadow-xl backdrop-blur-md z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Placar;
