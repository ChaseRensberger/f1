export type TeamPalette = {
  stripe: string;
  bg: string;
  fg: string;
};

const teamPalettes: Record<string, TeamPalette> = {
  "Red Bull": { stripe: "#1E5BC6", bg: "#0B172F", fg: "#DCE9FF" },
  Ferrari: { stripe: "#DC0000", bg: "#2A0B0B", fg: "#FFE1E1" },
  McLaren: { stripe: "#FF8700", bg: "#2A1908", fg: "#FFE8CC" },
  Mercedes: { stripe: "#00D2BE", bg: "#072A25", fg: "#D7FFF9" },
  "Aston Martin": { stripe: "#006F62", bg: "#071F1C", fg: "#D5FFF8" },
  Williams: { stripe: "#005AFF", bg: "#091631", fg: "#DCE5FF" },
  Alpine: { stripe: "#FF87BC", bg: "#29111E", fg: "#FFE0EE" },
  "Kick Sauber": { stripe: "#52E252", bg: "#0E2410", fg: "#E5FFE5" },
  Haas: { stripe: "#B6BABD", bg: "#1F2225", fg: "#F2F5F8" },
  "Racing Bulls": { stripe: "#6692FF", bg: "#101B33", fg: "#DFE8FF" },
  RB: { stripe: "#6692FF", bg: "#101B33", fg: "#DFE8FF" },
  Cadillac: { stripe: "#909090", bg: "#1A1D20", fg: "#E8EAED" },
  Audi: { stripe: "#F50537", bg: "#2A0810", fg: "#FFD6DF" },
};

const defaultPalette: TeamPalette = { stripe: "#7C8EA3", bg: "#1A2432", fg: "#E4ECF5" };

export function paletteForTeam(team: string): TeamPalette {
  return teamPalettes[team] ?? defaultPalette;
}
