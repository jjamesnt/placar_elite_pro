import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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
  lastInteractionTime: number;
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
  tvLayoutMirrored,
  lastInteractionTime
}: TVSyncProps) => {
  const [channelStatus, setChannelStatus] = useState<'connecting' | 'online' | 'offline'>('offline');
  const tvSyncChannelRef = useRef<any>(null);
  const masterChannelRef = useRef<any>(null); // James: Canal mestre persistente para Follow-Me
  const arenaBroadcastRef = useRef<any>(null); // James: Canal broadcast para TVs sem autenticação
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

      // James: Filtra apenas partidas do dia atual — suporte robusto a campos e fusos
      const today = new Date().toDateString();
      const todayMatches = arenaMatches.filter(match => {
        const mDate = match.timestamp || (match as any).created_at;
        if (!mDate) return false;
        try {
          return new Date(mDate).toDateString() === today;
        } catch (e) {
          return false;
        }
      });

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
        env: import.meta.env.DEV ? 'dev' : 'prod', // James: Identifica o ambiente para evitar cross-env
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
        history,
        lastInteractionTime
      };
  }, [tvModals, matches, arenas, players, teamA, teamB, servingTeam, gameStartTime, currentArenaId, senderId, isSidesSwitched, tvLayoutMirrored, lastInteractionTime, tvAttackTime]);

  useEffect(() => {
    if (currentArenaId === 'default') return;
    
    // James: ESCUDO V6 - Só reseta a rádio se a arena mudar DE VERDADE
    if (initializedArenaId.current === currentArenaId && tvSyncChannelRef.current) return;
    initializedArenaId.current = currentArenaId;

    const curArena = arenas.find(a => a.id === currentArenaId);
    if (!curArena) return;
    
    if (tvSyncChannelRef.current?.unsubscribe) {
       tvSyncChannelRef.current.unsubscribe();
    }
    
    // James: TRANSFORMAÇÃO PARA POSTGRES SYNC V9 (Blindagem Atômica e Fingerprint DB)
    console.log("Tablet: Rádio ligada em modo Nativo-DB na arena:", currentArenaId);
    setChannelStatus('online');
    
    let lastPushedFingerprint = "";

    const pushToDatabase = async (payload: any) => {
        // Gera um shield rápido (fingerprint) antes de engajar o DB
        // James: Incluímos o tamanho do histórico para que deleções/adições forcem um push
        const historyHash = payload.history?.length || 0;
        const lastMatchId = payload.history?.[0]?.id || '';
        const newFinger = `${payload.arenaColor}|${payload.activeMatch?.teamA?.score}|${payload.activeMatch?.teamB?.score}|${payload.activeMatch?.servingTeam}|${payload.activeMatch?.modals?.victoryData?.winner}|${payload.lastInteractionTime}|H${historyHash}|L${lastMatchId}`;
        
        if (newFinger === lastPushedFingerprint) return;
        lastPushedFingerprint = newFinger;

        try {
           await ArenaAPI.updateLiveState(currentArenaId, payload);
        } catch (e) {
           console.error("DB Sync Push Error:", e);
           lastPushedFingerprint = ""; // Destranca re-tentativa na falha
        }
    };

    tvSyncChannelRef.current = {
      send: (data: any) => {
         if (data.payload) {
             pushToDatabase(data.payload);
         }
      },
      unsubscribe: () => {
        setChannelStatus('offline');
      }
    };
    
    // James: CANAL BROADCAST PERSISTENTE — funciona sem autenticação (TV Box anônima)
    // Prefixo de ambiente evita que o servidor local interfira na produção
    const ENV_PREFIX = import.meta.env.DEV ? 'dev' : 'prod';
    const safeArenaId = currentArenaId.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const broadcastChannelName = `${ENV_PREFIX}_tv_live_${safeArenaId.substring(0, 20)}`;
    if (arenaBroadcastRef.current) {
      try { supabase.removeChannel(arenaBroadcastRef.current); } catch(e) {}
    }
    const broadcastCh = supabase.channel(broadcastChannelName);
    broadcastCh.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Tablet: Canal broadcast TV ativo:', broadcastChannelName);
        // Envia o snapshot imediatamente ao conectar
        broadcastCh.send({ type: 'broadcast', event: 'TV_SYNC', payload: calculateSnapshot() });
      }
    });
    arenaBroadcastRef.current = broadcastCh;

    // James: CANAL MESTRE PERSISTENTE — criado uma única vez para o Follow-Me da TV
    // Em vez de criar/destruir a cada 3s (que não garante entrega), mantém um canal vivo.
    if (!masterChannelRef.current) {
      const shortToken = senderId.replace(/-/g, '').substring(0, 8);
      const mc = supabase.channel(`master_control_${shortToken}`);
      mc.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Tablet: Canal mestre Follow-Me conectado:', shortToken);
          mc.send({
            type: 'broadcast',
            event: 'TV_MIGRATE',
            payload: { arenaId: currentArenaId }
          });
        }
      });
      masterChannelRef.current = mc;
    }

    return () => { 
       // James: Não removemos o canal no Cleanup para manter a rádio viva
    };
  }, [currentArenaId, arenas, calculateSnapshot, senderId]);

  // Transmissão Imediata (Triggered) — DB + Broadcast em paralelo
  // James: tvAttackTime incluído para broadcast a cada segundo do cronômetro de posse
  useEffect(() => {
    const snap = calculateSnapshot();
    if (tvSyncChannelRef.current) {
      tvSyncChannelRef.current.send({ type: 'broadcast', event: 'TV_SYNC', payload: snap });
    }
    if (arenaBroadcastRef.current) {
      arenaBroadcastRef.current.send({ type: 'broadcast', event: 'TV_SYNC', payload: snap });
    }
  }, [teamA.score, teamB.score, servingTeam, tvAttackTime, players, matches, calculateSnapshot, isSidesSwitched, tvLayoutMirrored, currentArenaId, lastInteractionTime]);

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

        // James: MASTER COMMAND + BROADCAST DUAL — canal mestre + canal broadcast persistência
        if (masterChannelRef.current) {
          const snap = snapshotRef.current();
          masterChannelRef.current.send({
            type: 'broadcast', event: 'TV_MIGRATE', payload: { arenaId: snap.arenaId }
          });
        }
      }
      // James: Broadcast é INDEPENDENTE do tvSyncChannelRef (não para se DB está indisponível)
      if (arenaBroadcastRef.current) {
        arenaBroadcastRef.current.send({
          type: 'broadcast', event: 'TV_SYNC', payload: snapshotRef.current()
        });
      }
    }, 1000); // James: Reduzido para 1s — mais responsivo durante o jogo
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
