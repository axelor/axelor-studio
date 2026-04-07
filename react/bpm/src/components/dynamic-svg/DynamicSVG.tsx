import React from "react";

interface DynamicSvgProps {
  icon?: React.ComponentType<{ width: string; height: string }>;
  fill?: string;
  stroke?: string;
}

export function DynamicSvg({ icon: SvgComponent, fill: _fill, stroke }: DynamicSvgProps) {
  if (!SvgComponent) return null;

  return (
    <div
      style={{
        fill: stroke || "#FBA729",
        strokeWidth: "15px",
        margin: "10px",
      }}
    >
      <SvgComponent width="24" height="24" />
    </div>
  );
}
