import { constructorStandings, driverStandings } from "../data/mockData";
import { cell, pointsBar } from "../utils/format";
import { paletteForTeam } from "./theme";

type StandingsPageProps = {
  width: number;
};

export function StandingsPage({ width }: StandingsPageProps) {
  const stack = width < 126;
  const maxConstructorPoints = Math.max(...constructorStandings.map((s) => s.points));
  const maxDriverPoints = Math.max(...driverStandings.map((s) => s.points));
  const paneWidth = stack ? width - 10 : Math.floor((width - 14) / 2);
  const constructorNameWidth = Math.max(10, Math.min(18, paneWidth - 20));
  const driverNameWidth = Math.max(12, Math.min(20, paneWidth - 20));
  const formWidth = Math.max(6, Math.min(16, paneWidth - (constructorNameWidth + 11)));

  return (
    <box
      flexDirection={stack ? "column" : "row"}
      border
      borderStyle="double"
      borderColor="#425B7A"
      padding={1}
      flexGrow={1}
      gap={1}
    >
      <box flexGrow={1} border borderStyle="single" borderColor="#33455F" padding={1}>
        <text fg="#F5C94A">CONSTRUCTOR STANDINGS</text>
        <box marginTop={1} marginBottom={1}>
          <text fg="#9DB4CA">{cell("POS", 5)}{cell("TEAM", constructorNameWidth)}{cell("PTS", 6)}FORM</text>
        </box>
        <box flexDirection="column" gap={1}>
          {constructorStandings.map((constructor) => {
            const colors = paletteForTeam(constructor.constructor);
            return (
              <box key={constructor.constructor} flexDirection="row" border borderStyle="single" borderColor={colors.stripe}>
                <box width={1} backgroundColor={colors.stripe} />
                <box backgroundColor={colors.bg} flexGrow={1} paddingLeft={1}>
                  <text fg={colors.fg}>
                    {cell(`#${constructor.position}`, 5)}
                    {cell(constructor.constructor, constructorNameWidth)}
                    {cell(constructor.points, 6)}
                    {pointsBar(constructor.points, maxConstructorPoints, formWidth)}
                  </text>
                </box>
              </box>
            );
          })}
        </box>
      </box>

      <box flexGrow={1} border borderStyle="single" borderColor="#33455F" padding={1}>
        <text fg="#F5C94A">DRIVER STANDINGS</text>
        <box marginTop={1} marginBottom={1}>
          <text fg="#9DB4CA">{cell("POS", 5)}{cell("DRIVER", driverNameWidth)}{cell("PTS", 6)}FORM</text>
        </box>
        <box flexDirection="column" gap={1}>
          {driverStandings.map((driver) => {
            const colors = paletteForTeam(driver.team);
            return (
              <box key={driver.driver} flexDirection="row" border borderStyle="single" borderColor={colors.stripe}>
                <box width={1} backgroundColor={colors.stripe} />
                <box backgroundColor={colors.bg} flexGrow={1} paddingLeft={1}>
                  <text fg={colors.fg}>
                    {cell(`#${driver.position}`, 5)}
                    {cell(driver.driver, driverNameWidth)}
                    {cell(driver.points, 6)}
                    {pointsBar(driver.points, maxDriverPoints, formWidth)}
                  </text>
                </box>
              </box>
            );
          })}
        </box>
      </box>
    </box>
  );
}
