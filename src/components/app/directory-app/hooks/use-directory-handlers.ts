"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { useDirectoryCache, useInvalidateDirectory } from "@/hooks/use-directory-queries";
import type { DirectoryEntry, Frame, NavigationPage, RipplingDepartment } from "@/utils/supabase/types";
import type { FormState } from "../types";
import { emptyForm } from "../constants";
import { slugify, buildPathSegments } from "../utils";
import { buildDepartmentUrl } from "@/utils/department-slugs";
import {
    createFolder as createFolderAction,
    updateFolder as updateFolderAction,
    deleteEntry as deleteEntryAction,
    deletePage as deletePageAction,
    createFrame,
    updateFrame,
    createDirectoryEntries,
    updateDirectoryEntriesByFrameId,
    deleteDirectoryEntries,
    getPagePlacements,
    getExistingSlugs,
} from "@/app/api/directory/actions";
import type { DepartmentItem } from "./use-department-items";
import type { UseListDataHelpersReturn } from "./use-list-data-helpers";
import type { DeleteTarget } from "./use-delete-confirmation";

type UseDirectoryHandlersParams = {
    selectedDepartmentId: string | null;
    activeEntry: DirectoryEntry | null | undefined;
    activeFrame: Frame | null | undefined;
    activeParentId: string | null;
    departments: RipplingDepartment[];
    navigationPages: NavigationPage[];
    entriesById: Map<string, DirectoryEntry>;
    allFoldersById: Map<string, DirectoryEntry>;
    pathById: Map<string, string[]>;
    folderForm: FormState;
    setFolderForm: (form: FormState) => void;
    pageForm: FormState;
    setPageForm: (form: FormState) => void;
    inlineFolderForm: FormState;
    setInlineFolderForm: (form: FormState) => void;
    inlineFolderLocation: string;
    setInlineFolderOpen: (open: boolean) => void;
    createFolderParentId: string | null;
    setCreateFolderParentId: (id: string | null) => void;
    setCreateFolderOpen: (open: boolean) => void;
    setCreatePageOpen: (open: boolean) => void;
    setEditFolderOpen: (open: boolean) => void;
    setEditPageOpen: (open: boolean) => void;
    setError: (error: string | null) => void;
    deleteTarget: DeleteTarget;
    setDeleteTarget: (target: DeleteTarget) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    setIsDeleting: (isDeleting: boolean) => void;
    departmentItems: DepartmentItem[];
    pageDepartments: UseListDataHelpersReturn["pageDepartments"];
    pagePlacements: UseListDataHelpersReturn["pagePlacements"];
    clearSelectedItems: UseListDataHelpersReturn["clearSelectedItems"];
    replaceSelectedItems: UseListDataHelpersReturn["replaceSelectedItems"];
};

