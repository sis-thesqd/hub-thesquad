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
        const seenIds = new Set<string>();
        const options: FolderOption[] = [
            { id: "__create_new__", label: "+ Create new folder" },
        ];
        seenIds.add("__create_new__");

        // Department root options
        departments.forEach((dept) => {
            const id = `dept-root-${dept.id}`;
            if (!seenIds.has(id)) {
                seenIds.add(id);
                options.push({
                    id,
                    label: `${dept.name} (Root)`,
                    supportingText: "Top level",
                });
            }
        });

        // Folder options
        allFolders.forEach((folder) => {
            if (!seenIds.has(folder.id)) {
                seenIds.add(folder.id);
                const dept = departments.find((d) => d.id === folder.department_id);
                const path = allFolderPathById.get(folder.id)?.join("/") ?? folder.slug;
                options.push({
                    id: folder.id,
                    label: folder.name,
                    supportingText: `${dept?.name ?? "Unknown"} / ${path}`,
                    emoji: folder.emoji ?? undefined,
                });
            }
        });

        return options;
    }, [allFolders, allFolderPathById, departments]);
};
