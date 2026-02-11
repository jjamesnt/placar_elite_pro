
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Team, Match, Arena } from '../types';
import { SoundScheme } from '../App';
import { useAttackTimer, useSensoryFeedback } from '../hooks';
import ScoreCard from '../components/ScoreCard';
import CenterConsole from '../components/CenterConsole';
import VictoryModal from '../components/VictoryModal';
import VaiATresModal from '../components/VaiATresModal';
import { RefreshCwIcon, ZapIcon } from '../components/icons';

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
  const [showAtletasAlert, setShowAtletasAlert] = useState(false);
  const [atletasAlertShown, setAtletasAlertShown] = useState(false);
  const [victoryConfirmed, setVictoryConfirmed] = useState(false);
  const [isVaiATresActive, setIsVaiATresActive] = useState(false);
  const [vaiATresScore, setVaiATresScore] = useState<{ A: number; B: number }>({ A: 0, B: 0 });

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
    if (isGameWon && !victoryConfirmed) {
      setVictoryConfirmed(true);
      attackTimer.reset();
      playSound('win');
      vibrate([200, 100, 200]);
      setVictoryData({
        winner: teamA.score > teamB.score ? 'A' : 'B',
        teamA, teamB, isCapote: isCapoteWin
      });
    } else if (!isGameWon && victoryConfirmed) {
      setVictoryConfirmed(false);
    }
  }, [isGameWon, victoryConfirmed, isCapoteWin, attackTimer, playSound, vibrate, teamA, teamB]);


  useEffect(() => {
    if (attackTimer.isActive) {
      if (attackTimer.timeLeft <= 10 && attackTimer.timeLeft > 0) {
        playSound('countdownBeep', isVaiATresActive);
      } else if (attackTimer.timeLeft === 0) {
        playSound('timerEndBeep', isVaiATresActive);
        vibrate([150, 50, 150]);
      }
    }
  }, [attackTimer.timeLeft, attackTimer.isActive, playSound, vibrate, isVaiATresActive]);

  const teamData = useCallback((key: 'A' | 'B') => key === 'A' ? teamA : teamB, [teamA, teamB]);

  const handleScoreChange = useCallback((team: 'A' | 'B', score: number) => {
    if (isGameWon) return;

    // Lógica do NOVO Vai a 3 (Mini-Jogo)
    if (isVaiATresActive) {
      setVaiATresScore(prev => {
        const currentScore = prev[team];
        const isIncrement = score > teamData(team).score; // Ponto grande não muda, então comparamos com o fixo no empate

        // Simular incremento no mini-placar (0 a 3)
        let newMiniScore = isIncrement ? currentScore + 1 : currentScore - 1;
        newMiniScore = Math.max(0, Math.min(3, newMiniScore));

        const updated = { ...prev, [team]: newMiniScore };

        if (newMiniScore === 3) {
          // Venceu o Vai a 3: Adicionar 1 ponto no placar principal
          const setter = team === 'A' ? setTeamA : setTeamB;
          setter(current => ({ ...current, score: current.score + 1 }));
          setIsVaiATresActive(false);
          setVaiATresScore({ A: 0, B: 0 });
          playSound('win', true); // Vitória de emergência
          vibrate([100, 50, 100, 50, 300]);
        } else {
          playSound('point', true); // Ponto de emergência
          vibrate(50);
        }
        attackTimer.reset(); // Zera o cronômetro normalmente no Vai a 3
        return updated;
      });
      return;
    }

    // Lógica Normal
    const otherTeam = team === 'A' ? 'B' : 'A';
    const currentScore = teamData(team).score;
    const isIncrement = score > currentScore;

    setHistory(prev => [...prev, { teamA, teamB, servingTeam }]);

    // Gatilho do Vai a 3: Empate no Match Point-1 (Ex: 14x14 num jogo de 15)
    if (isIncrement && score === (winScore - 1) && teamData(otherTeam).score === (winScore - 1) && vaiATresEnabled) {
      const setter = team === 'A' ? setTeamA : setTeamB;
      setter(prev => ({ ...prev, score })); // Seta o empate
      setIsVaiATresActive(true);
      setVaiATresScore({ A: 0, B: 0 });
      setShowVaiATresModal(true); // Alerta inicial via modal
      playSound('emergencyAlert'); // NOVO SOM DE EMERGÊNCIA
      vibrate([200, 100, 200, 100, 200]);
      return;
    }

    const setter = team === 'A' ? setTeamA : setTeamB;
    setter(prev => ({ ...prev, score }));

    if (isIncrement) {
      playSound('point');
      vibrate(50);
    }
  }, [isGameWon, isVaiATresActive, teamA, teamB, winScore, vaiATresEnabled, playSound, vibrate, setTeamA, setTeamB, setHistory, servingTeam, teamData]);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setTeamA(lastState.teamA);
      setTeamB(lastState.teamB);
      setServingTeam(lastState.servingTeam);
      setHistory(prev => prev.slice(0, -1));
      setIsVaiATresActive(false); // Resetar disputa se voltar do empate
      setVaiATresScore({ A: 0, B: 0 });
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
    setAtletasAlertShown(false);
    setIsVaiATresActive(false);
    setVaiATresScore({ A: 0, B: 0 });
    vibrate([100, 50, 100]);
    playSound('error');
  };

  const saveGame = useCallback(() => {
    const duration = gameStartTime ? Math.round((new Date().getTime() - gameStartTime.getTime()) / 60000) : 0;

    const matchData = {
      teamA: { players: teamA.players.filter(p => p) as Player[], score: teamA.score },
      teamB: { players: teamB.players.filter(p => p) as Player[], score: teamB.score },
      winner: teamA.score > teamB.score ? 'A' : 'B',
      duration,
      capoteApplied: isCapoteWin,
      // Vai a 3 agora é identificado pela ativação da disputa ou placar final apertado
      vaiATresTriggered: teamA.score === winScore && teamB.score === winScore - 1 || teamB.score === winScore && teamA.score === winScore - 1,
    } as Omit<Match, 'id' | 'timestamp'>;

    onSaveGame(matchData);
    setToastMessage("Vitória registrada! Nova partida iniciada.");
    setVictoryData(null);
    setVictoryConfirmed(true);
  }, [isGameWon, teamA, teamB, onSaveGame, gameStartTime, isCapoteWin, winScore]);

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
      const athletesMissing = !teamA.players.every(p => p) || !teamB.players.every(p => p);
      if (athletesMissing && !atletasAlertShown) {
        setShowAtletasAlert(true);
        return;
      }
      attackTimer.start();
      playSound('timerStartBeep', isVaiATresActive);
    }
  }, [attackTimer, playSound, teamA.players, teamB.players, atletasAlertShown, isVaiATresActive]);

  const confirmStartWithoutAthletes = () => {
    setAtletasAlertShown(true);
    setShowAtletasAlert(false);
    attackTimer.start();
    playSound('timerStartBeep', isVaiATresActive);
  };

  const teamLeftKey = isSidesSwitched ? 'B' : 'A';
  const teamRightKey = isSidesSwitched ? 'A' : 'B';
  const teamLeft = isSidesSwitched ? teamB : teamA;
  const teamNameLeft = isSidesSwitched ? 'Time 2' : 'Time 1';
  const teamRight = isSidesSwitched ? teamA : teamB;
  const teamNameRight = isSidesSwitched ? 'Time 1' : 'Time 2';

  return (
    <div className="h-full w-full p-1 sm:p-2 lg:p-4 grid grid-cols-[1fr_0.8fr_1fr] md:grid-cols-[1.1fr_0.7fr_1.1fr] lg:grid-cols-[1.2fr_0.6fr_1.2fr] gap-1 sm:gap-3 lg:gap-6 relative overflow-hidden bg-transparent max-w-[1600px] mx-auto">

      {/* EMERGENCY ALERT BORDER - VAI A TRES */}
      {isVaiATresActive && (
        <div className="fixed top-0 left-0 w-full z-[100] animate-in slide-in-from-top duration-500">
          <div className="bg-yellow-500 overflow-hidden relative group">
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000,#000_20px,#fff_20px,#fff_40px)] animate-[pulse_1.5s_infinite]"></div>
            <div className="relative flex items-center justify-between px-4 sm:px-12 py-3 sm:py-5 border-b-4 border-black/20">
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-black rounded-xl flex items-center justify-center animate-pulse shadow-lg">
                  <ZapIcon className="w-5 h-5 sm:w-8 sm:h-8 text-yellow-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[14px] font-black text-black uppercase tracking-[0.2em] leading-none mb-1">Status Crítico</span>
                  <h3 className="text-2xl sm:text-5xl font-black text-black uppercase tracking-tighter leading-none italic drop-shadow-sm">VAI A 3!</h3>
                </div>
              </div>

              {/* MINI SCOREBOARD */}
              <div className="flex items-center gap-4 sm:gap-14 bg-black/15 px-6 sm:px-12 py-3 sm:py-5 rounded-[2rem] border-2 border-black/10 shadow-2xl backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] sm:text-[14px] font-black text-black/60 uppercase mb-2 tracking-widest">{teamNameLeft}</span>
                  <span className="text-4xl sm:text-8xl font-mono font-black text-black leading-none drop-shadow-md">{vaiATresScore[teamLeftKey]}</span>
                </div>
                <div className="text-4xl sm:text-8xl font-black text-black/20 -mt-2 sm:-mt-4 italic select-none">VS</div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] sm:text-[14px] font-black text-black/60 uppercase mb-2 tracking-widest">{teamNameRight}</span>
                  <span className="text-4xl sm:text-8xl font-mono font-black text-black leading-none drop-shadow-md">{vaiATresScore[teamRightKey]}</span>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-end gap-1">
                <span className="text-[8px] font-black text-black/60 uppercase tracking-[0.3em]">Modo Decisivo Ativo</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-4 h-1 bg-black/20 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-black animate-[shimmer_2s_infinite]" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  </div>)}
                </div>
              </div>
            </div>
          </div>
          {/* Pulsing red overlay lines */}
          <div className="absolute top-full left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse"></div>
        </div>
      )}

      {showAtletasAlert && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#030712] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl text-center">
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto text-yellow-500">
              <ZapIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Atletas não selecionados</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Você ainda não selecionou todos os atletas. Deseja continuar assim mesmo ou voltar para selecionar?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmStartWithoutAthletes}
                className="w-full py-4 bg-white/5 text-white hover:bg-white/10 rounded-xl font-black uppercase text-xs tracking-widest transition-all"
              >
                Continuar assim mesmo
              </button>
              <button
                onClick={() => setShowAtletasAlert(false)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 transition-all"
              >
                Voltar e selecionar
              </button>
            </div>
          </div>
        </div>
      )}

      {victoryData && (
        <VictoryModal
          victoryData={victoryData}
          onClose={() => setVictoryData(null)}
          onSave={saveGame}
          onNewGame={() => handleConfirmReset(true)}
          onUndo={() => {
            handleUndo();
            setVictoryData(null);
          }}
          arenaColor={currentArena.color}
        />
      )}

      {showVaiATresModal && (
        <VaiATresModal
          onClose={() => setShowVaiATresModal(false)}
          onUndo={() => {
            handleUndo();
            setShowVaiATresModal(false);
          }}
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
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600/95 text-white px-8 py-4 rounded-[2rem] shadow-2xl backdrop-blur-xl z-[200] font-black uppercase tracking-widest text-[10px] lg:text-[14px] animate-in fade-in zoom-in duration-300 border border-white/20">
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