export const useDirectoryHandlers = ({
    selectedDepartmentId,
    activeEntry,
    activeFrame,
    activeParentId,
    departments,
    navigationPages,
    entriesById,
    allFoldersById,
    pathById,
    folderForm,
    setFolderForm,
    pageForm,
    setPageForm,
    inlineFolderForm,
    setInlineFolderForm,
    inlineFolderLocation,
    setInlineFolderOpen,
    createFolderParentId,
    setCreateFolderParentId,
    setCreateFolderOpen,
    setCreatePageOpen,
    setEditFolderOpen,
    setEditPageOpen,
    setError,
    deleteTarget,
    setDeleteTarget,
    setDeleteConfirmOpen,
    setIsDeleting,
    departmentItems,
    pageDepartments,
    pagePlacements,
    clearSelectedItems,
    replaceSelectedItems,
}: UseDirectoryHandlersParams) => {
    const router = useRouter();
    const appendUrlParams = useAppendUrlParams();
    const { invalidateEntriesAndFrames } = useInvalidateDirectory();
    const { updateDirectory } = useDirectoryCache();

    const handleCreateFolder = useCallback(async (parentId: string | null) => {
        if (!selectedDepartmentId) return;
        const name = folderForm.name.trim();
        if (!name) return;

        const slug = folderForm.slug.trim() || slugify(name);

        const result = await createFolderAction({
            department_id: selectedDepartmentId,
            parent_id: parentId,
            name,
            slug,
            emoji: folderForm.emoji || null,
        });

        if (!result.success) {
            setError(result.error ?? "Failed to create folder");
            return;
        }

        setFolderForm(emptyForm);
        setCreateFolderParentId(null);
        setCreateFolderOpen(false);

        const newEntry = result.data;
        if (newEntry) {
            updateDirectory((current) => ({
                ...current,
                entries: [...current.entries, newEntry],
            }));
        } else {
            invalidateEntriesAndFrames();
        }
    }, [selectedDepartmentId, folderForm, setError, setFolderForm, setCreateFolderParentId, setCreateFolderOpen, updateDirectory, invalidateEntriesAndFrames]);

    const handleInlineFolderCreate = useCallback(async () => {
        if (!inlineFolderLocation) return;
        const name = inlineFolderForm.name.trim();
        if (!name) return;

        const [departmentId, parentId] = inlineFolderLocation.split(":");
        const resolvedParentId = parentId === "root" ? null : parentId;

        const slug = inlineFolderForm.slug.trim() || slugify(name);

        const result = await createFolderAction({
            department_id: departmentId,
            parent_id: resolvedParentId,
            name,
            slug,
            emoji: inlineFolderForm.emoji || null,
        });

        if (!result.success) {
            setError(result.error ?? "Failed to create folder");
            return;
        }

        setInlineFolderForm(emptyForm);
        setInlineFolderOpen(false);

        const newEntry = result.data;
        if (newEntry) {
            updateDirectory((current) => ({
                ...current,
                entries: [...current.entries, newEntry],
            }));

            pagePlacements.append({
                id: newEntry.id,
                label: newEntry.name,
                emoji: newEntry.emoji ?? undefined,
            });
        } else {
            invalidateEntriesAndFrames();
        }
    }, [inlineFolderLocation, inlineFolderForm, setError, setInlineFolderForm, setInlineFolderOpen, updateDirectory, invalidateEntriesAndFrames, pagePlacements]);

    const handleCreatePage = useCallback(async (placementIds: string[]) => {
        if (!selectedDepartmentId) return;

        const name = pageForm.name.trim();
        const iframeUrl = pageForm.iframeUrl.trim();

        if (!name || !iframeUrl) return;

        if (!placementIds.length) {
            setError("Please select at least one folder placement");
            return;
        }

        const slug = pageForm.slug.trim() || slugify(name);

        const selectedDeptIds = pageDepartments.items.map((item) => item.id);
        const departmentIds = selectedDeptIds.includes(selectedDepartmentId)
            ? selectedDeptIds
            : [selectedDepartmentId, ...selectedDeptIds];

        // Create frame via server action
        const frameResult = await createFrame({
            name,
            iframe_url: iframeUrl,
            description: pageForm.description.trim() || null,
            department_ids: departmentIds,
        });

        if (!frameResult.success || !frameResult.data) {
            setError(frameResult.error ?? "Failed to create page");
            return;
        }

        const frame = frameResult.data;

        // Resolve placement IDs - department roots use dept-root- prefix
        const resolvedPlacements = placementIds.map((placementId) => {
            if (placementId.startsWith("dept-root-")) {
                const deptId = placementId.replace("dept-root-", "");
                return { deptId, parentId: null as string | null };
            }
            const folder = allFoldersById.get(placementId);
            return {
                deptId: folder?.department_id ?? selectedDepartmentId,
                parentId: placementId as string | null,
            };
        });

        // Get folder IDs for slug checking (only non-root placements)
        const folderIds = placementIds.filter((id) => !id.startsWith("dept-root-"));

        // Check for slug conflicts in target folders
        const slugsResult = folderIds.length > 0 ? await getExistingSlugs(folderIds) : { success: true, data: [] };
        const slugsByParent = new Map<string | null, Set<string>>();
        if (slugsResult.success && slugsResult.data) {
            slugsResult.data.forEach((entry) => {
                const key = entry.parent_id ?? null;
                if (!slugsByParent.has(key)) {
                    slugsByParent.set(key, new Set());
                }
                slugsByParent.get(key)?.add(entry.slug);
            });
        }

        // Generate unique slugs for each placement
        const getUniqueSlug = (parentId: string | null, baseSlug: string): string => {
            const existingInFolder = slugsByParent.get(parentId) ?? new Set();
            if (!existingInFolder.has(baseSlug)) return baseSlug;
            let counter = 2;
            while (existingInFolder.has(`${baseSlug}-${counter}`)) {
                counter++;
            }
            return `${baseSlug}-${counter}`;
        };

        // Track slugs used for first placement (for navigation)
        let firstPlacementSlug = slug;
        let firstPlacementDeptId = selectedDepartmentId;

        const directoryEntries = resolvedPlacements.map((placement, index) => {
            const uniqueSlug = getUniqueSlug(placement.parentId, slug);
            // Track the first placement's slug for navigation
            if (index === 0) {
                firstPlacementSlug = uniqueSlug;
                firstPlacementDeptId = placement.deptId;
            }
            // Add the slug to the set so subsequent placements in the same folder get unique slugs
            if (!slugsByParent.has(placement.parentId)) {
                slugsByParent.set(placement.parentId, new Set());
            }
            slugsByParent.get(placement.parentId)?.add(uniqueSlug);
            return {
                department_id: placement.deptId,
                parent_id: placement.parentId,
                frame_id: frame.id,
                name,
                slug: uniqueSlug,
                emoji: pageForm.emoji || null,
                type: "frame" as const,
            };
        });

        const entriesResult = await createDirectoryEntries(directoryEntries);

        setPageForm(emptyForm);
        setCreatePageOpen(false);
        clearSelectedItems(pageDepartments);
        clearSelectedItems(pagePlacements);
        const newEntries = entriesResult.data;
        if (entriesResult.success && newEntries) {
            updateDirectory((current) => ({
                ...current,
                frames: [...current.frames, frame],
                entries: [...current.entries, ...newEntries],
            }));
        } else {
            updateDirectory((current) => ({
                ...current,
                frames: [...current.frames, frame],
            }));
            invalidateEntriesAndFrames();
        }

        const firstPlacement = resolvedPlacements[0];
        const parentFolder = firstPlacement.parentId ? allFoldersById.get(firstPlacement.parentId) : null;
        const targetPath = parentFolder
            ? buildPathSegments(allFoldersById, parentFolder).concat(firstPlacementSlug)
            : [firstPlacementSlug];
        const url = buildDepartmentUrl(firstPlacementDeptId, targetPath, departments, navigationPages);
        router.push(appendUrlParams(url));
    }, [selectedDepartmentId, pageForm, pageDepartments, departments, navigationPages, allFoldersById, setError, setPageForm, setCreatePageOpen, clearSelectedItems, updateDirectory, invalidateEntriesAndFrames, router, appendUrlParams]);

    const handleUpdateFolder = useCallback(async (entry: DirectoryEntry) => {
        if (!selectedDepartmentId) return;
        const name = folderForm.name.trim();
        if (!name) return;

        const slug = folderForm.slug.trim() || slugify(name);

        const result = await updateFolderAction(entry.id, {
            name,
            slug,
            emoji: folderForm.emoji || null,
        });

        if (!result.success) {
            setError(result.error ?? "Failed to update folder");
            return;
        }

        setFolderForm(emptyForm);
        setEditFolderOpen(false);
        updateDirectory((current) => ({
            ...current,
            entries: current.entries.map((item) => item.id === entry.id ? { ...item, name, slug, emoji: folderForm.emoji || null } : item),
        }));
    }, [selectedDepartmentId, folderForm, setError, setFolderForm, setEditFolderOpen, updateDirectory]);

    const handleUpdatePage = useCallback(async (frame: Frame, placementIds: string[]) => {
        if (!selectedDepartmentId) return;

        const name = pageForm.name.trim();
        const iframeUrl = pageForm.iframeUrl.trim();

        if (!name || !iframeUrl) return;

        const slug = pageForm.slug.trim() || slugify(name);

        // Update frame with new data
        await updateFrame(frame.id, {
            name,
            iframe_url: iframeUrl,
            description: pageForm.description.trim() || null,
            department_ids: pageDepartments.items.map((item) => item.id),
        });

        // Update ALL existing directory entries for this frame with new name/slug/emoji
        await updateDirectoryEntriesByFrameId(frame.id, {
            name,
            slug,
            emoji: pageForm.emoji || null,
        });

        // Query ALL existing placements for this frame (across all departments)
        const placementsResult = await getPagePlacements(frame.id);
        const allExistingPlacements = placementsResult.data ?? [];

        // Normalize placement IDs for comparison
        // dept-root-{id} format -> null parent_id with department_id
        // folder ID -> parent_id with that ID
        const normalizeToKey = (placementId: string): string => {
            if (placementId.startsWith("dept-root-")) {
                return `root:${placementId.replace("dept-root-", "")}`;
            }
            return `folder:${placementId}`;
        };

        const existingToKey = (placement: { id: string; parent_id: string | null; department_id: string }): string => {
            if (placement.parent_id === null) {
                return `root:${placement.department_id}`;
            }
            return `folder:${placement.parent_id}`;
        };

        const selectedSet = new Set(placementIds.map(normalizeToKey));
        const existingMap = new Map(allExistingPlacements.map((p) => [existingToKey(p), p]));
        const existingSet = new Set(existingMap.keys());

        const toRemove = allExistingPlacements.filter((placement) => !selectedSet.has(existingToKey(placement)));
        const toAddKeys = Array.from(selectedSet).filter((key) => !existingSet.has(key));
        const toAdd = placementIds.filter((id) => toAddKeys.includes(normalizeToKey(id)));

        if (toRemove.length) {
            const ids = toRemove.map((placement) => placement.id);
            await deleteDirectoryEntries(ids);
        }

        if (toAdd.length) {
            // Resolve placement IDs
            const resolvedToAdd = toAdd.map((placementId) => {
                if (placementId.startsWith("dept-root-")) {
                    const deptId = placementId.replace("dept-root-", "");
                    return { deptId, parentId: null as string | null };
                }
                const folder = allFoldersById.get(placementId);
                return {
                    deptId: folder?.department_id ?? selectedDepartmentId,
                    parentId: placementId as string | null,
                };
            });

            // Get folder IDs for slug checking (only non-root placements)
            const folderIds = toAdd.filter((id) => !id.startsWith("dept-root-"));

            // Check for slug conflicts in target folders
            const slugsResult = folderIds.length > 0 ? await getExistingSlugs(folderIds) : { success: true, data: [] };
            const slugsByParent = new Map<string | null, Set<string>>();
            if (slugsResult.success && slugsResult.data) {
                slugsResult.data.forEach((entry) => {
                    const key = entry.parent_id ?? null;
                    if (!slugsByParent.has(key)) {
                        slugsByParent.set(key, new Set());
                    }
                    slugsByParent.get(key)?.add(entry.slug);
                });
            }

            // Generate unique slugs for each placement
            const getUniqueSlug = (parentId: string | null, baseSlug: string): string => {
                const existingInFolder = slugsByParent.get(parentId) ?? new Set();
                if (!existingInFolder.has(baseSlug)) return baseSlug;
                let counter = 2;
                while (existingInFolder.has(`${baseSlug}-${counter}`)) {
                    counter++;
                }
                return `${baseSlug}-${counter}`;
            };

            const newEntries = resolvedToAdd.map((placement) => {
                const uniqueSlug = getUniqueSlug(placement.parentId, slug);
                // Add the slug to the set so subsequent placements in the same folder get unique slugs
                if (!slugsByParent.has(placement.parentId)) {
                    slugsByParent.set(placement.parentId, new Set());
                }
                slugsByParent.get(placement.parentId)?.add(uniqueSlug);
                return {
                    department_id: placement.deptId,
                    parent_id: placement.parentId,
                    frame_id: frame.id,
                    name,
                    slug: uniqueSlug,
                    emoji: pageForm.emoji || null,
                    type: "frame" as const,
                };
            });

            const createdEntries = await createDirectoryEntries(newEntries);
            const createdData = createdEntries.data;

            if (createdEntries.success && createdData) {
                updateDirectory((current) => ({
                    ...current,
                    entries: [...current.entries, ...createdData],
                }));
            }
        }

        setPageForm(emptyForm);
        setEditPageOpen(false);
        clearSelectedItems(pagePlacements);
        updateDirectory((current) => ({
            ...current,
            frames: current.frames.map((item) => item.id === frame.id
                ? {
                    ...item,
                    name,
                    iframe_url: iframeUrl,
                    description: pageForm.description.trim() || null,
                    department_ids: pageDepartments.items.map((item) => item.id),
                }
                : item),
            entries: current.entries
                .filter((item) => !toRemove.some((placement) => placement.id === item.id))
                .map((item) => item.frame_id === frame.id
                    ? { ...item, name, slug, emoji: pageForm.emoji || null }
                    : item),
        }));
    }, [selectedDepartmentId, pageForm, pageDepartments, allFoldersById, setPageForm, setEditPageOpen, clearSelectedItems, updateDirectory]);

    const handleDeleteFolder = useCallback((entry: DirectoryEntry) => {
        setDeleteTarget({ type: "folder", item: entry });
        setDeleteConfirmOpen(true);
    }, [setDeleteTarget, setDeleteConfirmOpen]);

    const handleDeletePage = useCallback((frame: Frame) => {
        setDeleteTarget({ type: "page", item: frame });
        setDeleteConfirmOpen(true);
    }, [setDeleteTarget, setDeleteConfirmOpen]);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);

        if (deleteTarget.type === "folder") {
            const entry = deleteTarget.item as DirectoryEntry;
            const result = await deleteEntryAction(entry.id);
            if (!result.success) {
                setError(result.error ?? "Failed to delete folder");
                setIsDeleting(false);
                return;
            }

            setDeleteConfirmOpen(false);
            setEditFolderOpen(false);
            setDeleteTarget(null);
            setIsDeleting(false);
            updateDirectory((current) => ({
                ...current,
                entries: current.entries.filter((item) => item.id !== entry.id),
            }));

            // Navigate back to parent or department root
            if (entry.parent_id) {
                const parent = entriesById.get(entry.parent_id);
                if (parent) {
                    const parentPath = pathById.get(parent.id) ?? [parent.slug];
                    const url = buildDepartmentUrl(entry.department_id, parentPath, departments, navigationPages);
                    router.push(appendUrlParams(url));
                } else {
                    const url = buildDepartmentUrl(entry.department_id, [], departments, navigationPages);
                    router.push(appendUrlParams(url));
                }
            } else {
                const url = buildDepartmentUrl(entry.department_id, [], departments, navigationPages);
                router.push(appendUrlParams(url));
            }
        } else {
            const frame = deleteTarget.item as Frame;
            const result = await deletePageAction(frame.id);
            if (!result.success) {
                setError(result.error ?? "Failed to delete page");
                setIsDeleting(false);
                return;
            }

            setDeleteConfirmOpen(false);
            setEditPageOpen(false);
            setDeleteTarget(null);
            setIsDeleting(false);
            updateDirectory((current) => ({
                ...current,
                frames: current.frames.filter((item) => item.id !== frame.id),
                entries: current.entries.filter((item) => item.frame_id !== frame.id),
            }));

            // Navigate back to parent folder or department root
            if (activeEntry?.parent_id) {
                const parent = entriesById.get(activeEntry.parent_id);
                if (parent) {
                    const parentPath = pathById.get(parent.id) ?? [parent.slug];
                    const url = buildDepartmentUrl(activeEntry.department_id, parentPath, departments, navigationPages);
                    router.push(appendUrlParams(url));
                } else {
                    const url = buildDepartmentUrl(activeEntry.department_id, [], departments, navigationPages);
                    router.push(appendUrlParams(url));
                }
            } else if (activeEntry) {
                const url = buildDepartmentUrl(activeEntry.department_id, [], departments, navigationPages);
                router.push(appendUrlParams(url));
            }
        }
    }, [deleteTarget, activeEntry, departments, navigationPages, entriesById, pathById, setError, setIsDeleting, setDeleteConfirmOpen, setEditFolderOpen, setEditPageOpen, setDeleteTarget, updateDirectory, router, appendUrlParams]);

    const handleFolderSelected = useCallback((key: string | number) => {
        if (key === "__create_new__") {
            pagePlacements.remove("__create_new__");
            setInlineFolderForm(emptyForm);
            setInlineFolderOpen(true);
        } else {
            const keyStr = key as string;
            let deptId: string | null = null;

            if (keyStr.startsWith("dept-root-")) {
                // Department root selected
                deptId = keyStr.replace("dept-root-", "");
            } else {
                // Folder selected
                const folder = allFoldersById.get(keyStr);
                if (folder) {
                    deptId = folder.department_id;
                }
            }

            if (deptId) {
                const alreadySelected = pageDepartments.items.some((item) => item.id === deptId);
                if (!alreadySelected) {
                    const dept = departments.find((d) => d.id === deptId);
                    pageDepartments.append({
                        id: deptId,
                        label: dept?.name ?? deptId,
                    });
                }
            }
        }
    }, [allFoldersById, pageDepartments, pagePlacements, departments, setInlineFolderForm, setInlineFolderOpen]);

    const handleNewFolderClick = useCallback(() => {
        setFolderForm(emptyForm);
        setCreateFolderParentId(activeParentId ?? null);
        setCreateFolderOpen(true);
    }, [activeParentId, setFolderForm, setCreateFolderParentId, setCreateFolderOpen]);

    const handleNewPageClick = useCallback(() => {
        setPageForm(emptyForm);
        if (activeParentId) {
            const folder = entriesById.get(activeParentId);
            const label = folder?.name ?? "Current folder";
            const emoji = folder?.emoji ?? undefined;
            replaceSelectedItems(pagePlacements, [{ id: activeParentId, label, emoji }]);
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
    }, [activeParentId, entriesById, departmentItems, pageDepartments, pagePlacements, replaceSelectedItems, setError, setPageForm, setCreatePageOpen]);

    const handleEditFolderClick = useCallback(() => {
        if (!activeEntry) return;
        setFolderForm({
            ...emptyForm,
            name: activeEntry.name,
            slug: activeEntry.slug,
            emoji: activeEntry.emoji ?? "",
        });
        setEditFolderOpen(true);
    }, [activeEntry, setFolderForm, setEditFolderOpen]);

    return {
        handleCreateFolder,
        handleInlineFolderCreate,
        handleCreatePage,
        handleUpdateFolder,
        handleUpdatePage,
        handleDeleteFolder,
        handleDeletePage,
        confirmDelete,
        handleFolderSelected,
        handleNewFolderClick,
        handleNewPageClick,
        handleEditFolderClick,
    };
};
