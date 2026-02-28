import { raceWeekends } from "../data/mockData";
import { formatWeekendRange, truncate } from "../utils/format";

type SchedulePageProps = {
  width: number;
};

export function SchedulePage({ width }: SchedulePageProps) {
  const now = new Date("2026-03-08T15:00:00Z");
  const contentWidth = Math.max(40, width - 12);

  return (
    <box flexDirection="column" border borderStyle="double" borderColor="#425B7A" padding={1} flexGrow={1}>
      <text fg="#F5C94A">SEASON RACE WEEKENDS</text>
      <text fg="#A4BCD3">Current weekend is highlighted in gold.</text>

      <box flexDirection="column" flexGrow={1} gap={1} marginTop={1}>
        {raceWeekends.map((weekend) => {
          const start = new Date(weekend.startDate);
          const end = new Date(weekend.endDate);
          const current = now >= start && now <= end;
          const primary = current ? "#F5C94A" : "#8DA7C1";
          const bg = current ? "#2E2510" : "#141E2C";
          const sessions = weekend.sessions
            .map((session) => {
              const local = new Date(session.start).toLocaleString("en-US", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              return `${session.name} ${local}`;
            })
            .join(" | ");

          const title = `R${weekend.round} ${weekend.grandPrix} (${weekend.country})`;

          return (
            <box key={weekend.round} border borderStyle="single" borderColor={primary} backgroundColor={bg} padding={1}>
              <box justifyContent="space-between">
                <text fg={primary}>{truncate(title, Math.floor(contentWidth * 0.62))}</text>
                <text fg="#D7E4F1">{formatWeekendRange(weekend.startDate, weekend.endDate)}</text>
              </box>
              <text fg="#AFC3D8">{truncate(weekend.circuit, contentWidth)}</text>
              <text fg="#DEE9F5">{truncate(sessions, contentWidth)}</text>
            </box>
          );
        })}
      </box>
    </box>
  );
}
