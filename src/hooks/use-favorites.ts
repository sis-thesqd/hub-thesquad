"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseFetch, supabaseUpsert } from "@/utils/supabase/rest";
import type { ShFavorite } from "@/utils/supabase/types";

interface UseFavoritesOptions {
    userId: string | undefined;
}

export const useFavorites = ({ userId }: UseFavoritesOptions) => {
    const [favorites, setFavorites] = useState<ShFavorite[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadFavorites = useCallback(async () => {
        if (!userId) {
            setFavorites([]);
            return;
        }

        setIsLoading(true);
        try {
            const data = await supabaseFetch<ShFavorite[]>(
                `sh_favorites?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`
            );
            setFavorites(data);
        } catch (err) {
            console.error("Failed to load favorites:", err);
            setFavorites([]);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void loadFavorites();
    }, [loadFavorites]);

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
                // Remove favorite
                await supabaseFetch(`sh_favorites?id=eq.${existing.id}`, {
                    method: "DELETE",
                });
                setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
            } else {
                // Add favorite - supabaseUpsert returns an array
                const result = await supabaseUpsert<ShFavorite[]>("sh_favorites", {
                    user_id: userId,
                    entry_id: entryId || null,
                    department_id: departmentId || null,
                });
                const newFavorite = Array.isArray(result) ? result[0] : result;
                if (newFavorite) {
                    setFavorites((prev) => [newFavorite, ...prev]);
                }
            }
        },
        [userId, favorites]
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
        isLoading,
        isFavorite,
        toggleFavorite,
        favoriteEntryIds,
        favoriteDepartmentIds,
        refreshFavorites: loadFavorites,
    };
};
