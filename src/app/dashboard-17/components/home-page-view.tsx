"use client";

import { HomeGrid } from "@/app/components/home-grid";
import { RecentPages } from "@/app/components/recent-pages";
import type { Department, NavigationPage, DirectoryEntry, Frame } from "@/utils/supabase/types";

interface HomePageViewProps {
    departments: Department[];
    navigationPages: NavigationPage[];
    entries: DirectoryEntry[];
    frames: Frame[];
    userDepartmentId: string | null;
    favoriteDepartmentIds: Set<string>;
    favoriteEntryIds: Set<string>;
    onToggleDepartmentFavorite: (deptId: string) => void;
}

export const HomePageView = ({
    departments,
    navigationPages,
    entries,
    frames,
    userDepartmentId,
    favoriteDepartmentIds,
    favoriteEntryIds,
    onToggleDepartmentFavorite,
}: HomePageViewProps) => {
    return (
        <>
            <HomeGrid
                departments={departments}
                navigationPages={navigationPages}
                entries={entries}
                userDepartmentId={userDepartmentId}
                favoriteDepartmentIds={favoriteDepartmentIds}
                onToggleFavorite={onToggleDepartmentFavorite}
            />
            <RecentPages
                entries={entries}
                frames={frames}
                departments={departments}
                navigationPages={navigationPages}
                userDepartmentId={userDepartmentId}
                favoriteEntryIds={favoriteEntryIds}
            />
        </>
    );
};
