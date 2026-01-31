"use client";

import { useRouter } from "next/navigation";
import { DirectoryApp } from "@/components/app/directory-app";
import { useUrlParams } from "@/hooks/use-url-params";
import type { Department, NavigationPage, DirectoryEntry, Frame } from "@/utils/supabase/types";
import type { ActiveEntryInfo } from "@/components/app/directory-app/types";
import type React from "react";

interface DirectoryPageViewProps {
    selectedDepartmentId: string;
    initialPath?: string[];
    departments: Department[];
    entries: DirectoryEntry[];
    frames: Frame[];
    navigationPages: NavigationPage[];
    initialModalAction: "folder" | "page" | null;
    favoriteEntryIds: Set<string>;
    onHeaderContentChange: (content: React.ReactNode) => void;
    onActiveEntryChange: (info: ActiveEntryInfo) => void;
    onToggleFavorite: (entryId?: string, departmentId?: string) => void;
    onFullscreen: () => void;
}

export const DirectoryPageView = ({
    selectedDepartmentId,
    initialPath,
    departments,
    entries,
    frames,
    navigationPages,
    initialModalAction,
    favoriteEntryIds,
    onHeaderContentChange,
    onActiveEntryChange,
    onToggleFavorite,
    onFullscreen,
}: DirectoryPageViewProps) => {
    const router = useRouter();
    const urlParams = useUrlParams();

    const handleModalActionHandled = () => {
        const newParams = new URLSearchParams(urlParams.toString());
        newParams.delete("modal");
        const newUrl = newParams.toString()
            ? `${window.location.pathname}?${newParams.toString()}`
            : window.location.pathname;
        router.replace(newUrl);
    };

    return (
        <DirectoryApp
            initialDepartmentId={selectedDepartmentId}
            initialPath={initialPath}
            variant="embedded"
            showDepartments={false}
            departmentsOverride={departments}
            entriesOverride={entries}
            framesOverride={frames}
            navigationPages={navigationPages}
            onHeaderContentChange={onHeaderContentChange}
            onActiveEntryChange={onActiveEntryChange}
            initialModalAction={initialModalAction}
            onModalActionHandled={handleModalActionHandled}
            favoriteEntryIds={favoriteEntryIds}
            onToggleFavorite={onToggleFavorite}
            onFullscreen={onFullscreen}
        />
    );
};
