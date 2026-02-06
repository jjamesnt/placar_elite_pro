
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Team, Match, Arena } from '../types';
import { SoundScheme } from '../App';
import { useAttackTimer, useSensoryFeedback } from '../hooks';
import ScoreCard from '../components/ScoreCard';
import CenterConsole from '../components/CenterConsole';
import VictoryModal from '../components/VictoryModal';
import VaiATresModal from '../components/VaiATresModal';
import { RefreshCwIcon } from '../components/icons';

interface PlacarProps {
  allPlayers: Player[];
  onSaveGame: (match: Omit<Match, 'id' | 'timestamp'>) => void;
  winScore: number;
  setWinScore: React.Dispatch<React.SetStateAction<number>>;
  attackTime: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundScheme: SoundScheme;
  currentArena: Arena;
  teamA: Team;
  setTeamA: React.Dispatch<React.SetStateAction<Team>>;
  teamB: Team;
  setTeamB: React.Dispatch<React.SetStateAction<Team>>;
  servingTeam: 'A' | 'B';
  setServingTeam: React.Dispatch<React.SetStateAction<'A' | 'B'>>;
  history: { teamA: Team; teamB: Team; servingTeam: 'A' | 'B' }[];
  setHistory: React.Dispatch<React.SetStateAction<{ teamA: Team; teamB: Team; servingTeam: 'A' | 'B' }[]>>;
  isSidesSwitched: boolean;
  setIsSidesSwitched: React.Dispatch<React.SetStateAction<boolean>>;
  gameStartTime: Date | null;
  setGameStartTime: React.Dispatch<React.SetStateAction<Date | null>>;
  resetGame: (fullReset?: boolean) => void;
  capoteEnabled: boolean;
  vaiATresEnabled: boolean;
}

interface VictoryData {
  winner: 'A' | 'B';
  teamA: Team;
  teamB: Team;
  isCapote: boolean;
}

