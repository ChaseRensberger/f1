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
};

export type ConstructorStanding = {
  position: number;
  constructor: string;
  points: number;
};

export type TabName = "Session" | "Schedule" | "Standings";

// OpenF1 API response types

export type OpenF1Session = {
  session_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_short_name: string;
  country_name: string;
  year: number;
};

export type OpenF1ChampionshipDriver = {
  driver_number: number;
  meeting_key: number;
  session_key: number;
  position_start: number;
  position_current: number;
  points_start: number;
  points_current: number;
};

export type OpenF1ChampionshipTeam = {
  meeting_key: number;
  session_key: number;
  team_name: string;
  position_start: number;
  position_current: number;
  points_start: number;
  points_current: number;
};

export type OpenF1Driver = {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  meeting_key: number;
  session_key: number;
};
