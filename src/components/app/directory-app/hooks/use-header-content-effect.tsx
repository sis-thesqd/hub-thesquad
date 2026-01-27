"use client";

import { useEffect } from "react";
import type React from "react";
import type { DirectoryEntry, Frame, RipplingDepartment } from "@/utils/supabase/types";
import type { FormState } from "../types";
import { getPagePlacements } from "@/app/api/directory/actions";
import {
    EmbeddedHeaderContent,
    EmbeddedFolderHeader,
} from "../components";
import type { DepartmentItem } from "./use-department-items";
import type { UseListDataHelpersReturn } from "./use-list-data-helpers";

type UseHeaderContentEffectParams = {
    variant: "full" | "embedded";
    onHeaderContentChange?: (content: React.ReactNode | null) => void;
    activeEntry: DirectoryEntry | null | undefined;
    activeFrame: Frame | null | undefined;
    departments: RipplingDepartment[];
    departmentItems: DepartmentItem[];
    entries: DirectoryEntry[];
    selectedDepartmentId: string | null;
    entriesById: Map<string, DirectoryEntry>;
    allFoldersById: Map<string, DirectoryEntry>;
    favoriteEntryIds: string[];
    toggleFavorite: (entryId: string) => void;
    pageDepartments: UseListDataHelpersReturn["pageDepartments"];
    pagePlacements: UseListDataHelpersReturn["pagePlacements"];
    replaceSelectedItems: UseListDataHelpersReturn["replaceSelectedItems"];
    setPageForm: (form: FormState) => void;
    setFolderForm: (form: FormState) => void;
    setEditPageOpen: (open: boolean) => void;
    setEditFolderOpen: (open: boolean) => void;
    setCreateFolderOpen: (open: boolean) => void;
    setCreatePageOpen: (open: boolean) => void;
    setCreateFolderParentId: (id: string | null) => void;
    setError: (error: string | null) => void;
    emptyForm: FormState;
    iframePathSegments?: string[];
};

export const useHeaderContentEffect = ({
    variant,
    onHeaderContentChange,
    activeEntry,
    activeFrame,
    departments,
    departmentItems,
    entries,
    selectedDepartmentId,
    entriesById,
    allFoldersById,
    favoriteEntryIds,
    toggleFavorite,
    pageDepartments,
    pagePlacements,
    replaceSelectedItems,
    setPageForm,
    setFolderForm,
    setEditPageOpen,
    setEditFolderOpen,
    setCreateFolderOpen,
    setCreatePageOpen,
    setCreateFolderParentId,
    setError,
    emptyForm,
    iframePathSegments = [],
}: UseHeaderContentEffectParams) => {
    useEffect(() => {
        if (variant === "embedded" && onHeaderContentChange) {
            if (activeFrame && activeEntry) {
                // Page view header
                const handleEditClick = async () => {
                    setPageForm({
                        name: activeFrame.name,
                        slug: activeEntry.slug,
                        iframeUrl: activeFrame.iframe_url,
                        description: activeFrame.description ?? "",
                        emoji: activeEntry.emoji ?? "",
                    });
                    replaceSelectedItems(
                        pageDepartments,
                        activeFrame.department_ids.map((id) => {
                            const deptItem = departmentItems.find((d) => d.id === id);
                            return {
                                id,
                                label: deptItem?.label ?? id,
                                icon: deptItem?.icon,
                            };
                        }),
                    );
                    // Query ALL placements for this frame (across all departments)
                    const placementsResult = await getPagePlacements(activeFrame.id);
                    const placements = (placementsResult.data ?? [])
                        .filter((entry): entry is { id: string; parent_id: string } => entry.parent_id !== null)
                        .map((entry) => entry.parent_id);
                    replaceSelectedItems(
                        pagePlacements,
                        placements.map((id) => {
                            const folder = allFoldersById.get(id);
                            return {
                                id,
                                label: folder?.name ?? id,
                                emoji: folder?.emoji ?? undefined,
                            };
                        }),
                    );
                    setEditPageOpen(true);
                };

                onHeaderContentChange(
                    <EmbeddedHeaderContent
                        activeFrame={activeFrame}
                        onEdit={handleEditClick}
                        isFavorite={favoriteEntryIds.includes(activeEntry.id)}
                        onToggleFavorite={() => toggleFavorite(activeEntry.id)}
                        pathSegments={iframePathSegments}
                    />
                );
            } else {
                // Folder view header - action buttons only
                onHeaderContentChange(
                    <EmbeddedFolderHeader
                        showEditButton={!!activeEntry && !activeEntry.frame_id}
                        onEditFolder={() => {
                            if (!activeEntry) return;
                            setFolderForm({
                                ...emptyForm,
                                name: activeEntry.name,
                                slug: activeEntry.slug,
                                emoji: activeEntry.emoji ?? "",
                            });
                            setEditFolderOpen(true);
                        }}
                        onNewFolder={() => {
                            setFolderForm(emptyForm);
                            setCreateFolderParentId(activeEntry?.id ?? null);
                            setCreateFolderOpen(true);
                        }}
                        onNewPage={() => {
                            setPageForm(emptyForm);
                            const parentId = activeEntry?.id ?? null;
                            if (parentId) {
                                const folder = entriesById.get(parentId);
                                const label = folder?.name ?? "Current folder";
                                const emoji = folder?.emoji ?? undefined;
                                replaceSelectedItems(pagePlacements, [{ id: parentId, label, emoji }]);
                                // Pre-fill the department based on the folder's department
                                const deptItem = departmentItems.find((d) => d.id === folder?.department_id);
                                if (deptItem) {
                                    replaceSelectedItems(pageDepartments, [{ id: deptItem.id, label: deptItem.label, icon: deptItem.icon }]);
                                } else {
                                    replaceSelectedItems(pageDepartments, []);
                                }
                            } else {
                                replaceSelectedItems(pagePlacements, []);
                                replaceSelectedItems(pageDepartments, []);
                            }
                            setError(null);
                            setCreatePageOpen(true);
                        }}
                        isFavorite={activeEntry ? favoriteEntryIds.includes(activeEntry.id) : false}
                        onToggleFavorite={activeEntry ? () => toggleFavorite(activeEntry.id) : undefined}
                    />
                );
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variant, onHeaderContentChange, activeFrame, activeEntry, departments, departmentItems, entries, selectedDepartmentId, entriesById, allFoldersById, favoriteEntryIds, iframePathSegments]);
};
