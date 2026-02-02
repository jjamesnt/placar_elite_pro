
export interface Player {
  id: string;
  name: string;
}

export interface Arena {
  id: string;
  name: string;
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
