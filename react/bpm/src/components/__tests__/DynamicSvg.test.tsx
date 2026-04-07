import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { DynamicSvg } from "../dynamic-svg/DynamicSVG";

function FakeSvgComponent(props: React.SVGAttributes<SVGElement>) {
  return (
    <svg data-testid="mock-svg" {...props}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

describe("DynamicSvg", () => {
  it("renders the SVG component when icon is provided", () => {
    render(<DynamicSvg icon={FakeSvgComponent} fill="#fff" stroke="#000" />);
    expect(screen.getByTestId("mock-svg")).toBeTruthy();
  });

  it("renders nothing when icon is null", () => {
    const { container } = render(<DynamicSvg icon={null as unknown as undefined} fill="#fff" stroke="#000" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when icon is undefined", () => {
    const { container } = render(<DynamicSvg fill="#fff" stroke="#000" />);
    expect(container.innerHTML).toBe("");
  });

  it("applies stroke color as fill on the wrapper div", () => {
    const { container } = render(
      <DynamicSvg icon={FakeSvgComponent} fill="#fff" stroke="#0000FF" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.fill).toBe("rgb(0, 0, 255)");
  });

  it("uses fallback color when stroke is not provided", () => {
    const { container } = render(<DynamicSvg icon={FakeSvgComponent} fill="#fff" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.fill).toBe("rgb(251, 167, 41)");
  });
});
