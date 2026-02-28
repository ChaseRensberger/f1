import type { OpenF1Meeting, OpenF1Session, Weekend } from "../types";
import { fetchAPI } from "./api";

let weekendCache: Weekend[] | null = null;
let weekendPromise: Promise<Weekend[]> | null = null;

function isGrandPrix(meeting: OpenF1Meeting): boolean {
	return meeting.meeting_name.includes("Grand Prix");
}

function shortSessionName(name: string): string {
	if (name === "Practice 1") return "FP1";
	if (name === "Practice 2") return "FP2";
	if (name === "Practice 3") return "FP3";
	if (name === "Qualifying") return "Quali";
	if (name === "Sprint Qualifying") return "Sprint Quali";
	if (name === "Sprint Shootout") return "Sprint SO";
	return name;
}

function toWeekend(
	meeting: OpenF1Meeting,
	round: number,
	sessions: OpenF1Session[],
): Weekend {
	const sortedSessions = sessions
		.slice()
		.sort((a, b) => a.date_start.localeCompare(b.date_start));

	return {
		round,
		grandPrix: meeting.meeting_name,
		circuit: meeting.circuit_short_name,
		country: meeting.country_code,
		startDate: meeting.date_start,
		endDate: meeting.date_end,
		sessions: sortedSessions.map((session) => ({
			name: shortSessionName(session.session_name),
			start: session.date_start,
		})),
	};
}

async function fetchSeasonWeekends(year: number): Promise<Weekend[]> {
	const [meetings, sessions] = await Promise.all([
		fetchAPI<OpenF1Meeting[]>("meetings", { year: String(year) }),
		fetchAPI<OpenF1Session[]>("sessions", { year: String(year) }),
	]);

	const sessionsByMeeting = new Map<number, OpenF1Session[]>();
	for (const session of sessions) {
		const group = sessionsByMeeting.get(session.meeting_key);
		if (group) {
			group.push(session);
		} else {
			sessionsByMeeting.set(session.meeting_key, [session]);
		}
	}

	const raceMeetings = meetings
		.filter(isGrandPrix)
		.sort((a, b) => a.date_start.localeCompare(b.date_start));

	return raceMeetings.map((meeting, idx) =>
		toWeekend(meeting, idx + 1, sessionsByMeeting.get(meeting.meeting_key) ?? []),
	);
}

export async function fetchScheduleWeekends(): Promise<Weekend[]> {
	if (weekendCache) return weekendCache;
	if (weekendPromise) return weekendPromise;

	weekendPromise = (async () => {
		const currentYear = new Date().getFullYear();
		let weekends = await fetchSeasonWeekends(currentYear);

		if (weekends.length === 0) {
			weekends = await fetchSeasonWeekends(currentYear - 1);
		}

		weekendCache = weekends;
		return weekends;
	})();

	try {
		return await weekendPromise;
	} finally {
		weekendPromise = null;
	}
}
