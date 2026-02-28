import type { TabName } from "../types";

const tabs: TabName[] = ["Schedule", "Session", "Standings"];

type HeaderProps = {
	activeTab: TabName;
};

export function Header({ activeTab }: HeaderProps) {
	return (
		<box flexDirection="row" gap={1} border borderStyle="single" borderColor="#33455F">
			{tabs.map((tab) => {
				const active = activeTab === tab;
				return (
					<box
						key={tab}
						flexGrow={1}
						border
						borderStyle="rounded"
						borderColor={active ? "#F5C94A" : "#4B607B"}
						backgroundColor={active ? "#3B2F0F" : "#172232"}
						paddingLeft={1}
						paddingRight={1}
					>
						<text fg={active ? "#F5C94A" : "#B9CADB"}>{tab}</text>
					</box>
				);
			})}
		</box>
	);
}
