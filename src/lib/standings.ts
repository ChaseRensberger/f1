import { fetchAPI } from "./api";
import type {
	ConstructorStanding,
	DriverStanding,
	OpenF1ChampionshipDriver,
	OpenF1ChampionshipTeam,
	OpenF1Driver,
	OpenF1Session,
} from "../types";

// Module-level caches -- persist for the lifetime of the process
let sessionKeyPromise: Promise<number> | null = null;
let driverCache: DriverStanding[] | null = null;
let constructorCache: ConstructorStanding[] | null = null;

/**
 * Finds the session_key of the most recent race that has completed.
 * Championship data is only available for race sessions.
 *
 * Deduped: concurrent calls share a single in-flight request.
 * Cached: subsequent calls return the resolved value immediately.
 */
function findLatestRaceSessionKey(): Promise<number> {
	if (!sessionKeyPromise) {
		sessionKeyPromise = _findLatestRaceSessionKey();
	}
	return sessionKeyPromise;
}

async function _findLatestRaceSessionKey(): Promise<number> {
	const currentYear = new Date().getFullYear();

	// Try current year first
	let sessions = await fetchAPI<OpenF1Session[]>("sessions", {
		session_name: "Race",
		year: String(currentYear),
	});

	// Filter to sessions that have already ended
	const now = new Date();
	let pastSessions = sessions.filter((s) => new Date(s.date_end) < now);

	// If no past races this year, try previous year
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

	// Return the most recent one (API returns them chronologically)
	const latest = pastSessions[pastSessions.length - 1]!;
	return latest.session_key;
}

/** Format "Max VERSTAPPEN" -> "Max Verstappen" */
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

/**
 * Normalizes API team names to the short names used in the app theme.
 * The API returns e.g. "Red Bull Racing", but theme uses "Red Bull".
 */
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

	// Fetch championship data and driver info in parallel
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

	// Build a lookup map from driver_number -> driver info
	const driverMap = new Map<number, OpenF1Driver>();
	for (const d of drivers) {
		driverMap.set(d.driver_number, d);
	}

	// Merge and sort by position
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
