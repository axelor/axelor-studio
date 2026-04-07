import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { Breadcrumbs } from "../../components/shared/Breadcrumbs";

/**
 * Render Breadcrumbs at a given route path using a MemoryRouter.
 * The route pattern must match the path for useParams to extract params.
 */
function renderWithRoute(path: string) {
  const routes = [
    {
      path: "/",
      element: <Breadcrumbs />,
      children: [],
    },
    {
      path: "/dashboard",
      element: <Breadcrumbs />,
    },
    {
      path: "/process/:processId",
      element: <Breadcrumbs />,
    },
    {
      path: "/process/:processId/instance/:instanceId",
      element: <Breadcrumbs />,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: [path],
  });
  return render(<RouterProvider router={router} />);
}

describe("Breadcrumbs", () => {
  it("returns null on /dashboard (root level)", () => {
    const { container } = renderWithRoute("/dashboard");
    expect(container.innerHTML).toBe("");
  });

  it("returns null on / (root redirect)", () => {
    const { container } = renderWithRoute("/");
    expect(container.innerHTML).toBe("");
  });

  it("renders Dashboard link on /process/:id", () => {
    renderWithRoute("/process/42");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders process segment on /process/:id", () => {
    renderWithRoute("/process/42");
    expect(screen.getByText("Process #42")).toBeInTheDocument();
  });

  it("renders 3 segments on /process/:id/instance/:id", () => {
    renderWithRoute("/process/42/instance/inst-abc-001");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Process #42")).toBeInTheDocument();
    // Instance segment shows truncated ID
    expect(screen.getByText(/Instance #inst-abc/)).toBeInTheDocument();
  });

  it("truncates instance ID to 8 characters", () => {
    renderWithRoute("/process/42/instance/abcdefghijklmnop");
    const instanceSegment = screen.getByText(/Instance #abcdefgh/);
    expect(instanceSegment).toHaveAttribute(
      "title",
      expect.stringContaining("abcdefghijklmnop"),
    );
  });

  it("has aria-label on nav element", () => {
    renderWithRoute("/process/42");
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("marks last segment as current page", () => {
    renderWithRoute("/process/42");
    const currentSegment = screen.getByText("Process #42");
    expect(currentSegment).toHaveAttribute("aria-current", "page");
  });
});
