
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Team, Match, Arena } from '../types';
import { SoundScheme } from '../App';
import { useAttackTimer, useMatchTimer, useSensoryFeedback } from '../hooks';
import ScoreCard from '../components/ScoreCard';
import CenterConsole from '../components/CenterConsole';
import VictoryModal from '../components/VictoryModal';
import VaiATresModal from '../components/VaiATresModal';
import { RefreshCwIcon, ZapIcon } from '../components/icons';
import { MatchMode } from '../types';

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
  matchMode: MatchMode;
  matchTime: number;
  showAlert?: (title: string, message: string, type?: any, icon?: any) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, type?: any, icon?: any) => void;
}

interface VictoryData {
  winner: 'A' | 'B';
  teamA: Team;
  teamB: Team;
  isCapote: boolean;
  setResults?: { A: number; B: number }[];
}

const Placar: React.FC<PlacarProps> = ({
  allPlayers, onSaveGame, winScore, setWinScore, attackTime, soundEnabled, vibrationEnabled, soundScheme, currentArena,
  teamA, setTeamA, teamB, setTeamB, servingTeam, setServingTeam, history, setHistory,
  isSidesSwitched, setIsSidesSwitched, gameStartTime, setGameStartTime, resetGame,
  capoteEnabled, vaiATresEnabled, matchMode, matchTime, showAlert, showConfirm
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
  const [setResults, setSetResults] = useState<{ A: number; B: number }[]>([]);

  const { playSound, vibrate } = useSensoryFeedback({ soundEnabled, vibrationEnabled, soundScheme });
  const attackTimer = useAttackTimer(attackTime);
  const matchTimer = useMatchTimer(matchTime);

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
    const isSetWon = teamA.score >= winScore || teamB.score >= winScore;
    const setsToWin = matchMode === 'set' ? 2 : 1;
    const matchWon = teamA.sets >= setsToWin || teamB.sets >= setsToWin;
    return { isGameWon: matchWon || capoteWin, isCapoteWin: capoteWin, isSetWon };
  }, [teamA.score, teamB.score, teamA.sets, teamB.sets, winScore, capoteEnabled, initialWinScore, matchMode]);

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
      matchTimer.pause();
      playSound('win');
      vibrate([200, 100, 200]);
      setVictoryData({
        winner: teamA.sets >= 2 || (isCapoteWin && teamA.score > teamB.score) ? 'A' : 'B',
        teamA, teamB, isCapote: isCapoteWin,
        setResults
      });
    } else if (!isGameWon && victoryConfirmed) {
      setVictoryConfirmed(false);
    }
  }, [isGameWon, victoryConfirmed, isCapoteWin, attackTimer, playSound, vibrate, teamA, teamB]);

  useEffect(() => {
    // Reseta a flag de alerta quando uma nova partida é iniciada (placar 0x0 e sem jogadores selecionados)
    if (teamA.score === 0 && teamB.score === 0 && !teamA.players.some(p => p) && !teamB.players.some(p => p)) {
      setAtletasAlertShown(false);
      matchTimer.reset();
    }
  }, [teamA.score, teamB.score, teamA.players, teamB.players]);


  useEffect(() => {
    // Beeps de contagem regressiva
    if (attackTimer.isActive && attackTimer.timeLeft <= 10 && attackTimer.timeLeft > 0) {
      playSound('countdownBeep', isVaiATresActive);
    }

    // Beep final (0 segundos) - agora dispara mesmo se o timer parar (isActive mudando para false)
    if (attackTimer.timeLeft === 0 && !victoryConfirmed) {
      playSound('timerEndBeep', isVaiATresActive);
      vibrate([150, 50, 150]);
    }

    // Beep final da partida (Modo Oficial)
    if (matchMode === 'oficial' && matchTimer.timeLeft === 0 && matchTimer.isActive) {
      playSound('emergencyAlert');
      vibrate([500, 200, 500]);
    }
  }, [attackTimer.timeLeft, attackTimer.isActive, matchTimer.timeLeft, matchTimer.isActive, matchMode, playSound, vibrate, isVaiATresActive, victoryConfirmed]);

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
          // Venceu o Vai a 3: Processar vitória do Set/Partida
          const currentSets = teamData(team).sets;
          const newSets = currentSets + 1;
          const finalScore = teamData(team).score + 1;
          const setsToWin = matchMode === 'set' ? 2 : 1;
          const otherTeam = team === 'A' ? 'B' : 'A';

          const currentSetScore = { 
            A: team === 'A' ? finalScore : teamA.score, 
            B: team === 'B' ? finalScore : teamB.score 
          };

          if (newSets >= setsToWin || isCapoteWin) {
            // Venceu a PARTIDA via Desafio
            const setter = team === 'A' ? setTeamA : setTeamB;
            setter(prev => ({ ...prev, score: finalScore, sets: newSets }));
            setSetResults(prev => [...prev, currentSetScore]);
          } else {
            // Venceu apenas o SET via Desafio
            setSetResults(prev => [...prev, currentSetScore]);
            setTeamA(prev => ({ ...prev, score: 0, sets: team === 'A' ? prev.sets + 1 : prev.sets }));
            setTeamB(prev => ({ ...prev, score: 0, sets: team === 'B' ? prev.sets + 1 : prev.sets }));
            setToastMessage(`Fim do Set! ${newSets} x ${teamData(otherTeam).sets}`);
            if (matchMode === 'oficial') matchTimer.pause();
          }

          setIsVaiATresActive(false);
          setVaiATresScore({ A: 0, B: 0 });
          playSound('win', true);
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

    const athletesMissing = !teamA.players.every(p => p) || !teamB.players.every(p => p);
    if (isIncrement && athletesMissing && !atletasAlertShown) {
      setShowAtletasAlert(true);
      return;
    }

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
    const isPointWin = score >= winScore;

    if (isPointWin && isIncrement) {
      // Venceu o SET
      const currentSetScore = { A: team === 'A' ? score : teamA.score, B: team === 'B' ? score : teamB.score };
      const newSets = teamData(team).sets + 1;
      const setsToWin = matchMode === 'set' ? 2 : 1;
      
      if (newSets >= setsToWin || isCapoteWin) {
        // Venceu a PARTIDA
        setter(prev => ({ ...prev, score, sets: newSets }));
        setSetResults(prev => [...prev, currentSetScore]);
      } else {
        // Venceu apenas o SET intermediário
        setHistory(prev => [...prev, { teamA, teamB, servingTeam }]);
        setSetResults(prev => [...prev, currentSetScore]);
        setTeamA(prev => ({ ...prev, score: 0, sets: team === 'A' ? prev.sets + 1 : prev.sets }));
        setTeamB(prev => ({ ...prev, score: 0, sets: team === 'B' ? prev.sets + 1 : prev.sets }));
        setToastMessage(`Fim do Set! ${(newSets || 0)} x ${(teamData(otherTeam).sets || 0)}`);
        playSound('win');
        vibrate([200, 100, 200]);
        attackTimer.reset();
        if (matchMode === 'oficial') matchTimer.pause();
      }
      return;
    }

    setter(prev => ({ ...prev, score }));

    if (isIncrement) {
      if (!gameStartTime) setGameStartTime(new Date());
      playSound('point');
      vibrate(50);
      attackTimer.reset(); 
      // AUTO-PAUSE no Modo Oficial
      if (matchMode === 'oficial') {
        attackTimer.pause();
        matchTimer.pause();
      }
    }
  }, [isGameWon, isVaiATresActive, teamA, teamB, winScore, matchMode, vaiATresEnabled, playSound, vibrate, setTeamA, setTeamB, setHistory, servingTeam, teamData, attackTimer, matchTimer]);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setTeamA(lastState.teamA);
      setTeamB(lastState.teamB);
      setServingTeam(lastState.servingTeam);
      setHistory(prev => prev.slice(0, -1));
      
      // Se voltarmos de uma virada de set, removemos o último resultado arquivado
      if (lastState.teamA.score >= winScore || lastState.teamB.score >= winScore) {
        setSetResults(prev => prev.slice(0, -1));
      }

      setIsVaiATresActive(false); 
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
    matchTimer.reset();
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
      mode: matchMode,
      setResults
    } as Omit<Match, 'id' | 'timestamp'>;

    onSaveGame(matchData);
    matchTimer.reset();
    setSetResults([]);
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
      if (matchMode === 'oficial') matchTimer.pause();
    } else if (attackTimer.isPaused) {
      attackTimer.resume();
      if (matchMode === 'oficial') matchTimer.resume();
    } else {
      const isStartOfMatch = teamA.score === 0 && teamB.score === 0;
      const athletesMissing = !teamA.players.every(p => p) || !teamB.players.every(p => p);

      if (isStartOfMatch && athletesMissing && !atletasAlertShown) {
        setShowAtletasAlert(true);
        return;
      }
      if (!gameStartTime) setGameStartTime(new Date());
      attackTimer.start();
      if (matchMode === 'oficial') matchTimer.start();
      playSound('timerStartBeep', isVaiATresActive);
    }
  }, [attackTimer, matchTimer, matchMode, playSound, teamA.players, teamB.players, atletasAlertShown, isVaiATresActive]);

  const confirmStartWithoutAthletes = () => {
    setAtletasAlertShown(true);
    setShowAtletasAlert(false);
    if (!gameStartTime) setGameStartTime(new Date());
    attackTimer.start();
    if (matchMode === 'oficial') matchTimer.start();
    playSound('timerStartBeep', isVaiATresActive);
  };

  const teamLeftKey = isSidesSwitched ? 'B' : 'A';
  const teamRightKey = isSidesSwitched ? 'A' : 'B';
  const teamLeft = isSidesSwitched ? teamB : teamA;
  const teamNameLeft = isSidesSwitched ? 'Time 2' : 'Time 1';
  const teamRight = isSidesSwitched ? teamA : teamB;
  const teamNameRight = isSidesSwitched ? 'Time 1' : 'Time 2';

  return (
    <div className="h-full w-full p-1 sm:p-2 lg:p-4 grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[1.1fr_0.7fr_1.1fr] lg:grid-cols-[1.2fr_0.6fr_1.2fr] gap-1 sm:gap-3 lg:gap-6 relative overflow-hidden bg-transparent max-w-[1600px] mx-auto">

      {/* EMERGENCY ALERT BORDER - REMOVED PER NEW APPROACH */}

      {showAtletasAlert && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#030712] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
              <RefreshCwIcon className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Sincronizando Atletas</h2>
            <p className="text-white/40 text-sm mb-8 leading-relaxed uppercase font-bold tracking-widest text-[10px]">
              Deseja iniciar sem selecionar todos os atletas?
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={confirmStartWithoutAthletes}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95"
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowAtletasAlert(false)}
                className="w-full py-4 bg-white/5 text-white/40 hover:text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all"
              >
                Voltar
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
          isVaiATresActive={isVaiATresActive}
          vaiATresScore={vaiATresScore[teamLeftKey]}
          setsWon={teamLeft.sets}
          matchMode={matchMode}
        />
      </div>

      <div className="w-full flex-shrink-0 flex items-center justify-center min-h-0 overflow-hidden relative z-20">
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
          matchTimeLeft={matchTimer.timeLeft}
          matchMode={matchMode}
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
          isVaiATresActive={isVaiATresActive}
          vaiATresScore={vaiATresScore[teamRightKey]}
          setsWon={teamRight.sets}
          matchMode={matchMode}
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
              <button onClick={() => handleConfirmReset(true)} className="w-full py-3 sm:py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-red-900/20">Confirmar</button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full py-3 sm:py-4 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Placar;
