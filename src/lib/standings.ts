import { fetchAPI } from "./api";
import type {
	ConstructorStanding,
	DriverStanding,
	OpenF1ChampionshipDriver,
	OpenF1ChampionshipTeam,
	OpenF1Driver,
	OpenF1Session,
} from "../types";

let sessionKeyPromise: Promise<number> | null = null;
let driverCache: DriverStanding[] | null = null;
let constructorCache: ConstructorStanding[] | null = null;

function findLatestRaceSessionKey(): Promise<number> {
	if (!sessionKeyPromise) {
		sessionKeyPromise = _findLatestRaceSessionKey();
	}
	return sessionKeyPromise;
}

async function _findLatestRaceSessionKey(): Promise<number> {
	const currentYear = new Date().getFullYear();

	let sessions = await fetchAPI<OpenF1Session[]>("sessions", {
		session_name: "Race",
		year: String(currentYear),
	});

	const now = new Date();
	let pastSessions = sessions.filter((s) => new Date(s.date_end) < now);

	if (pastSessions.length === 0) {
		sessions = await fetchAPI<OpenF1Session[]>("sessions", {
			session_name: "Race",
			year: String(currentYear - 1),
		});
		pastSessions = sessions.filter((s) => new Date(s.date_end) < now);
	}

	if (pastSessions.length === 0) {
		throw new Error("No completed race sessions found");
	}

	const latest = pastSessions[pastSessions.length - 1]!;
	return latest.session_key;
}

function formatDriverName(fullName: string): string {
	return fullName
		.split(" ")
		.map((part) => {
			if (part === part.toUpperCase() && part.length > 1) {
				return part.charAt(0) + part.slice(1).toLowerCase();
			}
			return part;
		})
		.join(" ");
}

const teamNameMap: Record<string, string> = {
	"Red Bull Racing": "Red Bull",
	"Racing Bulls": "Racing Bulls",
	"Haas F1 Team": "Haas",
	"Kick Sauber": "Kick Sauber",
	"Aston Martin": "Aston Martin",
	McLaren: "McLaren",
	Ferrari: "Ferrari",
	Mercedes: "Mercedes",
	Alpine: "Alpine",
	Williams: "Williams",
	Cadillac: "Cadillac",
	Audi: "Audi",
	RB: "RB",
};

function normalizeTeamName(apiName: string): string {
	return teamNameMap[apiName] ?? apiName;
}

export async function fetchDriverStandings(): Promise<DriverStanding[]> {
	if (driverCache) return driverCache;

	const sessionKey = await findLatestRaceSessionKey();
	const sessionKeyStr = String(sessionKey);

	const [championship, drivers] = await Promise.all([
		fetchAPI<OpenF1ChampionshipDriver[]>("championship_drivers", {
			session_key: sessionKeyStr,
		}),
		fetchAPI<OpenF1Driver[]>("drivers", {
			session_key: sessionKeyStr,
		}),
	]);

	if (championship.length === 0) {
		throw new Error("No championship data available for this session");
	}

	const driverMap = new Map<number, OpenF1Driver>();
	for (const d of drivers) {
		driverMap.set(d.driver_number, d);
	}

	const result = championship
		.map((entry) => {
			const driver = driverMap.get(entry.driver_number);
			return {
				position: entry.position_current,
				driver: driver
					? formatDriverName(driver.full_name)
					: `Driver #${entry.driver_number}`,
				team: driver
					? normalizeTeamName(driver.team_name)
					: "Unknown",
				points: entry.points_current,
			};
		})
		.sort((a, b) => a.position - b.position);

	driverCache = result;
	return result;
}

export async function fetchConstructorStandings(): Promise<
	ConstructorStanding[]
> {
	if (constructorCache) return constructorCache;

	const sessionKey = await findLatestRaceSessionKey();

	const championship = await fetchAPI<OpenF1ChampionshipTeam[]>(
		"championship_teams",
		{ session_key: String(sessionKey) },
	);

	if (championship.length === 0) {
		throw new Error("No championship data available for this session");
	}

	const result = championship
		.map((entry) => ({
			position: entry.position_current,
			constructor: normalizeTeamName(entry.team_name),
			points: entry.points_current,
		}))
		.sort((a, b) => a.position - b.position);

	constructorCache = result;
	return result;
}
