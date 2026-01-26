"use client";

import { useMemo } from "react";
import type { DirectoryEntry, RipplingDepartment } from "@/utils/supabase/types";

type InlineFolderOption = {
    id: string;
    label: string;
    supportingText?: string;
};

type UseInlineFolderOptionsParams = {
    departments: RipplingDepartment[];
    allFolders: DirectoryEntry[];
    allFolderPathById: Map<string, string[]>;
};

export const useInlineFolderOptions = ({
    departments,
    allFolders,
    allFolderPathById,
}: UseInlineFolderOptionsParams): InlineFolderOption[] => {
    return useMemo(() => {
        const options: InlineFolderOption[] = [];

        departments.forEach((dept) => {
            options.push({
                id: `${dept.id}:root`,
                label: dept.name ?? dept.id,
                supportingText: "Top level",
            });

            const deptFolders = allFolders.filter(
                (folder) => folder.department_id === dept.id
            );
            deptFolders.forEach((folder) => {
                const path = allFolderPathById.get(folder.id)?.join("/") ?? folder.slug;
                options.push({
                    id: `${dept.id}:${folder.id}`,
                    label: folder.name,
                    supportingText: `${dept.name} / ${path}`,
                });
            });
        });

        return options;
    }, [departments, allFolders, allFolderPathById]);
};