const Placar: React.FC<PlacarProps> = ({ 
  allPlayers, onSaveGame, winScore, setWinScore, attackTime, soundEnabled, vibrationEnabled, soundScheme, currentArena,
  teamA, setTeamA, teamB, setTeamB, servingTeam, setServingTeam, history, setHistory,
  isSidesSwitched, setIsSidesSwitched, gameStartTime, setGameStartTime, resetGame,
  capoteEnabled, vaiATresEnabled
}) => {
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [victoryData, setVictoryData] = useState<VictoryData | null>(null);
  const [showVaiATresModal, setShowVaiATresModal] = useState(false);

  const { playSound, vibrate } = useSensoryFeedback({ soundEnabled, vibrationEnabled, soundScheme });
  const attackTimer = useAttackTimer(attackTime);

  const initialWinScore = useMemo(() => {
    const prefix = `elite_arena_${currentArena.id}_`;
    return Number(localStorage.getItem(`${prefix}winScore`)) || 15;
  }, [currentArena.id]);

  const { isGameWon, isCapoteWin } = useMemo(() => {
    let capoteWin = false;
    if (capoteEnabled) {
      const capoteScore = Math.ceil(initialWinScore / 2);
      if (
        (teamA.score >= capoteScore && teamB.score === 0) ||
        (teamB.score >= capoteScore && teamA.score === 0)
      ) {
        capoteWin = true;
      }
    }
    const regularWin = teamA.score >= winScore || teamB.score >= winScore;
    return { isGameWon: regularWin || capoteWin, isCapoteWin: capoteWin };
  }, [teamA.score, teamB.score, winScore, capoteEnabled, initialWinScore]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (isGameWon && !victoryData) {
      attackTimer.reset();
      playSound('win');
      vibrate([200, 100, 200]);
      setVictoryData({
        winner: teamA.score > teamB.score ? 'A' : 'B',
        teamA, teamB, isCapote: isCapoteWin
      });
    }
  }, [isGameWon, victoryData, attackTimer, playSound, vibrate, teamA, teamB, isCapoteWin]);

  useEffect(() => {
    const isTiePoint = teamA.score === teamB.score && teamA.score === winScore - 1;
    if (vaiATresEnabled && isTiePoint && !isGameWon && !showVaiATresModal) {
      setWinScore(prev => prev + 2);
      setShowVaiATresModal(true);
      playSound('win');
      vibrate([100, 50, 100, 50, 100]);
    }
  }, [teamA.score, teamB.score, winScore, vaiATresEnabled, isGameWon, showVaiATresModal, setWinScore, playSound, vibrate]);

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
  }, [playSound, vibrate, attackTimer, gameStartTime, teamA, teamB, servingTeam, setHistory, setTeamA, setTeamB, setServingTeam, setGameStartTime]);

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
  }, [history, playSound, vibrate, setTeamA, setTeamB, setServingTeam, setHistory]);

  const handlePlayerSelect = useCallback((team: 'A' | 'B', player: Player, index: number) => {
    const setter = team === 'A' ? setTeamA : setTeamB;
    setter(prev => {
        const newPlayers = [...prev.players];
        newPlayers[index] = player;
        return { ...prev, players: newPlayers };
    });
  }, [setTeamA, setTeamB]);

  const handleConfirmReset = (fullReset = false) => {
    resetGame(fullReset);
    attackTimer.reset();
    setShowResetConfirm(false);
    setVictoryData(null);
    vibrate([100, 50, 100]);
    playSound('error');
  };

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
      capoteApplied: isCapoteWin,
      vaiATresTriggered: winScore > initialWinScore,
    } as Omit<Match, 'id' | 'timestamp'>;
    
    onSaveGame(matchData);
    setToastMessage("Vitória registrada! Nova partida iniciada.");
    setVictoryData(null);

  }, [isGameWon, teamA, teamB, onSaveGame, gameStartTime, playSound, vibrate, isCapoteWin, winScore, initialWinScore]);

  const switchSides = useCallback(() => {
      setIsSidesSwitched(prev => !prev);
      vibrate(50);
  }, [vibrate, setIsSidesSwitched]);
  
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

  const teamLeftKey = isSidesSwitched ? 'B' : 'A';
  const teamRightKey = isSidesSwitched ? 'A' : 'B';
  const teamLeft = isSidesSwitched ? teamB : teamA;
  const teamNameLeft = isSidesSwitched ? 'Time B' : 'Time A';
  const teamRight = isSidesSwitched ? teamA : teamB;
  const teamNameRight = isSidesSwitched ? 'Time A' : 'Time B';

  return (
    <div className="h-full w-full p-1 sm:p-2 lg:p-4 grid grid-cols-[1fr_0.8fr_1fr] md:grid-cols-[1.1fr_0.7fr_1.1fr] lg:grid-cols-[1.2fr_0.6fr_1.2fr] gap-1 sm:gap-3 lg:gap-6 relative overflow-hidden bg-transparent max-w-[1600px] mx-auto">
      
      {victoryData && (
        <VictoryModal
          victoryData={victoryData}
          onClose={() => setVictoryData(null)}
          onSave={saveGame}
          onNewGame={() => handleConfirmReset(true)}
          arenaColor={currentArena.color}
        />
      )}
      
      {showVaiATresModal && (
        <VaiATresModal 
          newWinScore={winScore}
          onClose={() => setShowVaiATresModal(false)}
        />
      )}

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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md z-[100] font-black uppercase tracking-widest text-[8px] lg:text-[10px] animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {showResetConfirm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
              <div className="bg-[#090e1a] border border-white/10 rounded-[1.5rem] p-4 sm:p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
                     <RefreshCwIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white text-center mb-1 uppercase tracking-tighter">Zerar Placar?</h2>
                  <p className="text-white/30 text-center mb-6 sm:mb-8 leading-relaxed text-[8px] sm:text-[10px] uppercase font-bold tracking-widest">
                      O progresso atual será perdido permanentemente.
                  </p>
                  <div className="flex flex-col gap-3">
                      <button onClick={() => handleConfirmReset(false)} className="w-full py-3 sm:py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-red-900/20">Confirmar</button>
                      <button onClick={() => setShowResetConfirm(false)} className="w-full py-3 sm:py-4 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Voltar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Placar;
