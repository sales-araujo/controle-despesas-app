import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

queryClient.getQueryCache().subscribe((event: any) => {
  if (event.type === "updated" && event.action?.type === "error") {
    const error = event.query?.state?.error;
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe((event: any) => {
  if (event.type === "updated" && event.action?.type === "error") {
    const error = event.mutation?.state?.error;
    console.error("[API Mutation Error]", error);
  }
});

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
