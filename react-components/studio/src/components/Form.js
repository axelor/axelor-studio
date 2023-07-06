import React from "react";
import Grid from "./Grid";
import { PANEL_TYPE } from "../constants";
import { useStore } from "../store/context";

/**
 * Form Component
 * Used As Main Container i.e. <form />
 */
function FormComponent({ attrs = {}, items = [], design, widgets, ...rest }) {
	// render top level items as Widgets using Context FormConsumer
	const { update } = useStore();

	const allItems = React.useMemo(() => {
		const sideItems = [];
		const mainItems = [];
		items.forEach((item) => {
			const sidebar =
				widgets[item]?.sidebar ||
				JSON.parse(widgets[item].widgetAttrs || "{}")?.sidebar;

			const isSidePanel = JSON.parse(sidebar || false);

			if (widgets[item] && isSidePanel) sideItems.push(item);
			else if (widgets[item] && !isSidePanel) mainItems.push(item);
		});
		return { sideItems, mainItems };
	}, [items, widgets]);

	const rootPanel = React.useMemo(() => {
		const { sideItems, mainItems } = allItems;
		const hasSidebar = sideItems.length > 0;
		return hasSidebar
			? {
					items: [
						{
							layout: PANEL_TYPE.grid,
							items: mainItems,
							colSpan: 9,
							panelType: "mainPanel",
						},
						{
							layout: PANEL_TYPE.grid,
							items: sideItems,
							colSpan: 3,
							panelType: "sidePanel",
						},
					],
			  }
			: {
					items: [
						{
							layout: PANEL_TYPE.grid,
							items: mainItems,
							colSpan: 12,
							panelType: "mainPanel",
						},
					],
			  };
	}, [allItems]);

	React.useEffect(() => {
		const { mainItems, sideItems } = allItems;
		update((draft) => {
			draft.mainItems = mainItems;
			draft.sideItems = sideItems;
		});
	}, [allItems, update]);

	return (
		<div className="flex-container">
			{rootPanel.items.map(({ items, colSpan, panelType, ...attrs }, i) => (
				<div
					style={
						colSpan === 9
							? {
									maxWidth: "100%",
									overflow: "hidden",
							  }
							: {
									overflow: "clip" /* required */,
									overflowClipMargin: " 20px",
							  }
					}
					className={`flex-item span-${colSpan}`}
					key={i}
				>
					<Grid
						key={i}
						design={design}
						className="form-body"
						items={items}
						attrs={attrs}
						_type={rest._type}
						widgets={widgets}
						errorList={rest.errorList}
						canRemove={rest.canRemove}
						isBase={rest.isBase}
						panelType={panelType}
					/>
				</div>
			))}
		</div>
	);
}

export default FormComponent;
