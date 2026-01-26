"use client";

import { useMemo } from "react";
import type { DirectoryEntry, RipplingDepartment } from "@/utils/supabase/types";

type FolderOption = {
    id: string;
    label: string;
    supportingText?: string;
    emoji?: string;
};

type UseFolderOptionsParams = {
    allFolders: DirectoryEntry[];
    allFolderPathById: Map<string, string[]>;
    departments: RipplingDepartment[];
};

export const useFolderOptions = ({
    allFolders,
    allFolderPathById,
    departments,
}: UseFolderOptionsParams): FolderOption[] => {
    return useMemo(() => {
        const options = allFolders.map((folder) => {
            const dept = departments.find((d) => d.id === folder.department_id);
            const path = allFolderPathById.get(folder.id)?.join("/") ?? folder.slug;
            return {
                id: folder.id,
                label: folder.name,
                supportingText: `${dept?.name ?? "Unknown"} / ${path}`,
                emoji: folder.emoji ?? undefined,
            };
        });

        return [
            { id: "__create_new__", label: "+ Create new folder" },
            ...options,
        ];
    }, [allFolders, allFolderPathById, departments]);
};
