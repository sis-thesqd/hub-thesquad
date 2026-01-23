"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data is considered fresh for 5 minutes
                        staleTime: 5 * 60 * 1000,
                        // Keep data in cache for 30 minutes
                        gcTime: 30 * 60 * 1000,
                        // Show stale data while refetching
                        refetchOnWindowFocus: false,
                        // Retry failed requests once
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

// Export queryClient for prefetching outside of components
let globalQueryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
    if (!globalQueryClient) {
        globalQueryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 5 * 60 * 1000,
                    gcTime: 30 * 60 * 1000,
                    refetchOnWindowFocus: false,
                    retry: 1,
                },
            },
        });
    }
    return globalQueryClient;
}
