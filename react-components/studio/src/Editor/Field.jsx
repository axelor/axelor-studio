import React from "react";
import { useDrag, useDrop } from "react-dnd";

import PanelView from "./PanelView";
import FieldView from "./FieldView";

function Field({ children, onElementChange, ...props }) {
	const ref = React.useRef(null);
	const [dragProps, dragRef] = useDrag({
		item: { type: "Element", item: { ...props } },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const [dropProps, dropRef] = useDrop({
		accept: "Element",
		hover: (_item, monitor) => {
			const { item: dragItem } = monitor.getItem();
			if (!monitor.isOver({ shallow: true })) return;
			if (dragItem.name === props.name) {
				return;
			}
		},
		drop: (_item, monitor) => {
			let position = "after";
			if (!monitor.isOver({ shallow: true })) return;
			const { item: dragItem } = monitor.getItem();
			if (dragItem.name === props.name) {
				return;
			}
			const hoverBoundingRect = ref.current.getBoundingClientRect();
			const hoverMiddleX =
				(hoverBoundingRect.right - hoverBoundingRect.left) / 2;
			const clientOffset = monitor.getClientOffset();
			const hoverClientX = clientOffset.x - hoverBoundingRect.left;
			if (hoverClientX < hoverMiddleX) {
				position = "before";
			}
			onElementChange(dragItem, props, position);
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
			isOverCurrent: monitor.isOver({ shallow: true }),
		}),
	});

	function renderElement() {
		dragRef(dropRef(ref));
		switch (props.type) {
			case "panel": {
				return (
					<PanelView ref={ref} {...props} {...dropProps} {...dragProps}>
						{children}
					</PanelView>
				);
			}
			case "field": {
				return (
					<FieldView ref={ref} {...props} {...dropProps} {...dragProps}>
						{children}
					</FieldView>
				);
			}
			default: {
				return (
					<FieldView ref={ref} {...props} {...dropProps} {...dragProps}>
						{children}
					</FieldView>
				);
			}
		}
	}

	return <React.Fragment>{renderElement()}</React.Fragment>;
}

export default Field;
