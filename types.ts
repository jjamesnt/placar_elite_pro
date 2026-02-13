
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
  capoteApplied?: boolean;
  vaiATresTriggered?: boolean;
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
  arenas_limit: number;
  athletes_limit: number;
  applied_coupon?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_pct?: number;
  days_bonus: number;
  is_active: boolean;
  used_count: number;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  months_duration: number;
  arenas_limit: number;
  athletes_limit: number;
  is_popular: boolean;
  created_at: string;
}