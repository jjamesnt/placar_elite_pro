import { supabase } from './supabase';
import { ArenaColor } from '../types'; // I need to verify if types.ts has this.
// Assuming Match type can be partially typed here or imported
// Let's import Any for now to keep it safe during extraction

export const MatchAPI = {
  saveMatch: async (arenaId: string, userId: string, matchData: any) => {
    return await supabase.from('matches').insert([{ 
      arena_id: arenaId, 
      user_id: userId, 
      data_json: matchData 
    }]).select().single();
  },
  
  deleteMatch: async (matchId: string) => {
    return await supabase.from('matches').delete().eq('id', matchId);
  },
  
  updateMatch: async (matchId: string, updatedData: any) => {
    return await supabase.from('matches').update({ data_json: updatedData }).eq('id', matchId);
  },
  
  fetchMatches: async (arenaId: string, limit: number = 50) => {
    return await supabase.from('matches').select('*').eq('arena_id', arenaId).order('created_at', { ascending: false }).limit(limit);
  }
};

export const PlayerAPI = {
  fetchPlayers: async (arenaId: string) => {
    return await supabase.from('players').select('*').eq('arena_id', arenaId);
  }
};

export const ArenaAPI = {
  addArena: async (name: string, color: string, userId: string) => {
    return await supabase.from('arenas').insert([{ 
      name, 
      color, 
      user_id: userId 
    }]).select().single();
  },
  
  updateArena: async (id: string, name: string, color: string) => {
    return await supabase.from('arenas').update({ name, color }).eq('id', id);
  },
  
  deleteArena: async (id: string) => {
    return await supabase.from('arenas').delete().eq('id', id);
  }
};
