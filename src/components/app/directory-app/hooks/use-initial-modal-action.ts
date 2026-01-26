"use client";

import { useEffect } from "react";
import { FolderClosed } from "@untitledui/icons";
import { getIconByName } from "@/utils/icon-map";
import type { NavigationPage, RipplingDepartment } from "@/utils/supabase/types";
import type { FormState } from "../types";
import { emptyForm } from "../constants";
import type { UseListDataHelpersReturn } from "./use-list-data-helpers";

type UseInitialModalActionParams = {
    initialModalAction?: "folder" | "page" | null;
    selectedDepartmentId: string | null;
    departments: RipplingDepartment[];
    navigationPages: NavigationPage[];
    workerDepartmentId?: string | null;
    pagePlacements: UseListDataHelpersReturn["pagePlacements"];
    pageDepartments: UseListDataHelpersReturn["pageDepartments"];
    clearSelectedItems: UseListDataHelpersReturn["clearSelectedItems"];
    replaceSelectedItems: UseListDataHelpersReturn["replaceSelectedItems"];
    setFolderForm: (form: FormState) => void;
    setPageForm: (form: FormState) => void;
    setCreateFolderParentId: (id: string | null) => void;
    setCreateFolderOpen: (open: boolean) => void;
    setCreatePageOpen: (open: boolean) => void;
    onModalActionHandled?: () => void;
};

export const useInitialModalAction = ({
    initialModalAction,
    selectedDepartmentId,
    departments,
    navigationPages,
    workerDepartmentId,
    pagePlacements,
    pageDepartments,
    clearSelectedItems,
    replaceSelectedItems,
    setFolderForm,
    setPageForm,
    setCreateFolderParentId,
    setCreateFolderOpen,
    setCreatePageOpen,
    onModalActionHandled,
}: UseInitialModalActionParams) => {
    useEffect(() => {
        if (!initialModalAction || !selectedDepartmentId) return;

        if (initialModalAction === "folder") {
            // Set empty emoji - modal will fetch random emoji on open
            setFolderForm({ ...emptyForm, emoji: "" });
            setCreateFolderParentId(null);
            setCreateFolderOpen(true);
        } else if (initialModalAction === "page") {
            // Set empty emoji - modal will fetch random emoji on open
            setPageForm({ ...emptyForm, emoji: "" });
            clearSelectedItems(pagePlacements);
            // Prefill with user's department if available
            if (workerDepartmentId) {
                const userDept = departments.find((d) => d.id === workerDepartmentId);
                if (userDept) {
                    // Get icon from navigation pages
                    const deptSlug = userDept.name
                        ?.toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "");
                    const navPage = navigationPages.find((page) => page.slug === deptSlug);
                    const Icon = navPage ? getIconByName(navPage.icon, FolderClosed) : FolderClosed;
                    replaceSelectedItems(pageDepartments, [{ id: userDept.id, label: userDept.name ?? userDept.id, icon: Icon }]);
                } else {
                    clearSelectedItems(pageDepartments);
                }
            } else {
                clearSelectedItems(pageDepartments);
            }
            setCreatePageOpen(true);
        }

        onModalActionHandled?.();
    }, [initialModalAction, selectedDepartmentId, clearSelectedItems, replaceSelectedItems, pagePlacements, pageDepartments, departments, navigationPages, workerDepartmentId, onModalActionHandled, setFolderForm, setPageForm, setCreateFolderParentId, setCreateFolderOpen, setCreatePageOpen]);
};
