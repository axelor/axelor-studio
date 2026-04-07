import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { ConnectDropTarget, ConnectDragPreview } from "react-dnd";

import styles from "./dnd.module.css";

const dndItemTypes = {
  ROW: "row",
};

interface DragItem {
  id: string;
  index: number;
}

interface DragDropArgs {
  dragRef: React.RefObject<HTMLElement | null>;
  dropRef: ConnectDropTarget;
  previewRef: ConnectDragPreview;
  className: string;
  style: React.CSSProperties;
  handlerId: string | symbol | null;
}

interface DNDRowProps {
  id: string;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  children: (args: DragDropArgs) => React.ReactElement;
  [key: string]: unknown;
}

export default function DNDRow({ id, index, onMove, ...props }: DNDRowProps) {
  const ref = useRef<HTMLElement | null>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: dndItemTypes.ROW,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag, preview] = useDrag({
    type: dndItemTypes.ROW,
    item: () => {
      return { id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(ref);

  return props.children({
    dragRef: ref,
    dropRef: drop,
    previewRef: preview,
    className: styles.row,
    style: { opacity: isDragging ? 0 : 1 },
    handlerId,
  });
}
