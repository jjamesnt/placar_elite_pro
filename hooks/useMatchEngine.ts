import { useCallback, useEffect } from 'react';
import { Team, SoundScheme, MatchMode } from '../types';
import { createStore } from './createStore';

interface MatchState {
  winScore: number;
  attackTime: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundScheme: SoundScheme;
  capoteEnabled: boolean;
  vaiATresEnabled: boolean;
  matchMode: MatchMode;
  matchTime: number;
  teamA: Team;
  teamB: Team;
  servingTeam: 'A' | 'B';
  history: { teamA: Team; teamB: Team; servingTeam: 'A' | 'B' }[];
  isSidesSwitched: boolean;
  gameStartTime: Date | null;
}

const initialState: MatchState = {
  winScore: 15,
  attackTime: 24,
  soundEnabled: true,
  vibrationEnabled: true,
  soundScheme: 'moderno',
  capoteEnabled: true,
  vaiATresEnabled: true,
  matchMode: 'normal',
  matchTime: 12,
  teamA: { players: [undefined, undefined], score: 0, sets: 0 },
  teamB: { players: [undefined, undefined], score: 0, sets: 0 },
  servingTeam: 'A',
  history: [],
  isSidesSwitched: false,
  gameStartTime: null,
};

export const matchStore = createStore<MatchState>(initialState);

// Hook proxy super performante simulando useState global
const createSetter = <K extends keyof MatchState>(key: K) => {
  return (valueOrUpdater: MatchState[K] | ((prev: MatchState[K]) => MatchState[K])) => {
    matchStore.setState((state) => ({
      [key]: typeof valueOrUpdater === 'function' ? (valueOrUpdater as any)(state[key]) : valueOrUpdater
    } as any));
  };
};

export const useMatchEngine = () => {
  // Puxando o estado completo reativo
  const state = matchStore.useStore(s => s);

  // Setters globais memoizados
  const setWinScore = useCallback(createSetter('winScore'), []);
  const setAttackTime = useCallback(createSetter('attackTime'), []);
  const setSoundEnabled = useCallback(createSetter('soundEnabled'), []);
  const setVibrationEnabled = useCallback(createSetter('vibrationEnabled'), []);
  const setSoundScheme = useCallback(createSetter('soundScheme'), []);
  const setCapoteEnabled = useCallback(createSetter('capoteEnabled'), []);
  const setVaiATresEnabled = useCallback(createSetter('vaiATresEnabled'), []);
  const setMatchMode = useCallback(createSetter('matchMode'), []);
  const setMatchTime = useCallback(createSetter('matchTime'), []);
  const setTeamA = useCallback(createSetter('teamA'), []);
  const setTeamB = useCallback(createSetter('teamB'), []);
  const setServingTeam = useCallback(createSetter('servingTeam'), []);
  const setHistory = useCallback(createSetter('history'), []);
  const setIsSidesSwitched = useCallback(createSetter('isSidesSwitched'), []);
  const setGameStartTime = useCallback(createSetter('gameStartTime'), []);

  const handleResetGame = useCallback((fullReset: boolean = false, clearTvModals?: () => void) => {
    matchStore.setState(prev => {
      const newState: Partial<MatchState> = {
        teamA: { 
          ...prev.teamA, 
          score: 0, 
          sets: fullReset ? 0 : prev.teamA.sets,
          players: fullReset ? [undefined, undefined] : prev.teamA.players
        },
        teamB: { 
          ...prev.teamB, 
          score: 0, 
          sets: fullReset ? 0 : prev.teamB.sets,
          players: fullReset ? [undefined, undefined] : prev.teamB.players
        },
        history: [],
        gameStartTime: null
      };
      if (clearTvModals) clearTvModals();
      return newState;
    });
  }, []);

  return {
    ...state,
    setWinScore, setAttackTime, setSoundEnabled, setVibrationEnabled, setSoundScheme,
    setCapoteEnabled, setVaiATresEnabled, setMatchMode, setMatchTime,
    setTeamA, setTeamB, setServingTeam, setHistory, setIsSidesSwitched, setGameStartTime,
    handleResetGame
  };
};

// Carregador fora do React Cycle (Usado no App.tsx ao trocar quadra)
export const setupArenaConfig = (currentArenaId: string) => {
  if (currentArenaId && currentArenaId !== 'default') {
    const prefix = `elite_arena_${currentArenaId}_`;
    matchStore.setState({
      winScore: Number(localStorage.getItem(`${prefix}winScore`)) || 15,
      attackTime: Number(localStorage.getItem(`${prefix}attackTime`)) || 24,
      soundEnabled: localStorage.getItem(`${prefix}soundEnabled`) !== 'false',
      vibrationEnabled: localStorage.getItem(`${prefix}vibrationEnabled`) !== 'false',
      soundScheme: (localStorage.getItem(`${prefix}soundScheme`) as SoundScheme) || 'moderno',
      capoteEnabled: localStorage.getItem(`${prefix}capoteEnabled`) !== 'false',
      vaiATresEnabled: localStorage.getItem(`${prefix}vaiATresEnabled`) !== 'false',
      matchMode: (localStorage.getItem(`${prefix}matchMode`) as MatchMode) || 'normal',
      matchTime: Number(localStorage.getItem(`${prefix}matchTime`)) || 12
    });
  }
};
