import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Player, Match, Team, Arena } from '../types';

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
  const [channelStatus, setChannelStatus] = useState<'connecting' | 'online' | 'offline'>('offline');
  const tvSyncChannelRef = useRef<any>(null);
  const initializedArenaId = useRef<string | null>(null);

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
      
      // Criar mapa de nomes para busca ultra-rápida (O(1))
      const nameMap = new Map();
      p.forEach(pl => nameMap.set(pl.id, pl.name));

      // James: Filtra apenas partidas do dia atual — igual ao filtro 'Hoje' do tablet
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
        .slice(0, 10); // James: Mostra até 10 jogadores, igual ao tablet

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
        rankingDate: new Date().toLocaleDateString('pt-BR'), // James: Data exibida na TV
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

  useEffect(() => {
    if (currentArenaId === 'default') return;
    
    // James: ESCUDO V6 - Só reseta a rádio se a arena mudar DE VERDADE
    if (initializedArenaId.current === currentArenaId && tvSyncChannelRef.current) return;
    initializedArenaId.current = currentArenaId;

    // James: Padronizando emissão Dual-Band
    const curArena = arenas.find(a => a.id === currentArenaId);
    const channelId = curArena?.id || normalize(curArena?.name || 'minhaquadra');
    const channelSlug = normalize(curArena?.name || 'minhaquadra');
    
    if (tvSyncChannelRef.current?.unsubscribe) {
       tvSyncChannelRef.current.unsubscribe();
    } else if (tvSyncChannelRef.current) {
       supabase.removeChannel(tvSyncChannelRef.current);
    }
    
    const names = Array.from(new Set([`sync_arena_${channelId}`, `sync_arena_${channelSlug}`]));
    
    console.log("Tablet: Ligando Transmissão Dual-Band nas frequências:", names.join(', '));
    const channels = names.map(name => supabase.channel(name));
    
    tvSyncChannelRef.current = {
      send: (payload: any) => {
        channels.forEach(ch => ch.send(payload));
      },
      unsubscribe: () => {
        channels.forEach(ch => supabase.removeChannel(ch));
      }
    };
    
    channels.forEach(ch => {
      ch.subscribe((status) => {
        const isOnline = status === 'SUBSCRIBED';
        setChannelStatus(isOnline ? 'online' : 'connecting');
        if (isOnline && currentArenaId !== 'default' && ch === channels[0]) {
          tvSyncChannelRef.current.send({ type: 'broadcast', event: 'TV_SYNC', payload: calculateSnapshot() });
        }
      });
    });

    return () => { 
       // James: Não removemos o canal no Cleanup para manter a rádio viva
    };
  }, [currentArenaId, arenas, calculateSnapshot]);

  // Transmissão Imediata (Triggered)
  useEffect(() => {
    if (tvSyncChannelRef.current) {
      tvSyncChannelRef.current.send({
        type: 'broadcast', event: 'TV_SYNC',
        payload: calculateSnapshot()
      });
    }
  }, [teamA.score, teamB.score, servingTeam, players, matches, calculateSnapshot, isSidesSwitched, tvLayoutMirrored, currentArenaId]);

  // Canal de Ataque
  useEffect(() => {
    if (tvSyncChannelRef.current && tvAttackTime !== null) {
       tvSyncChannelRef.current.send({
         type: 'broadcast', event: 'TV_ATTACK',
         payload: { attackTime: tvAttackTime, senderId }
       });
    }
  }, [tvAttackTime, senderId]);

  // TV Modals
  useEffect(() => {
    if (tvSyncChannelRef.current && (tvModals.victoryData || tvModals.showVaiATres)) {
       tvSyncChannelRef.current.send({
         type: 'broadcast', event: 'TV_MODAL',
         payload: { ...tvModals, senderId }
       });
    }
  }, [tvModals, senderId]);

  // Batimento de Segurança (Heartbeat) V7
  const snapshotRef = useRef(calculateSnapshot);
  // James: ATUALIZAÇÃO SÍNCRONA. Evita o envio de "pontos antigos" caso o usuário
  // pontue exatamente na fração de segundo antes do heartbeat rodar (Problema da "Piscadeira" resolvido).
  snapshotRef.current = calculateSnapshot;

  useEffect(() => {
    console.log("Tablet: Iniciando batimento de segurança imortal (3s)...");
    const interval = setInterval(() => {
      if (tvSyncChannelRef.current) {
        tvSyncChannelRef.current.send({
          type: 'broadcast', event: 'TV_SYNC',
          payload: snapshotRef.current()
        });
      }
    }, 3000); // Relaxado para 3 segundos em produção
    return () => clearInterval(interval);
  }, []);

  const forceSync = useCallback(() => {
    if (tvSyncChannelRef.current) {
      tvSyncChannelRef.current.send({
        type: 'broadcast', event: 'TV_SYNC',
        payload: calculateSnapshot()
      });
    }
  }, [calculateSnapshot]);

  return { channelStatus, forceSync };
};
