import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour — AI responses are stable
      gcTime: 1000 * 60 * 60 * 24, // 24 hours in cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
