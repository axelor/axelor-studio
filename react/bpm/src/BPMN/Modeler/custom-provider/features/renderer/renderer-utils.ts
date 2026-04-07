/**
 * Shared drawing primitives and marker utilities for BpmnRenderer.
 *
 * These functions manage SVG marker creation (addMarker, createMarker, marker)
 * and basic shape primitives (drawCircle, drawRect, drawDiamond, drawLine,
 * drawPath, drawMarker). They share the `markers` and `rendererId` closure
 * state which is passed in via the deps object.
 */

import type { SvgAttrs } from "./renderer-types";

interface DrawingUtilsDeps {
  svgAppend: (parent: SVGElement, child: SVGElement) => void;
  svgAttr: (element: SVGElement, attrs: Record<string, unknown>) => void;
  svgCreate: (type: string) => SVGElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domQuery: (...args: any[]) => any;
  createLine: (points: unknown[], attrs?: Record<string, unknown>) => SVGElement;
  isObject: (value: unknown) => boolean;
  assign: (...args: unknown[]) => Record<string, unknown>;
  canvas: { _svg: SVGElement };
  computeStyle: (...args: unknown[]) => Record<string, unknown>;
  rendererId: string;
  markers: Record<string, SVGElement>;
}

export function createDrawingUtils(deps: DrawingUtilsDeps) {
  const {
    svgAppend,
    svgAttr,
    svgCreate,
    domQuery,
    createLine,
    isObject,
    assign,
    canvas,
    computeStyle,
    rendererId,
    markers,
  } = deps;

  function addMarker(
    id: string,
    options: {
      element: SVGElement;
      ref?: { x: number; y: number };
      scale?: number;
      attrs?: Record<string, unknown>;
    },
  ) {
    const attrs = assign(
      {
        fill: "black",
        strokeWidth: 1,
        strokeLinecap: "round",
        strokeDasharray: "none",
      },
      options.attrs,
    );

    const ref = options.ref || { x: 0, y: 0 };

    const scale = options.scale || 1;

    // fix for safari / chrome / firefox bug not correctly
    // resetting stroke dash array
    if (attrs.strokeDasharray === "none") {
      attrs.strokeDasharray = [10000, 1];
    }

    const marker = svgCreate("marker");

    svgAttr(options.element, attrs);

    svgAppend(marker, options.element);

    svgAttr(marker, {
      id: id,
      viewBox: "0 0 20 20",
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: "auto",
    });

    let defs = domQuery("defs", canvas._svg) as SVGElement | null;

    if (!defs) {
      defs = svgCreate("defs");

      svgAppend(canvas._svg, defs);
    }

    svgAppend(defs, marker);

    markers[id] = marker;
  }

  function colorEscape(str: string) {
    // only allow characters and numbers
    return str.replace(/[^0-9a-zA-z]+/g, "_");
  }

  function markerFn(type: string, fill: string, stroke: string) {
    const id = type + "-" + colorEscape(fill) + "-" + colorEscape(stroke) + "-" + rendererId;

    if (!markers[id]) {
      createMarker(id, type, fill, stroke);
    }

    return "url(#" + id + ")";
  }

  function createMarker(id: string, type: string, fill: string, stroke: string) {
    if (type === "sequenceflow-end") {
      const sequenceflowEnd = svgCreate("path");
      svgAttr(sequenceflowEnd, { d: "M 1 5 L 11 10 L 1 15 Z" });

      addMarker(id, {
        element: sequenceflowEnd,
        ref: { x: 11, y: 10 },
        scale: 0.5,
        attrs: {
          fill: stroke,
          stroke: stroke,
        },
      });
    }

    if (type === "messageflow-start") {
      const messageflowStart = svgCreate("circle");
      svgAttr(messageflowStart, { cx: 6, cy: 6, r: 3.5 });

      addMarker(id, {
        element: messageflowStart,
        attrs: {
          fill: fill,
          stroke: stroke,
        },
        ref: { x: 6, y: 6 },
      });
    }

    if (type === "messageflow-end") {
      const messageflowEnd = svgCreate("path");
      svgAttr(messageflowEnd, { d: "m 1 5 l 0 -3 l 7 3 l -7 3 z" });

      addMarker(id, {
        element: messageflowEnd,
        attrs: {
          fill: fill,
          stroke: stroke,
          strokeLinecap: "butt",
        },
        ref: { x: 8.5, y: 5 },
      });
    }

    if (type === "association-start") {
      const associationStart = svgCreate("path");
      svgAttr(associationStart, { d: "M 11 5 L 1 10 L 11 15" });

      addMarker(id, {
        element: associationStart,
        attrs: {
          fill: "none",
          stroke: stroke,
          strokeWidth: 1.5,
        },
        ref: { x: 1, y: 10 },
        scale: 0.5,
      });
    }

    if (type === "association-end") {
      const associationEnd = svgCreate("path");
      svgAttr(associationEnd, { d: "M 1 5 L 11 10 L 1 15" });

      addMarker(id, {
        element: associationEnd,
        attrs: {
          fill: "none",
          stroke: stroke,
          strokeWidth: 1.5,
        },
        ref: { x: 12, y: 10 },
        scale: 0.5,
      });
    }

    if (type === "conditional-flow-marker") {
      const conditionalflowMarker = svgCreate("path");
      svgAttr(conditionalflowMarker, { d: "M 0 10 L 8 6 L 16 10 L 8 14 Z" });

      addMarker(id, {
        element: conditionalflowMarker,
        attrs: {
          fill: fill,
          stroke: stroke,
        },
        ref: { x: -1, y: 10 },
        scale: 0.5,
      });
    }

    if (type === "conditional-default-flow-marker") {
      const conditionaldefaultflowMarker = svgCreate("path");
      svgAttr(conditionaldefaultflowMarker, { d: "M 6 4 L 10 16" });

      addMarker(id, {
        element: conditionaldefaultflowMarker,
        attrs: {
          stroke: stroke,
        },
        ref: { x: 0, y: 10 },
        scale: 0.5,
      });
    }
  }

  function drawCircle(
    parentGfx: SVGElement,
    width: number,
    height: number,
    offset?: number | SvgAttrs,
    attrs?: SvgAttrs,
  ) {
    let actualOffset: number;
    let actualAttrs: SvgAttrs | undefined;

    if (isObject(offset)) {
      actualAttrs = offset as SvgAttrs;
      actualOffset = 0;
    } else {
      actualOffset = (offset as number) || 0;
      actualAttrs = attrs;
    }

    actualAttrs = computeStyle(actualAttrs, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white",
    }) as SvgAttrs;

    if (actualAttrs.fill === "none") {
      delete actualAttrs.fillOpacity;
    }

    const cx = width / 2,
      cy = height / 2;

    const circle = svgCreate("circle");
    svgAttr(circle, {
      cx: cx,
      cy: cy,
      r: Math.round((width + height) / 4 - actualOffset),
    });
    svgAttr(circle, actualAttrs);

    svgAppend(parentGfx, circle);

    return circle;
  }

  function drawRect(
    parentGfx: SVGElement,
    width: number,
    height: number,
    r: number,
    offset?: number | SvgAttrs,
    attrs?: SvgAttrs,
  ) {
    let actualOffset: number;
    let actualAttrs: SvgAttrs | undefined;

    if (isObject(offset)) {
      actualAttrs = offset as SvgAttrs;
      actualOffset = 0;
    } else {
      actualOffset = (offset as number) || 0;
      actualAttrs = attrs;
    }

    actualAttrs = computeStyle(actualAttrs, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white",
    }) as SvgAttrs;

    const rect = svgCreate("rect");
    svgAttr(rect, {
      x: actualOffset,
      y: actualOffset,
      width: width - actualOffset * 2,
      height: height - actualOffset * 2,
      rx: r,
      ry: r,
    });
    svgAttr(rect, actualAttrs);

    svgAppend(parentGfx, rect);

    return rect;
  }

  function drawDiamond(parentGfx: SVGElement, width: number, height: number, attrs?: SvgAttrs) {
    const x_2 = width / 2;
    const y_2 = height / 2;

    const points = [
      { x: x_2, y: 0 },
      { x: width, y: y_2 },
      { x: x_2, y: height },
      { x: 0, y: y_2 },
    ];

    const pointsString = points
      .map(function (point) {
        return point.x + "," + point.y;
      })
      .join(" ");

    attrs = computeStyle(attrs, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white",
    });

    const polygon = svgCreate("polygon");
    svgAttr(polygon, {
      points: pointsString,
    });
    svgAttr(polygon, attrs);

    svgAppend(parentGfx, polygon);

    return polygon;
  }

  function drawLine(
    parentGfx: SVGElement,
    waypoints: Array<{ x: number; y: number }>,
    attrs?: SvgAttrs,
  ) {
    attrs = computeStyle(attrs, ["no-fill"], {
      stroke: "black",
      strokeWidth: 2,
      fill: "none",
    });

    const line = createLine(waypoints, attrs);

    svgAppend(parentGfx, line);

    return line;
  }

  function drawPath(parentGfx: SVGElement, d: string, attrs?: SvgAttrs) {
    attrs = computeStyle(attrs, ["no-fill"], {
      strokeWidth: 2,
      stroke: "black",
    });

    const path = svgCreate("path");
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(parentGfx, path);

    return path;
  }

  function drawMarker(type: string, parentGfx: SVGElement, path: string, attrs?: SvgAttrs) {
    return drawPath(parentGfx, path, assign({ "data-marker": type }, attrs));
  }

  return {
    marker: markerFn,
    drawCircle: drawCircle,
    drawRect: drawRect,
    drawDiamond: drawDiamond,
    drawLine: drawLine,
    drawPath: drawPath,
    drawMarker: drawMarker,
  };
}
