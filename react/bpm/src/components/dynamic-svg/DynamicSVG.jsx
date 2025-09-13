import { useState, useEffect } from "react";

export function DynamicSvg({ icon, fill, stroke }) {
  const [svgContent, setSvgContent] = useState("");

  useEffect(() => {
    if (!icon) return;
    fetch(icon)
      .then((response) => response.text())
      .then((data) => {
        setSvgContent(data);
      });
  }, [icon]);

  return (
    <div
      style={{
        fill: stroke || "#FBA729",
        strokeWidth: "15px",
        margin: "10px",
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
