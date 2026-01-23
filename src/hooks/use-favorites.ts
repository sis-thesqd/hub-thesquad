"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseFetch, supabaseUpsert } from "@/utils/supabase/rest";
import type { ShFavorite } from "@/utils/supabase/types";

interface UseFavoritesOptions {
    userId: string | undefined;
}

// Query key for favorites
export const favoritesKeys = {
    all: ["favorites"] as const,
    user: (userId: string) => [...favoritesKeys.all, userId] as const,
};

const fetchFavorites = async (userId: string): Promise<ShFavorite[]> => {
    return supabaseFetch<ShFavorite[]>(
        `sh_favorites?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`,
        { skipCache: true }
    );
};

export const useFavorites = ({ userId }: UseFavoritesOptions) => {
    const queryClient = useQueryClient();

    const { data: favorites = [], isLoading, refetch } = useQuery({
        queryKey: favoritesKeys.user(userId ?? ""),
        queryFn: () => fetchFavorites(userId!),
        enabled: !!userId,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

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

            if (existing) {
                // Optimistically update
                queryClient.setQueryData<ShFavorite[]>(
                    favoritesKeys.user(userId),
                    (old) => old?.filter((f) => f.id !== existing.id) ?? []
                );

                // Remove favorite
                await supabaseFetch(`sh_favorites?id=eq.${existing.id}`, {
                    method: "DELETE",
                });
            } else {
                // Add favorite
                const result = await supabaseUpsert<ShFavorite[]>("sh_favorites", {
                    user_id: userId,
                    entry_id: entryId || null,
                    department_id: departmentId || null,
                });
                const newFavorite = Array.isArray(result) ? result[0] : result;
                if (newFavorite) {
                    // Optimistically update
                    queryClient.setQueryData<ShFavorite[]>(
                        favoritesKeys.user(userId),
                        (old) => [newFavorite, ...(old ?? [])]
                    );
                }
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
        isLoading: isLoading && !!userId,
        isFavorite,
        toggleFavorite,
        favoriteEntryIds,
        favoriteDepartmentIds,
        refreshFavorites: refetch,
    };
};
