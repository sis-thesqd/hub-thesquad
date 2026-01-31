import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { buildPathToRoot, createEntriesMap } from "@/utils/directory/build-path";
import { getDepartmentSlug, buildDepartmentUrl } from "@/utils/department-slugs";
import type { Department, NavigationPage, DirectoryEntry } from "@/utils/supabase/types";

export const useCommandMenuHandler = (
    entries: DirectoryEntry[],
    departments: Department[],
    navigationPages: NavigationPage[]
) => {
    const router = useRouter();
    const appendUrlParams = useAppendUrlParams();

    const handleCommandMenuSelect = useCallback((type: "department" | "folder" | "page", id: string) => {
        const entriesById = createEntriesMap(entries);

        if (type === "department") {
            const slug = getDepartmentSlug(id, departments, navigationPages);
            router.push(appendUrlParams(`/${slug}`));
        } else if (type === "folder") {
            const folder = entriesById.get(id);
            if (folder) {
                const pathParts = buildPathToRoot(entriesById, folder);
                const url = buildDepartmentUrl(folder.department_id, pathParts, departments, navigationPages);
                router.push(appendUrlParams(url));
            }
        } else if (type === "page") {
            const entry = entries.find((e) => e.frame_id === id);
            if (entry) {
                const pathParts = buildPathToRoot(entriesById, entry);
                const url = buildDepartmentUrl(entry.department_id, pathParts, departments, navigationPages);
                router.push(appendUrlParams(url));
            }
        }
    }, [appendUrlParams, entries, departments, navigationPages, router]);

    return handleCommandMenuSelect;
};
