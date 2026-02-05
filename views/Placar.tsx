
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Team, Match, Arena } from '../types';
import { SoundScheme } from '../App';
import { useAttackTimer, useSensoryFeedback } from '../hooks';
import ScoreCard from '../components/ScoreCard';
import CenterConsole from '../components/CenterConsole';
import { RefreshCwIcon } from '../components/icons';

interface PlacarProps {
  allPlayers: Player[];
  onSaveGame: (match: Omit<Match, 'id' | 'timestamp'>) => void;
  winScore: number;
  attackTime: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundScheme: SoundScheme;
  currentArena: Arena;
}

const Placar: React.FC<PlacarProps> = ({ allPlayers, onSaveGame, winScore, attackTime, soundEnabled, vibrationEnabled, soundScheme, currentArena }) => {
  const [teamA, setTeamA] = useState<Team>({ players: [undefined, undefined], score: 0 });
  const [teamB, setTeamB] = useState<Team>({ players: [undefined, undefined], score: 0 });
  const [servingTeam, setServingTeam] = useState<'A' | 'B'>('A');
  const [history, setHistory] = useState<{ teamA: Team; teamB: Team; servingTeam: 'A' | 'B' }[]>([]);
  const [isSidesSwitched, setIsSidesSwitched] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
  
  const handleScoreChange = useCallback((setter: 'A' | 'B', newScore: number) => {
    setHistory(prev => [...prev, { teamA: { ...teamA }, teamB: { ...teamB }, servingTeam }].slice(-10));
    
    if (!gameStartTime && newScore > 0) {
      setGameStartTime(new Date());
    }

    if (setter === 'A') {
        setTeamA(prev => ({ ...prev, score: newScore }));
        if (newScore > teamA.score) setServingTeam('A');
    } else {
        setTeamB(prev => ({ ...prev, score: newScore }));
        if (newScore > teamB.score) setServingTeam('B');
    }

    playSound('point');
    vibrate(50);
    attackTimer.reset();
  }, [playSound, vibrate, attackTimer, gameStartTime, teamA, teamB, servingTeam]);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setTeamA(lastState.teamA);
      setTeamB(lastState.teamB);
      setServingTeam(lastState.servingTeam);
      setHistory(prev => prev.slice(0, -1));
      playSound('error');
      vibrate(50);
    }
  }, [history, playSound, vibrate]);

  const handlePlayerSelect = useCallback((team: 'A' | 'B', player: Player, index: number) => {
    const setter = team === 'A' ? setTeamA : setTeamB;
    setter(prev => {
        const newPlayers = [...prev.players];
        newPlayers[index] = player;
        return { ...prev, players: newPlayers };
    });
  }, []);

  const resetGame = useCallback((fullReset = false) => {
    setTeamA(prev => ({ ...prev, score: 0 }));
    setTeamB(prev => ({ ...prev, score: 0 }));
    setServingTeam('A');
    setHistory([]);
    setGameStartTime(null);
    setShowResetConfirm(false);
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
      setToastMessage("Partida em andamento. Finalize para salvar.");
      playSound('error');
      vibrate(100);
      return;
    }

    if (!teamA.players.every(p => p) || !teamB.players.every(p => p)) {
      setToastMessage("Selecione os 4 atletas.");
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
    setToastMessage("Vitória registrada!");
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

  const toggleServe = useCallback(() => {
      setServingTeam(prev => prev === 'A' ? 'B' : 'A');
      vibrate(40);
  }, [vibrate]);

  const teamLeftKey = isSidesSwitched ? 'B' : 'A';
  const teamRightKey = isSidesSwitched ? 'A' : 'B';

  const teamLeft = isSidesSwitched ? teamB : teamA;
  const teamNameLeft = isSidesSwitched ? 'Time B' : 'Time A';

  const teamRight = isSidesSwitched ? teamA : teamB;
  const teamNameRight = isSidesSwitched ? 'Time A' : 'Time B';

  return (
    <div className="h-full w-full p-1 sm:p-2 grid grid-cols-[1fr_0.8fr_1fr] md:grid-cols-[1.1fr_0.7fr_1.1fr] gap-1 sm:gap-3 relative overflow-hidden bg-transparent">
      
      <div className="min-h-0 h-full overflow-hidden">
        <ScoreCard 
          teamName={teamNameLeft}
          teamData={teamLeft}
          onScoreChange={(score) => handleScoreChange(teamLeftKey, score)}
          onPlayerSelect={(player, index) => handlePlayerSelect(teamLeftKey, player, index)}
          allPlayers={allPlayers}
          isGameWon={isGameWon}
          isLeft={true}
          isServing={servingTeam === teamLeftKey}
          arenaColor={currentArena.color}
        />
      </div>

      <div className="w-full flex-shrink-0 flex items-center justify-center min-h-0 overflow-hidden">
        <CenterConsole 
          timeLeft={attackTimer.timeLeft}
          isTimerActive={attackTimer.isActive}
          onToggleTimer={handleToggleTimer}
          onResetTimer={attackTimer.reset}
          onResetGame={() => setShowResetConfirm(true)}
          onSaveGame={saveGame}
          onSwitchSides={switchSides}
          onUndo={handleUndo}
          isGameWon={isGameWon}
          canUndo={history.length > 0}
          servingTeam={servingTeam}
          onToggleServe={toggleServe}
          arenaColor={currentArena.color}
        />
      </div>

      <div className="min-h-0 h-full overflow-hidden">
        <ScoreCard 
          teamName={teamNameRight}
          teamData={teamRight}
          onScoreChange={(score) => handleScoreChange(teamRightKey, score)}
          onPlayerSelect={(player, index) => handlePlayerSelect(teamRightKey, player, index)}
          allPlayers={allPlayers}
          isGameWon={isGameWon}
          isLeft={false}
          isServing={servingTeam === teamRightKey}
          arenaColor={currentArena.color}
        />
      </div>

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md z-[100] font-black uppercase tracking-widest text-[8px] animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {showResetConfirm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
              <div className="bg-[#090e1a] border border-white/10 rounded-[2rem] p-8 w-full max-w-[300px] shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
                     <RefreshCwIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-white text-center mb-1 uppercase tracking-tighter">Zerar Placar?</h2>
                  <p className="text-white/30 text-center mb-8 leading-relaxed text-[8px] uppercase font-bold tracking-widest">
                      O progresso atual será perdido permanentemente.
                  </p>
                  <div className="flex flex-col gap-3">
                      <button onClick={() => resetGame(false)} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-red-900/20">Confirmar</button>
                      <button onClick={() => setShowResetConfirm(false)} className="w-full py-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Voltar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Placar;
