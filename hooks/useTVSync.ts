import { useState, useRef, useEffect, useCallback } from 'react';
import { Player, Match, Team, Arena } from '../types';
import { ArenaAPI } from '../lib/api';

const normalize = (str: string) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '').trim();

interface TVSyncProps {
  senderId: string;
  arenas: Arena[];
  currentArenaId: string;
  players: Player[];
  matches: Match[];
  teamA: Team;
  teamB: Team;
  servingTeam: 'A' | 'B';
  gameStartTime: Date | null;
  tvModals: { victoryData: any, showVaiATres: boolean };
  tvAttackTime: number | null;
  isSidesSwitched: boolean;
  tvLayoutMirrored: boolean;
}

export const useTVSync = ({
  senderId,
  arenas,
  currentArenaId,
  players,
  matches,
  teamA,
  teamB,
  servingTeam,
  gameStartTime,
  tvModals,
  tvAttackTime,
  isSidesSwitched,
  tvLayoutMirrored
}: TVSyncProps) => {
  const [channelStatus, setChannelStatus] = useState<'connecting' | 'online' | 'offline'>('online');
  const lastSentFingerprint = useRef<string | null>(null);

  const calculateSnapshot = useCallback(() => {
      const ars = arenas;
      const p = players;
      const m = matches;
      const tA = teamA;
      const tB = teamB;
      const sT = servingTeam;
      const gS = gameStartTime;
      const cA = currentArenaId;
      
      const curArena = ars.find(a => a.id === cA);
      const arenaMatches = m.filter(match => match.arena_id?.toLowerCase() === cA?.toLowerCase());
      
      const nameMap = new Map();
      p.forEach(pl => nameMap.set(pl.id, pl.name));

      const today = new Date().toDateString();
      const todayMatches = arenaMatches.filter(match => new Date(match.timestamp).toDateString() === today);

      const playerStats = new Map<string, { wins: number, games: number, name: string }>();
      todayMatches.forEach(match => {
          const winner = match.winner === 'A' ? match.teamA : match.teamB;
          [match.teamA, match.teamB].forEach(t => { t.players.forEach(pl => {
              if (pl && !playerStats.has(pl.id)) playerStats.set(pl.id, { wins: 0, games: 0, name: nameMap.get(pl.id) || pl.name });
              const ps = pl ? playerStats.get(pl.id) : null;
              if (ps) {
                ps.games++;
                if (winner.players.some(wp => wp && wp.id === pl.id)) ps.wins++;
              }
          });});
      });

      const ranking = Array.from(playerStats.values())
        .sort((a, b) => b.wins - a.wins || (b.wins/b.games) - (a.wins/a.games) || a.name.localeCompare(b.name))
        .slice(0, 10);

      const history = todayMatches.slice(0, 20).map(match => ({
          id: match.id,
          teamA: { score: match.teamA.score, players: match.teamA.players.map((plyr: any) => nameMap.get(plyr?.id) || plyr?.name || '---') },
          teamB: { score: match.teamB.score, players: match.teamB.players.map((plyr: any) => nameMap.get(plyr?.id) || plyr?.name || '---') },
          winner: match.winner
      }));

      return {
        senderId, 
        arenaId: cA?.toLowerCase(),
        arenaSlug: normalize(curArena?.name || ''),
        arenaName: curArena?.name || 'ARENA',
        arenaColor: curArena?.color || 'indigo',
        rankingDate: new Date().toLocaleDateString('pt-BR'),
        activeMatch: { 
          teamA: tA, teamB: tB, servingTeam: sT, gameStartTime: gS, status: 'playing',
          modals: tvModals,
          attackTime: tvAttackTime,
          isSidesSwitched: isSidesSwitched,
          layoutMirrored: tvLayoutMirrored
        },
        ranking,
        history
      };
  }, [tvModals, matches, arenas, players, teamA, teamB, servingTeam, gameStartTime, currentArenaId, senderId, isSidesSwitched, tvLayoutMirrored]);

  const pushToDatabase = useCallback(async (payload: any) => {
    if (currentArenaId === 'default') return;
    
    // Calcula o fingerprint pra evitar escritas desnecessárias no banco (Economiza banda no Supabase)
    const newFinger = JSON.stringify(payload);
    if (lastSentFingerprint.current === newFinger) return; // Nenhuma novidade real, ignora db write
    lastSentFingerprint.current = newFinger;

    try {
      await ArenaAPI.updateLiveState(currentArenaId, payload);
    } catch (e) {
      console.error("Falha ao transacionar o placar ao vivo pelo Supabase Postgres:", e);
    }
  }, [currentArenaId]);

  // Transmissão Imediata (Triggered)
  useEffect(() => {
    pushToDatabase(calculateSnapshot());
  }, [teamA.score, teamB.score, servingTeam, players, matches, calculateSnapshot, isSidesSwitched, tvLayoutMirrored, tvAttackTime, tvModals]);

  // Batimento de Segurança (Heartbeat) - Agora focado apenas em evitar dessincronia
  const snapshotRef = useRef(calculateSnapshot);
  snapshotRef.current = calculateSnapshot;

  useEffect(() => {
    console.log("Tablet: Iniciando sincronizador de banco de dados nativo (3s)...");
    const interval = setInterval(() => {
      pushToDatabase(snapshotRef.current());
    }, 3000); 
    return () => clearInterval(interval);
  }, [pushToDatabase]);

  const forceSync = useCallback(() => {
    pushToDatabase(calculateSnapshot());
  }, [calculateSnapshot, pushToDatabase]);

  return { channelStatus, forceSync };
};
