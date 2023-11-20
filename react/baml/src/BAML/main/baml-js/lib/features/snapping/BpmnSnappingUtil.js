import { getOrientation } from "diagram-js/lib/layout/LayoutUtil";

export function getBoundaryAttachment(position, targetBounds) {
  let orientation = getOrientation(position, targetBounds, -15);

  if (orientation !== "intersect") {
    return orientation;
  } else {
    return null;
  }
}
