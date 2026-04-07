import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAppTheme } from "@studio/shared/theme";
import { AppRouter } from "./routes/AppRouter";

// Side-effect imports: design system + ECharts registration
import "./styles/suite.css";
import "./echarts-setup";

/**
 * TanStack Query client with cockpit-tuned defaults:
 * - 60s staleTime: dashboard data is acceptable slightly stale
 * - 2 retries: network resilience without excessive hammering
 * - No refetchOnWindowFocus: manual refresh button pattern
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export { queryClient };

export default function App() {
  useAppTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
