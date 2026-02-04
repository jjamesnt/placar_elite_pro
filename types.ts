
export interface Player {
  id: string;
  name: string;
}

export type ArenaColor = 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';

export interface Arena {
  id: string;
  name: string;
  color?: ArenaColor;
}

export interface Team {
  players: (Player | undefined)[];
  score: number;
}

export interface TeamInMatch {
  players: Player[];
  score: number;
}

export interface Match {
  id: string;
  teamA: TeamInMatch;
  teamB: TeamInMatch;
  winner: 'A' | 'B';
  timestamp: Date;
  duration: number; // Duração em minutos
}

export interface UserProfile {
  id: string;
  email: string;
  is_admin: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface UserLicense {
  id: string;
  user_id: string;
  email: string;
  expires_at: string;
  is_active: boolean;
  first_access_done: boolean;
  created_at: string;
}
