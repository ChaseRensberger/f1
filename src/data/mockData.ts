import type { ConstructorStanding, DriverStanding, SessionDriver, Weekend } from "../types";

export const sessionName = "Race";
export const eventLabel = "Bahrain GP - Lap 39 / 57";

export const sessionDrivers: SessionDriver[] = [
  { position: 1, code: "VER", team: "Red Bull", tire: "Hard", inPit: false, lastLapMs: 94741, gapsToLeaderMs: 0 },
  { position: 2, code: "LEC", team: "Ferrari", tire: "Hard", inPit: false, lastLapMs: 94701, gapsToLeaderMs: 1893 },
  { position: 3, code: "NOR", team: "McLaren", tire: "Medium", inPit: false, lastLapMs: 95008, gapsToLeaderMs: 5680 },
  { position: 4, code: "HAM", team: "Mercedes", tire: "Hard", inPit: false, lastLapMs: 95212, gapsToLeaderMs: 8774 },
  { position: 5, code: "RUS", team: "Mercedes", tire: "Hard", inPit: false, lastLapMs: 95287, gapsToLeaderMs: 11318 },
  { position: 6, code: "SAI", team: "Ferrari", tire: "Medium", inPit: true, lastLapMs: 97322, gapsToLeaderMs: 21497 },
  { position: 7, code: "PIA", team: "McLaren", tire: "Hard", inPit: false, lastLapMs: 95610, gapsToLeaderMs: 25304 },
  { position: 8, code: "ALO", team: "Aston Martin", tire: "Hard", inPit: false, lastLapMs: 95724, gapsToLeaderMs: 30411 },
  { position: 9, code: "TSU", team: "RB", tire: "Medium", inPit: false, lastLapMs: 95866, gapsToLeaderMs: 34782 },
  { position: 10, code: "ALB", team: "Williams", tire: "Hard", inPit: false, lastLapMs: 96014, gapsToLeaderMs: 40428 },
];

export const raceWeekends: Weekend[] = [
  {
    round: 1,
    grandPrix: "Bahrain Grand Prix",
    circuit: "Bahrain International Circuit",
    country: "BHR",
    startDate: "2026-03-06T11:30:00Z",
    endDate: "2026-03-08T18:00:00Z",
    sessions: [
      { name: "FP1", start: "2026-03-06T11:30:00Z" },
      { name: "FP2", start: "2026-03-06T15:00:00Z" },
      { name: "FP3", start: "2026-03-07T12:30:00Z" },
      { name: "Quali", start: "2026-03-07T16:00:00Z" },
      { name: "Race", start: "2026-03-08T16:00:00Z" },
    ],
  },
  {
    round: 2,
    grandPrix: "Saudi Arabian Grand Prix",
    circuit: "Jeddah Corniche Circuit",
    country: "SAU",
    startDate: "2026-03-13T13:30:00Z",
    endDate: "2026-03-15T18:00:00Z",
    sessions: [
      { name: "FP1", start: "2026-03-13T13:30:00Z" },
      { name: "FP2", start: "2026-03-13T17:00:00Z" },
      { name: "FP3", start: "2026-03-14T14:30:00Z" },
      { name: "Quali", start: "2026-03-14T18:00:00Z" },
      { name: "Race", start: "2026-03-15T18:00:00Z" },
    ],
  },
  {
    round: 3,
    grandPrix: "Australian Grand Prix",
    circuit: "Albert Park Circuit",
    country: "AUS",
    startDate: "2026-03-27T01:30:00Z",
    endDate: "2026-03-29T05:00:00Z",
    sessions: [
      { name: "FP1", start: "2026-03-27T01:30:00Z" },
      { name: "FP2", start: "2026-03-27T05:00:00Z" },
      { name: "FP3", start: "2026-03-28T02:30:00Z" },
      { name: "Quali", start: "2026-03-28T06:00:00Z" },
      { name: "Race", start: "2026-03-29T05:00:00Z" },
    ],
  },
  {
    round: 4,
    grandPrix: "Japanese Grand Prix",
    circuit: "Suzuka International Racing Course",
    country: "JPN",
    startDate: "2026-04-10T02:30:00Z",
    endDate: "2026-04-12T05:00:00Z",
    sessions: [
      { name: "FP1", start: "2026-04-10T02:30:00Z" },
      { name: "FP2", start: "2026-04-10T06:00:00Z" },
      { name: "FP3", start: "2026-04-11T03:30:00Z" },
      { name: "Quali", start: "2026-04-11T07:00:00Z" },
      { name: "Race", start: "2026-04-12T05:00:00Z" },
    ],
  },
  {
    round: 5,
    grandPrix: "Miami Grand Prix",
    circuit: "Miami International Autodrome",
    country: "USA",
    startDate: "2026-05-01T17:30:00Z",
    endDate: "2026-05-03T20:00:00Z",
    sessions: [
      { name: "FP1", start: "2026-05-01T17:30:00Z" },
      { name: "Sprint Quali", start: "2026-05-01T21:30:00Z" },
      { name: "Sprint", start: "2026-05-02T17:00:00Z" },
      { name: "Quali", start: "2026-05-02T21:00:00Z" },
      { name: "Race", start: "2026-05-03T20:00:00Z" },
    ],
  },
];

export const constructorStandings: ConstructorStanding[] = [
  { position: 1, constructor: "Red Bull", points: 148, wins: 3 },
  { position: 2, constructor: "Ferrari", points: 136, wins: 1 },
  { position: 3, constructor: "McLaren", points: 131, wins: 1 },
  { position: 4, constructor: "Mercedes", points: 103, wins: 0 },
  { position: 5, constructor: "Aston Martin", points: 54, wins: 0 },
  { position: 6, constructor: "RB", points: 30, wins: 0 },
  { position: 7, constructor: "Williams", points: 20, wins: 0 },
  { position: 8, constructor: "Alpine", points: 10, wins: 0 },
  { position: 9, constructor: "Kick Sauber", points: 4, wins: 0 },
  { position: 10, constructor: "Haas", points: 3, wins: 0 },
];

export const driverStandings: DriverStanding[] = [
  { position: 1, driver: "Max Verstappen", team: "Red Bull", points: 86, wins: 2 },
  { position: 2, driver: "Charles Leclerc", team: "Ferrari", points: 79, wins: 1 },
  { position: 3, driver: "Lando Norris", team: "McLaren", points: 73, wins: 1 },
  { position: 4, driver: "Lewis Hamilton", team: "Mercedes", points: 58, wins: 0 },
  { position: 5, driver: "George Russell", team: "Mercedes", points: 45, wins: 0 },
  { position: 6, driver: "Carlos Sainz", team: "Ferrari", points: 43, wins: 0 },
  { position: 7, driver: "Oscar Piastri", team: "McLaren", points: 41, wins: 0 },
  { position: 8, driver: "Fernando Alonso", team: "Aston Martin", points: 36, wins: 0 },
  { position: 9, driver: "Yuki Tsunoda", team: "RB", points: 17, wins: 0 },
  { position: 10, driver: "Alex Albon", team: "Williams", points: 14, wins: 0 },
];
