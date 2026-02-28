const BASE_URL = "https://api.openf1.org/v1";

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function fetchAPI<T>(
	endpoint: string,
	params?: Record<string, string>,
): Promise<T> {
	const url = new URL(`${BASE_URL}/${endpoint}`);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.append(key, value);
		}
	}

	const response = await fetch(url.toString());

	if (!response.ok) {
		throw new ApiError(
			response.status,
			`API request failed: ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();

	// OpenF1 returns { detail: "No results found." } when there's no data
	if (data && typeof data === "object" && "detail" in data) {
		return [] as T;
	}

	return data as T;
}
