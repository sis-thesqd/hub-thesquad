import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseFetch } from "@/utils/supabase/rest";
import type { DirectoryEntry, Frame, NavigationPage, RipplingDepartment, ShConfig } from "@/utils/supabase/types";

// Query keys for cache management
export const directoryKeys = {
    all: ["directory"] as const,
    departments: () => [...directoryKeys.all, "departments"] as const,
    navigationPages: () => [...directoryKeys.all, "navigationPages"] as const,
    entries: () => [...directoryKeys.all, "entries"] as const,
    frames: () => [...directoryKeys.all, "frames"] as const,
};

// Fetch functions
const fetchDepartments = async (): Promise<RipplingDepartment[]> => {
    return supabaseFetch<RipplingDepartment[]>(
        "rippling_departments?select=id,name&order=name.asc",
        { skipCache: true }
    );
};

const fetchNavigationPages = async (): Promise<NavigationPage[]> => {
    const data = await supabaseFetch<ShConfig<NavigationPage[]>[]>(
        "sh_config?key=eq.navigation_pages&select=value",
        { skipCache: true }
    );
    return data?.[0]?.value ?? [];
};

const fetchEntries = async (): Promise<DirectoryEntry[]> => {
    return supabaseFetch<DirectoryEntry[]>(
        "sh_directory?select=id,department_id,parent_id,frame_id,name,slug,sort_order,emoji&order=name.asc",
        { skipCache: true }
    );
};

const fetchFrames = async (): Promise<Frame[]> => {
    return supabaseFetch<Frame[]>(
        "sh_frames?select=id,name,description,iframe_url,department_ids,created_at&order=name.asc",
        { skipCache: true }
    );
};

// Individual hooks for granular control
export function useDepartments() {
    return useQuery({
        queryKey: directoryKeys.departments(),
        queryFn: fetchDepartments,
        staleTime: 10 * 60 * 1000, // Departments rarely change - 10 min
    });
}

export function useNavigationPages() {
    return useQuery({
        queryKey: directoryKeys.navigationPages(),
        queryFn: fetchNavigationPages,
        staleTime: 10 * 60 * 1000, // Navigation config rarely changes - 10 min
    });
}

export function useEntries() {
    return useQuery({
        queryKey: directoryKeys.entries(),
        queryFn: fetchEntries,
        staleTime: 1 * 60 * 1000, // Entries change more often - 1 min
    });
}

export function useFrames() {
    return useQuery({
        queryKey: directoryKeys.frames(),
        queryFn: fetchFrames,
        staleTime: 1 * 60 * 1000, // Frames change more often - 1 min
    });
}

// Combined hook for all directory data - returns data immediately if cached
export function useDirectoryQueries() {
    const departments = useDepartments();
    const navigationPages = useNavigationPages();
    const entries = useEntries();
    const frames = useFrames();

    return {
        departments: departments.data ?? [],
        navigationPages: navigationPages.data ?? [],
        entries: entries.data ?? [],
        frames: frames.data ?? [],
        isLoading: departments.isLoading || navigationPages.isLoading || entries.isLoading || frames.isLoading,
        isError: departments.isError || navigationPages.isError || entries.isError || frames.isError,
        // Refetch functions for after mutations
        refetchAll: async () => {
            await Promise.all([
                departments.refetch(),
                navigationPages.refetch(),
                entries.refetch(),
                frames.refetch(),
            ]);
        },
        refetchEntries: entries.refetch,
        refetchFrames: frames.refetch,
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
            queryClient.invalidateQueries({ queryKey: directoryKeys.entries() });
        },
        invalidateFrames: () => {
            queryClient.invalidateQueries({ queryKey: directoryKeys.frames() });
        },
        invalidateEntriesAndFrames: () => {
            queryClient.invalidateQueries({ queryKey: directoryKeys.entries() });
            queryClient.invalidateQueries({ queryKey: directoryKeys.frames() });
        },
    };
}

// Prefetch functions for link hover
export function usePrefetchDirectory() {
    const queryClient = useQueryClient();

    return {
        prefetchAll: () => {
            queryClient.prefetchQuery({
                queryKey: directoryKeys.departments(),
                queryFn: fetchDepartments,
                staleTime: 10 * 60 * 1000,
            });
            queryClient.prefetchQuery({
                queryKey: directoryKeys.navigationPages(),
                queryFn: fetchNavigationPages,
                staleTime: 10 * 60 * 1000,
            });
            queryClient.prefetchQuery({
                queryKey: directoryKeys.entries(),
                queryFn: fetchEntries,
                staleTime: 1 * 60 * 1000,
            });
            queryClient.prefetchQuery({
                queryKey: directoryKeys.frames(),
                queryFn: fetchFrames,
                staleTime: 1 * 60 * 1000,
            });
        },
    };
}
