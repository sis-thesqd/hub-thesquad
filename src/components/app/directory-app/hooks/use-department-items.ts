"use client";

import { useMemo } from "react";
import type { FC } from "react";
import { FolderClosed } from "@untitledui/icons";
import { getIconByName } from "@/utils/icon-map";
import type { NavigationPage, RipplingDepartment } from "@/utils/supabase/types";

export type DepartmentItem = {
    id: string;
    label: string;
    icon: FC<{ className?: string }>;
};

type UseDepartmentItemsParams = {
    departments: RipplingDepartment[];
    navigationPages: NavigationPage[];
};

export const useDepartmentItems = ({
    departments,
    navigationPages,
}: UseDepartmentItemsParams): DepartmentItem[] => {
    return useMemo(() => {
        return departments.map((dept) => {
            // Find matching navigation page by slugified name
            const deptSlug = dept.name
                ?.toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
            const navPage = navigationPages.find((page) => page.slug === deptSlug);
            const Icon = navPage ? getIconByName(navPage.icon, FolderClosed) : FolderClosed;

            return {
                id: dept.id,
                label: dept.name ?? dept.id,
                icon: Icon,
            };
        });
    }, [departments, navigationPages]);
};
