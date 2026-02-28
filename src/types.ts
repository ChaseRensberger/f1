export type SessionDriver = {
  position: number;
  code: string;
  team: string;
  tire: "Soft" | "Medium" | "Hard" | "Inter" | "Wet";
  inPit: boolean;
  lastLapMs: number;
  gapsToLeaderMs: number;
};

export type Weekend = {
  round: number;
  grandPrix: string;
  circuit: string;
  country: string;
  startDate: string;
  endDate: string;
  sessions: Array<{ name: string; start: string }>;
};

export type DriverStanding = {
  position: number;
  driver: string;
  team: string;
  points: number;
  wins: number;
};

export type ConstructorStanding = {
  position: number;
  constructor: string;
  points: number;
  wins: number;
};

export type TabName = "Session" | "Schedule" | "Standings";
