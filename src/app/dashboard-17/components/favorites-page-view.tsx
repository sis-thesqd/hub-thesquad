"use client";

import { FavoritesView } from "@/app/components/favorites-view";
import type { Department, NavigationPage, DirectoryEntry, Frame } from "@/utils/supabase/types";

interface FavoritesPageViewProps {
    favorites: Array<{ id: string; entry_id: string | null; department_id: string | null }>;
    entries: DirectoryEntry[];
    frames: Frame[];
    departments: Department[];
    navigationPages: NavigationPage[];
    onToggleFavorite: (entryId?: string, departmentId?: string) => void;
    isLoading: boolean;
    hasLoaded: boolean;
}

export const FavoritesPageView = ({
    favorites,
    entries,
    frames,
    departments,
    navigationPages,
    onToggleFavorite,
    isLoading,
    hasLoaded,
}: FavoritesPageViewProps) => {
    return (
        <FavoritesView
            favorites={favorites}
            entries={entries}
            frames={frames}
            departments={departments}
            navigationPages={navigationPages}
            onToggleFavorite={onToggleFavorite}
            isLoading={isLoading}
            hasLoaded={hasLoaded}
        />
    );
};
