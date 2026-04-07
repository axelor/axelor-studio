import { type ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

interface RouterWrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

/**
 * Test wrapper that provides a MemoryRouter context for components
 * that use react-router-dom hooks (useParams, useLocation, useNavigate, etc.).
 */
export function RouterWrapper({
  children,
  initialEntries = ["/"],
}: RouterWrapperProps) {
  const router = createMemoryRouter([{ path: "*", element: children }], {
    initialEntries,
  });
  return <RouterProvider router={router} />;
}
