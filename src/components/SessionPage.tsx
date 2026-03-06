import { useSession } from "../hooks/useSession";
import { cell, msToGap, msToLap } from "../utils/format";
import { paletteForTeam } from "./theme";

type SessionPageProps = {
	width: number;
};

export function SessionPage({ width }: SessionPageProps) {
	const { data, loading, error } = useSession();

	if (loading) {
		return (
			<box flexDirection="column" border borderStyle="single" borderColor="#425B7A" flexGrow={1} justifyContent="center" alignItems="center">
				<text fg="#A4BCD3">Connecting to live session...</text>
			</box>
		);
	}

	if (error && !data) {
		return (
			<box flexDirection="column" border borderStyle="single" borderColor="#425B7A" flexGrow={1} justifyContent="center" alignItems="center">
				<text fg="#FF6B6B">Error: {error}</text>
				<text fg="#A4BCD3">Retrying...</text>
			</box>
		);
	}

	if (!data || !data.active || data.drivers.length === 0) {
		return (
			<box flexDirection="column" border borderStyle="single" borderColor="#425B7A" flexGrow={1} justifyContent="center" alignItems="center">
				<text fg="#A4BCD3">No active session</text>
			</box>
		);
	}

	const sessionDrivers = data.drivers;
	const sessionName = data.sessionName;
	const eventLabel = data.eventName
		? `${data.eventName}${data.countryName ? " - " + data.countryName : ""}`
		: "";

	const fastestLapMs = Math.min(
		...sessionDrivers.filter((d) => d.lastLapMs > 0).map((d) => d.lastLapMs),
	);
	const compact = width < 106;

	return (
		<box flexDirection="column" border borderStyle="single" borderColor="#425B7A" flexGrow={1}>
			<box justifyContent="space-between" height={2}>
				<text fg="#F5C94A">LIVE SESSION - {sessionName.toUpperCase()}</text>
				<text fg="#A4BCD3">{eventLabel}</text>
			</box>

			<box border borderStyle="single" borderColor="#33455F" height={3} paddingLeft={2}>
				<text fg="#9DB4CA">
					{cell("POS", 5)}
					{cell("DRV", 6)}
					{cell("TEAM", 14)}
					{cell("TYRE", 8)}
					{cell("STATUS", 9)}
					{cell("LAST", 13)}
					GAP
				</text>
			</box>

			<scrollbox scrollY flexGrow={1}>
				{sessionDrivers.map((driver) => {
					const colors = paletteForTeam(driver.team);
					const fastest = driver.lastLapMs > 0 && driver.lastLapMs === fastestLapMs;
					return (
						<box key={driver.code} flexDirection="row" border borderStyle="single" borderColor={colors.stripe}>
							<box width={1} backgroundColor={colors.stripe} />
							<box flexGrow={1} backgroundColor={colors.bg} paddingLeft={1} paddingRight={1}>
								<text fg={colors.fg}>
									{cell(`#${driver.position}`, 5)}
									{cell(driver.code, 6)}
									{cell(driver.team, 14)}
									{cell(driver.tire.toUpperCase(), 8)}
									<span fg={driver.inPit ? "#FF6B6B" : "#7EE5A7"}>{cell(driver.inPit ? "IN PIT" : "TRACK", 9)}</span>
									<span fg={fastest ? "#D946EF" : colors.fg}>{cell(msToLap(driver.lastLapMs), 13)}</span>
									{msToGap(driver.gapsToLeaderMs)}
								</text>
							</box>
						</box>
					);
				})}
			</scrollbox>

			{error && (
				<box height={1} justifyContent="center">
					<text fg="#FF6B6B">Connection issue: {error} (showing stale data)</text>
				</box>
			)}
		</box>
	);
}
