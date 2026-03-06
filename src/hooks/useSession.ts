import { useEffect, useRef, useState } from "react";
import {
	sessionDrivers as mockDrivers,
	sessionName as mockSessionName,
	eventLabel as mockEventLabel,
} from "../data/mockData";
import type {
	RawSessionSnapshot,
	SessionData,
	SessionDriver,
} from "../types";

const USE_MOCK = process.env.USE_MOCK === "true";
const BASE_URL = process.env.API_URL || "http://localhost:3000/v1";

type SessionState = {
	data: SessionData | null;
	loading: boolean;
	error: string | null;
};

const mockData: SessionData = {
	sessionName: mockSessionName,
	sessionType: "Race",
	eventName: mockEventLabel.split(" - ")[0] ?? "",
	countryName: "",
	active: true,
	drivers: mockDrivers,
};

export function useSession(): SessionState {
	const [state, setState] = useState<SessionState>(() => {
		if (USE_MOCK) {
			return { data: mockData, loading: false, error: null };
		}
		return { data: null, loading: true, error: null };
	});

	const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (USE_MOCK) return;

		let cancelled = false;
		let abortController: AbortController | null = null;

		async function connect() {
			if (cancelled) return;

			abortController = new AbortController();

			try {
				const response = await fetch(`${BASE_URL}/session/live`, {
					signal: abortController.signal,
					headers: { Accept: "text/event-stream" },
				});

				if (!response.ok) {
					throw new Error(`SSE connection failed: ${response.status}`);
				}

				if (!response.body) {
					throw new Error("No response body for SSE stream");
				}

				setState((prev) => ({ ...prev, loading: false, error: null }));

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (!cancelled) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });

				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

					let eventType = "";
					let dataLines: string[] = [];

					for (const line of lines) {
						if (line.startsWith("event: ")) {
							eventType = line.slice(7).trim();
						} else if (line.startsWith("data: ")) {
							dataLines.push(line.slice(6));
					} else if (line === "" && dataLines.length > 0) {
						const jsonStr = dataLines.join("\n");
							dataLines = [];

							if (eventType === "session" && jsonStr) {
								try {
									const raw = JSON.parse(
										jsonStr,
									) as RawSessionSnapshot;
									const mapped = mapSnapshot(raw);
									if (!cancelled) {
										setState({
											data: mapped,
											loading: false,
											error: null,
										});
									}
								} catch {
								}
							}
							eventType = "";
						}
					}
				}
			} catch (err: unknown) {
				if (cancelled) return;

				const message =
					err instanceof Error
						? err.message
						: "SSE connection failed";

				if (
					err instanceof DOMException &&
					err.name === "AbortError"
				) {
					return;
				}

				setState((prev) => ({
					data: prev.data,
					loading: false,
					error: message,
				}));

				retryTimeoutRef.current = setTimeout(() => {
					if (!cancelled) connect();
				}, 5000);
			}
		}

		connect();

		return () => {
			cancelled = true;
			if (abortController) abortController.abort();
			if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
		};
	}, []);

	return state;
}

function mapSnapshot(raw: RawSessionSnapshot): SessionData {
	return {
		sessionName: raw.session_name,
		sessionType: raw.session_type,
		eventName: raw.event_name,
		countryName: raw.country_name,
		active: raw.active,
		drivers: raw.drivers.map(
			(d): SessionDriver => ({
				position: d.position ?? 0,
				code: d.code ?? "???",
				team: d.team ?? "Unknown",
				tire: normalizeTire(d.tire),
				inPit: d.in_pit ?? false,
				lastLapMs: d.last_lap_ms ?? 0,
				gapsToLeaderMs: d.gap_to_leader_ms ?? 0,
			}),
		),
	};
}

function normalizeTire(
	tire: string | undefined,
): SessionDriver["tire"] {
	switch (tire) {
		case "Soft":
		case "Medium":
		case "Hard":
		case "Inter":
		case "Wet":
			return tire;
		default:
			return "Medium";
	}
}
