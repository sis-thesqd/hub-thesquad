"use client";

import { useEffect } from "react";
import type { DirectoryEntry, Frame, NavigationPage, RipplingDepartment } from "@/utils/supabase/types";
import type { ActiveEntryInfo } from "../types";

type UseActiveEntryEffectParams = {
    onActiveEntryChange?: (entry: ActiveEntryInfo) => void;
    activeEntry: DirectoryEntry | null | undefined;
    activeFrame: Frame | null | undefined;
    selectedDepartmentId: string | null;
    departments: RipplingDepartment[];
    navigationPages: NavigationPage[];
    isExternalPagesView: boolean;
    iframePathSegments?: string[];
};

export const useActiveEntryEffect = ({
    onActiveEntryChange,
    activeEntry,
    activeFrame,
    selectedDepartmentId,
    departments,
    navigationPages,
    isExternalPagesView,
    iframePathSegments = [],
}: UseActiveEntryEffectParams) => {
    useEffect(() => {
        if (onActiveEntryChange) {
            if (activeFrame) {
                onActiveEntryChange({
                    name: activeFrame.name,
                    emoji: activeEntry?.emoji ?? undefined,
                    isPage: true,
                    frameId: activeFrame.id,
                    pathSegments: iframePathSegments,
                });
            } else if (isExternalPagesView) {
                // External pages virtual folder
                onActiveEntryChange({
                    name: "Pages from Other Departments",
                    icon: "Globe02",
                    isPage: false,
                });
            } else if (activeEntry) {
                onActiveEntryChange({
                    name: activeEntry.name,
                    emoji: activeEntry.emoji ?? undefined,
                    isPage: false,
                });
            } else if (selectedDepartmentId) {
                // At department root level - show department name with icon from navigation pages
                const dept = departments.find((d) => d.id === selectedDepartmentId);
                if (dept && dept.name) {
                    // Find matching navigation page by slugified name
                    const deptSlug = dept.name
                        ?.toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "");
                    const navPage = navigationPages.find((page) => page.slug === deptSlug);
                    onActiveEntryChange({
                        name: dept.name,
                        icon: navPage?.icon ?? undefined,
                        isPage: false,
                    });
                } else {
                    onActiveEntryChange(null);
                }
            } else {
                onActiveEntryChange(null);
            }
        }
    }, [onActiveEntryChange, activeEntry, activeFrame, selectedDepartmentId, departments, navigationPages, isExternalPagesView, iframePathSegments]);
};
