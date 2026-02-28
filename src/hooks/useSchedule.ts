import { useEffect, useState } from "react";
import { raceWeekends as mockWeekends } from "../data/mockData";
import { fetchScheduleWeekends } from "../lib/schedule";
import type { Weekend } from "../types";

const USE_MOCK = process.env.USE_MOCK === "true";

type AsyncState<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
};

export function useScheduleWeekends(): AsyncState<Weekend[]> {
	const [state, setState] = useState<AsyncState<Weekend[]>>(() => {
		if (USE_MOCK) {
			return { data: mockWeekends, loading: false, error: null };
		}
		return { data: null, loading: true, error: null };
	});

	useEffect(() => {
		if (USE_MOCK) return;

		let cancelled = false;

		fetchScheduleWeekends()
			.then((data) => {
				if (!cancelled) {
					setState({ data, loading: false, error: null });
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setState({
						data: null,
						loading: false,
						error:
							err instanceof Error
								? err.message
								: "Failed to fetch schedule",
					});
				}
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return state;
}
