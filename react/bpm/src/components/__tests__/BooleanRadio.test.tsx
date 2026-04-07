import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BooleanRadio } from "@studio/shared/components";

describe("BooleanRadio", () => {
  const defaultData = [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ];

  it("renders radio options with labels", () => {
    render(<BooleanRadio name="test" data={defaultData} />);
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
  });

  it("renders radio inputs for each data item", () => {
    render(<BooleanRadio name="test" data={defaultData} />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
  });

  it("checks the radio matching the current value", () => {
    render(<BooleanRadio name="test" data={defaultData} value="true" />);
    const radios = screen.getAllByRole("radio");
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect((radios[1] as HTMLInputElement).checked).toBe(false);
  });
});
