"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PeriodProvider } from "@/contexts/PeriodContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          gcTime: 5 * 60_000,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
        },
      },
    });

    client.getQueryCache().subscribe((event: any) => {
      if (event.type === "updated" && event.action?.type === "error") {
        const error = event.query?.state?.error;
        console.error("[API Query Error]", error);
      }
    });

    client.getMutationCache().subscribe((event: any) => {
      if (event.type === "updated" && event.action?.type === "error") {
        const error = event.mutation?.state?.error;
        console.error("[API Mutation Error]", error);
      }
    });

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <PeriodProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </PeriodProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
