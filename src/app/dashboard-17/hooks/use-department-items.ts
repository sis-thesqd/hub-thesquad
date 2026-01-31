import { useMemo } from "react";
import { FolderClosed } from "@untitledui/icons";
import { getIconByName } from "@/utils/icon-map";
import { slugify } from "@/utils/slugify";
import type { Department, NavigationPage, DirectoryEntry } from "@/utils/supabase/types";

export const useDepartmentItems = (
    departments: Department[],
    navigationPages: NavigationPage[],
    divisionOrder: string[]
) => {
    // Sidebar items grouped by division
    const sidebarItems = useMemo(() => {
        const groupedPages: Record<string, typeof navigationPages> = {};
        navigationPages.forEach((page) => {
            const division = page.division || "SQUAD";
            if (!groupedPages[division]) {
                groupedPages[division] = [];
            }
            groupedPages[division].push(page);
        });

        const items: any[] = [];

        divisionOrder.forEach((division) => {
            const pagesInDivision = groupedPages[division];
            if (pagesInDivision && pagesInDivision.length > 0) {
                items.push({
                    label: division,
                    isHeading: true,
                });

                pagesInDivision.forEach((page) => {
                    const department = departments.find((dept) => slugify(dept.name) === page.slug);
                    if (department) {
                        items.push({
                            label: page.title,
                            href: `/${page.slug}`,
                            icon: getIconByName(page.icon, FolderClosed),
                        });
                    }
                });
            }
        });

        return items;
    }, [departments, navigationPages, divisionOrder]);

    // Department items with icons for modals
    const modalDepartmentItems = useMemo(() => {
        return departments.map((dept) => {
            const deptSlug = slugify(dept.name);
            const navPage = navigationPages.find((page) => page.slug === deptSlug);
            const Icon = navPage ? getIconByName(navPage.icon, FolderClosed) : FolderClosed;

            return {
                id: dept.id,
                label: dept.name ?? dept.id,
                icon: Icon,
            };
        });
    }, [departments, navigationPages]);

    return { sidebarItems, modalDepartmentItems };
};

export const useFolderOptions = (
    entries: DirectoryEntry[],
    departments: Department[],
    navigationPages: NavigationPage[]
) => {
    return useMemo(() => {
        // Department root options
        const departmentRoots = departments.map((dept) => {
            const deptSlug = slugify(dept.name);
            const navPage = navigationPages.find((page) => page.slug === deptSlug);
            const Icon = navPage ? getIconByName(navPage.icon, FolderClosed) : FolderClosed;
            return {
                id: `dept-root-${dept.id}`,
                label: `${dept.name} (Root)`,
                supportingText: "Top level",
                icon: Icon,
            };
        });

        // Existing folder options
        const folders = entries.filter((e) => !e.frame_id);
        const folderOptions = folders.map((folder) => {
            const dept = departments.find((d) => d.id === folder.department_id);
            return {
                id: folder.id,
                label: folder.name,
                supportingText: dept?.name ?? "Unknown",
                emoji: folder.emoji ?? undefined,
            };
        });

        return [
            { id: "__create_new__", label: "+ Create new folder" },
            ...departmentRoots,
            ...folderOptions,
        ];
    }, [entries, departments, navigationPages]);
};
