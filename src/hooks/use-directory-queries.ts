import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DirectoryEntry, Frame, NavigationPage, RipplingDepartment } from "@/utils/supabase/types";

// Query keys for cache management
export const directoryKeys = {
    all: ["directory"] as const,
    combined: () => [...directoryKeys.all, "combined"] as const,
};

// Combined response type from API
interface DirectoryData {
    departments: RipplingDepartment[];
    entries: DirectoryEntry[];
    frames: Frame[];
    navigationPages: NavigationPage[];
    divisionOrder: string[];
}

// Single fetch function that gets all directory data
export const fetchDirectoryData = async (): Promise<DirectoryData> => {
    const response = await fetch("/api/directory");
    if (!response.ok) {
        throw new Error("Failed to fetch directory data");
    }
    return response.json();
};

// Combined hook for all directory data - single API call, no duplicates
export function useDirectoryQueries() {
    const query = useQuery({
        queryKey: directoryKeys.combined(),
        queryFn: fetchDirectoryData,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        departments: query.data?.departments ?? [],
        navigationPages: query.data?.navigationPages ?? [],
        entries: query.data?.entries ?? [],
        frames: query.data?.frames ?? [],
        divisionOrder: query.data?.divisionOrder ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        refetchAll: query.refetch,
        refetchEntries: query.refetch,
        refetchFrames: query.refetch,
    };
}

// Hook for invalidating directory data after mutations
export function useInvalidateDirectory() {
    const queryClient = useQueryClient();

    return {
        invalidateAll: () => {
            queryClient.invalidateQueries({ queryKey: directoryKeys.all });
        },
        invalidateEntries: () => {
            queryClient.invalidateQueries({ queryKey: directoryKeys.combined() });
        },
        invalidateFrames: () => {
            queryClient.invalidateQueries({ queryKey: directoryKeys.combined() });
        },
        invalidateEntriesAndFrames: () => {
            queryClient.invalidateQueries({ queryKey: directoryKeys.combined() });
        },
    };
}

// Prefetch functions for link hover
export function usePrefetchDirectory() {
    const queryClient = useQueryClient();

    return {
        prefetchAll: () => {
            queryClient.prefetchQuery({
                queryKey: directoryKeys.combined(),
                queryFn: fetchDirectoryData,
                staleTime: 5 * 60 * 1000,
            });
        },
    };
}
