import React, { useCallback } from "react";
import { useStore } from "../../store/context";

import "./index.css";
import "./index.scss";

const COLS = 12;
const SEPERATORWIDTH = 14;
const SPACERWIDTH = 14;

function getColSpan(width, blockSize) {
	let value = Math.min(COLS, Math.round(width / blockSize));
	return value <= 0 ? 1 : value >= 12 ? 12 : value;
}

export const Table = React.forwardRef(function Table(props, ref) {
	return <div ref={ref} className="table container" {...props} />;
});

export const Row = React.forwardRef(function Row(props, ref) {
	return <div ref={ref} className="row" {...props} />;
});

export const Column = React.forwardRef(function Column(
	{
		children,
		colSpan,
		className,
		widgetAttrs,
		isSidePanelDummy,
		type,
		...props
	},
	ref
) {
	const sidebar = JSON.parse(widgetAttrs || "{}")?.sidebar;

	return (
		<div
			ref={ref}
			style={["toolbar", "menubar"].includes(type) ? { width: "100%" } : {}}
			className={`${className || ""} column${
				colSpan
					? ` col-${colSpan}
					${sidebar || isSidePanelDummy ? "sidebar-panel" : ""} `
					: ""
			}`}
			{...props}
		>
			<div className="column-content">{children}</div>
		</div>
	);
});

const Resizer = React.forwardRef(function Resizer(props, ref) {
	return <div ref={ref} className="resizer" {...props} />;
});

export default function ResizeColumn({
	children,
	onResize,
	editWidget,
	...props
}) {
	const [resizing, setResizing] = React.useState(false);
	const [width, setWidth] = React.useState();
	const resizer = React.useRef();
	const column = React.useRef();
	const { colSpan, id } = props;
	const blockWidth = React.useRef(0);
	const { update } = useStore();

	React.useEffect(() => {
		const width = column.current && column.current.clientWidth;
		if (width && !blockWidth.current) {
			blockWidth.current = width / colSpan;
		}
	}, [colSpan]);

	React.useEffect(() => {
		const element = resizer.current;
		if (element) {
			let width;
			let start;
			let $width;

			function resize(e) {
				let current = e.clientX;
				if (!start) {
					start = current;
				}

				let formViewWidth =
					document.getElementById("form-view").offsetWidth + SEPERATORWIDTH;
				if (current < formViewWidth) {
					setWidth(
						($width = Math.min(props.maxwidth, width + (current - start)))
					);
				}
			}

			function init(e) {
				e && e.stopPropagation();
				width = column.current && column.current.clientWidth;
				window.addEventListener("mousemove", resize, false);
				window.addEventListener("mouseup", destroy, false);
				setResizing(true);
				update((draft) => {
					draft.resizing = true;
				});
			}

			function destroy(e) {
				start = 0;
				window.removeEventListener("mousemove", resize, false);
				window.removeEventListener("mouseup", destroy, false);
				update((draft) => {
					draft.resizing = false;
				});

				setResizing(false);
				if (width && $width && e) {
					const size = props.maxwidth / 12;
					const newColSpan = getColSpan($width, size);
					onResize(newColSpan, id);
					setWidth(0);
				}
			}

			element.addEventListener("mousedown", init, false);

			return () => {
				element.removeEventListener("mousedown", init, false);
				// keeping this active, causes issues when we have a lesser colSpan widget in the beginning. If we try to increase it's colSpan, it doesn't resize
				// destroy();
			};
		}
	}, [colSpan, onResize, id, props.maxwidth, update]);

	const getHighlighterWidth = useCallback(() => {
		const blockSize = props.maxwidth / 12;
		const colSpan = getColSpan(width, blockSize);
		return colSpan * blockSize - SPACERWIDTH;
	}, [props.maxwidth, width]);

	return (
		<Column
			ref={column}
			className="resize-column"
			{...(resizing && width
				? {
						style: {
							minWidth: width,
						},
				  }
				: {})}
			{...props}
		>
			<div
				{...(width
					? {
							style: {
								width: getHighlighterWidth(),
								background: resizing ? "rgb(224 242 254)" : "none",
							},
					  }
					: {
							style: {},
					  })}
			>
				{children}
				<Resizer ref={resizer} />
			</div>
		</Column>
	);
}
