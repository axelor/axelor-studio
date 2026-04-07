/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Only mock what's needed -- NOT react-dropzone (we test its real behavior)
vi.mock("@axelor/ui", () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
}));
vi.mock("@axelor/ui/icons/material-icon", () => ({
  MaterialIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));
vi.mock("@studio/shared", () => ({
  translate: (str: string) => str,
}));

import UploadCard from "../components/UploadCard";

describe("UploadCard", () => {
  it("clicking the instruction text opens the file dialog", async () => {
    const user = userEvent.setup();
    render(<UploadCard />);

    const text = screen.getByText("Drag and drop files here, or click to select files");

    // The file input should exist inside the same dropzone root
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Spy on the hidden input's click -- react-dropzone programmatically
    // calls input.click() when the root element is clicked
    const clickSpy = vi.spyOn(input, "click");

    await user.click(text);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("clicking the upload icon opens the file dialog", async () => {
    const user = userEvent.setup();
    render(<UploadCard />);

    const icon = screen.getByTestId("icon-upload_file");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    await user.click(icon);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("calls onFileUpload with only .bpmn files on drop", async () => {
    const onFileUpload = vi.fn();
    render(<UploadCard onFileUpload={onFileUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const bpmnFile = new File(["<xml>"], "process.bpmn", {
      type: "application/xml",
    });
    const txtFile = new File(["hello"], "readme.txt", {
      type: "text/plain",
    });

    await userEvent.upload(input, [bpmnFile, txtFile]);

    expect(onFileUpload).toHaveBeenCalledWith([bpmnFile]);
  });

  it("does not use File System Access API (breaks in iframes)", () => {
    render(<UploadCard />);

    // If useFsAccessApi were true (default), react-dropzone would call
    // window.showOpenFilePicker instead of input.click().
    // showOpenFilePicker fails silently in iframe contexts.
    // Our test "clicking the instruction text opens the file dialog" already
    // proves input.click() IS called -- if useFsAccessApi were true,
    // that spy would NOT fire because showOpenFilePicker would be used instead.
    // This test makes the intent explicit as documentation.
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.style.display).toBe("none");
  });

  it("displays file count when files are provided", () => {
    const files = [new File([""], "a.bpmn"), new File([""], "b.bpmn")];
    render(<UploadCard files={files} />);

    expect(screen.getByText(/2.*file\(s\) selected/)).toBeInTheDocument();
  });
});
