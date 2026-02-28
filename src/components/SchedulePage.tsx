import { useScheduleWeekends } from "../hooks/useSchedule";
import { cell, formatWeekendRange } from "../utils/format";

type SchedulePageProps = {
	width: number;
};

export function SchedulePage({ width }: SchedulePageProps) {
	const now = new Date();
	const weekends = useScheduleWeekends();

	const gpWidth = Math.max(16, Math.min(28, width - 60));

	return (
		<box flexDirection="column" border borderStyle="single" borderColor="#33455F" flexGrow={1} minHeight={0}>
			<box justifyContent="space-between" height={2}>
				<text fg="#F5C94A">SCHEDULE</text>
				<text fg="#A4BCD3">Current weekend highlighted</text>
			</box>

			<box border borderStyle="single" borderColor="#33455F" height={3} paddingLeft={2}>
				<text fg="#9DB4CA">
					{cell("RND", 5)}
					{cell("GRAND PRIX", gpWidth)}
					{cell("DATES", 18)}
					SESSIONS
				</text>
			</box>

			<scrollbox scrollY flexGrow={1} minHeight={0}>
				{weekends.loading && (
					<box paddingLeft={3} marginTop={1}>
						<text fg="#7C8EA3">Loading schedule...</text>
					</box>
				)}
				{weekends.error && (
					<box paddingLeft={3} marginTop={1}>
						<text fg="#DC0000">Failed to load: {weekends.error}</text>
					</box>
				)}
				{weekends.data?.map((weekend) => {
					const start = new Date(weekend.startDate);
					const end = new Date(weekend.endDate);
					const current = now >= start && now <= end;
					const borderColor = current ? "#F5C94A" : "#33455F";
					const bg = current ? "#2E2510" : "#141E2C";
					const titleFg = current ? "#F5C94A" : "#D7E4F1";

					const sessionLine = weekend.sessions
						.map((s) => {
							const d = new Date(s.start);
							const day = d.toLocaleString("en-US", { weekday: "short" });
							const time = d.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
							return `${s.name} ${day} ${time}`;
						})
						.join("  |  ");

					return (
						<box key={weekend.round} flexDirection="row" border borderStyle="single" borderColor={borderColor} backgroundColor={bg}>
							<box width={1} backgroundColor={current ? "#F5C94A" : "#425B7A"} />
							<box flexGrow={1} paddingLeft={1} paddingRight={1} flexDirection="column">
								<text fg={titleFg}>
									{cell(weekend.round, 5)}
									{cell(`${weekend.grandPrix} (${weekend.country})`, gpWidth)}
									{cell(formatWeekendRange(weekend.startDate, weekend.endDate), 18)}
									{sessionLine}
								</text>
								<text fg="#7A8FA5">{weekend.circuit}</text>
							</box>
						</box>
					);
				})}
			</scrollbox>
		</box>
	);
}
