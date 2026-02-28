import { useEffect, useState } from "react";
import {
	constructorStandings as mockConstructors,
	driverStandings as mockDrivers,
} from "../data/mockData";
import {
	fetchConstructorStandings,
	fetchDriverStandings,
} from "../lib/standings";
import type { ConstructorStanding, DriverStanding } from "../types";

const USE_MOCK = process.env.USE_MOCK === "true";

type AsyncState<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
};

export function useDriverStandings(): AsyncState<DriverStanding[]> {
	const [state, setState] = useState<AsyncState<DriverStanding[]>>(() => {
		if (USE_MOCK) {
			return { data: mockDrivers, loading: false, error: null };
		}
		return { data: null, loading: true, error: null };
	});

	useEffect(() => {
		if (USE_MOCK) return;

		let cancelled = false;

		fetchDriverStandings()
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
								: "Failed to fetch driver standings",
					});
				}
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return state;
}

export function useConstructorStandings(): AsyncState<ConstructorStanding[]> {
	const [state, setState] = useState<AsyncState<ConstructorStanding[]>>(
		() => {
			if (USE_MOCK) {
				return { data: mockConstructors, loading: false, error: null };
			}
			return { data: null, loading: true, error: null };
		},
	);

	useEffect(() => {
		if (USE_MOCK) return;

		let cancelled = false;

		fetchConstructorStandings()
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
								: "Failed to fetch constructor standings",
					});
				}
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return state;
}
