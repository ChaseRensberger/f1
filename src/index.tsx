import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react";
import { useMemo, useState } from "react";
import { Header } from "./components/Header";
import { SchedulePage } from "./components/SchedulePage";
import { SessionPage } from "./components/SessionPage";
import { StandingsPage } from "./components/StandingsPage";
import type { TabName } from "./types";

const tabs: TabName[] = ["Session", "Schedule", "Standings"];

function App() {
	const renderer = useRenderer();
	const { width } = useTerminalDimensions();
	const [tabIndex, setTabIndex] = useState(0);

	useKeyboard((key) => {
		if (key.name === "q" || key.name === "escape" || (key.ctrl && key.name === "c")) {
			renderer.destroy();
			return;
		}
		if (key.name === "1") {
			setTabIndex(0);
			return;
		}
		if (key.name === "2") {
			setTabIndex(1);
			return;
		}
		if (key.name === "3") {
			setTabIndex(2);
			return;
		}
		if (key.name === "right" || key.name === "l") {
			setTabIndex((idx) => (idx + 1) % tabs.length);
			return;
		}
		if (key.name === "left" || key.name === "h") {
			setTabIndex((idx) => (idx - 1 + tabs.length) % tabs.length);
		}
	});

	const activeTab = tabs[tabIndex] ?? "Session";

	const page = useMemo(() => {
		if (activeTab === "Session") {
			return <SessionPage width={width} />;
		}
		else if (activeTab === "Schedule") {
			return <SchedulePage width={width} />;
		} else {
			return <StandingsPage width={width} />;
		}
	}, [activeTab, width]);

	return (
		<box flexDirection="column" flexGrow={1} gap={1} backgroundColor="#070C13">
			<Header activeTab={activeTab} />
			{/*<box flexGrow={1}>{page}</box>*/}
		</box>
	);
}

const renderer = await createCliRenderer({ exitOnCtrlC: false });
createRoot(renderer).render(<App />);
