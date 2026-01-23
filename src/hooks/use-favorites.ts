"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseFetch } from "@/utils/supabase/rest";
import type { ShFavorite } from "@/utils/supabase/types";
import { toggleFavorite as toggleFavoriteAction } from "@/app/api/directory/actions";

interface UseFavoritesOptions {
    userId: string | undefined;
}

// Query key for favorites
export const favoritesKeys = {
    all: ["favorites"] as const,
    user: (userId: string) => [...favoritesKeys.all, userId] as const,
};

export const fetchFavorites = async (userId: string): Promise<ShFavorite[]> => {
    return supabaseFetch<ShFavorite[]>(
        `sh_favorites?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`,
        { skipCache: true }
    );
};

export const useFavorites = ({ userId }: UseFavoritesOptions) => {
    const queryClient = useQueryClient();

    const queryKey = favoritesKeys.user(userId ?? "");
    
    // Check if data exists in cache to avoid showing loading state unnecessarily
    const cachedData = userId ? queryClient.getQueryData<ShFavorite[]>(queryKey) : undefined;
    
    const { data: favorites = cachedData ?? [], isLoading, isFetched, refetch } = useQuery({
        queryKey,
        queryFn: () => fetchFavorites(userId!),
        enabled: !!userId,
        staleTime: 1 * 60 * 1000, // 1 minute
        // Use cached data as placeholder to avoid loading state if data exists
        placeholderData: cachedData,
    });
    
    // Has data been fetched at least once (either from cache or network)?
    const hasLoadedOnce = isFetched || !!cachedData;

    const isFavorite = useCallback(
        (entryId?: string, departmentId?: string): boolean => {
            if (entryId) {
                return favorites.some((f) => f.entry_id === entryId);
            }
            if (departmentId) {
                return favorites.some((f) => f.department_id === departmentId);
            }
            return false;
        },
        [favorites]
    );

    const toggleFavorite = useCallback(
        async (entryId?: string, departmentId?: string) => {
            if (!userId) return;

            const existing = favorites.find((f) =>
                entryId ? f.entry_id === entryId : f.department_id === departmentId
            );

            // Optimistically update UI
            if (existing) {
                queryClient.setQueryData<ShFavorite[]>(
                    favoritesKeys.user(userId),
                    (old) => old?.filter((f) => f.id !== existing.id) ?? []
                );
            } else {
                // Add optimistic placeholder
                const optimisticFavorite: ShFavorite = {
                    id: `optimistic-${Date.now()}`,
                    user_id: userId,
                    entry_id: entryId ?? null,
                    department_id: departmentId ?? null,
                    created_at: new Date().toISOString(),
                };
                queryClient.setQueryData<ShFavorite[]>(
                    favoritesKeys.user(userId),
                    (old) => [optimisticFavorite, ...(old ?? [])]
                );
            }

            // Call server action
            const result = await toggleFavoriteAction(userId, entryId, departmentId);

            if (!result.success) {
                console.error("Failed to toggle favorite:", result.error);
                // Revert on error by refetching
                queryClient.invalidateQueries({ queryKey: favoritesKeys.user(userId) });
            } else {
                // Refetch to get the actual data
                queryClient.invalidateQueries({ queryKey: favoritesKeys.user(userId) });
            }
        },
        [userId, favorites, queryClient]
    );

    const favoriteEntryIds = useMemo(
        () => favorites.filter((f) => f.entry_id !== null).map((f) => f.entry_id as string),
        [favorites]
    );

    const favoriteDepartmentIds = useMemo(
        () => favorites.filter((f) => f.department_id !== null).map((f) => f.department_id as string),
        [favorites]
    );

    return {
        favorites,
        // Show loading only if we haven't loaded data yet
        isLoading: !hasLoadedOnce && !!userId,
        // True once data has been fetched at least once
        hasLoaded: hasLoadedOnce,
        isFavorite,
        toggleFavorite,
        favoriteEntryIds,
        favoriteDepartmentIds,
        refreshFavorites: refetch,
    };
};
