import { useCallback, useEffect, useState } from "react";
import { useListData } from "react-stately";
import type { SelectItemType } from "@/components/base/select/select";
import type { FormState } from "@/components/app/directory-app/types";
import type { DirectoryEntry, Department } from "@/utils/supabase/types";
import { emptyForm, getRandomEmoji } from "@/components/app/directory-app/constants";
import { createFolder, createPage } from "@/app/api/directory/actions";
import { useDirectoryCache, useInvalidateDirectory } from "@/hooks/use-directory-queries";

interface UseHomeModalsProps {
    entries: DirectoryEntry[];
    departments: Department[];
    userDepartmentId: string | undefined;
    modalDepartmentItems: SelectItemType[];
}

export const useHomeModals = ({
    entries,
    departments,
    userDepartmentId,
    modalDepartmentItems,
}: UseHomeModalsProps) => {
    const { updateDirectory } = useDirectoryCache();
    const { invalidateEntriesAndFrames } = useInvalidateDirectory();

    // Modal states
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [createPageOpen, setCreatePageOpen] = useState(false);
    const [folderForm, setFolderForm] = useState<FormState>(emptyForm);
    const [pageForm, setPageForm] = useState<FormState>(emptyForm);
    const [folderParentId, setFolderParentId] = useState<string | null>(null);
    const [pendingFolderForPlacement, setPendingFolderForPlacement] = useState<{ id: string; name: string; emoji?: string } | null>(null);

    // List data for modals
    const pageDepartments = useListData<SelectItemType>({ initialItems: [] });
    const pagePlacements = useListData<SelectItemType>({ initialItems: [] });

    // Effect to add newly created folder to placements when folder modal closes
    useEffect(() => {
        if (!createFolderOpen && pendingFolderForPlacement) {
            const itemsToRemove = [...pagePlacements.items];
            itemsToRemove.forEach((item) => pagePlacements.remove(item.id));
            pagePlacements.append({
                id: pendingFolderForPlacement.id,
                label: pendingFolderForPlacement.name,
                emoji: pendingFolderForPlacement.emoji,
            });
            setPendingFolderForPlacement(null);
        }
    }, [createFolderOpen, pendingFolderForPlacement, pagePlacements]);

    const handleNewFolder = useCallback(() => {
        setFolderForm({ ...emptyForm, emoji: getRandomEmoji() });
        setFolderParentId(null);
        setCreateFolderOpen(true);
    }, []);

    const handleNewPage = useCallback(() => {
        setPageForm({ ...emptyForm, emoji: getRandomEmoji() });
        // Clear selected items
        while (pageDepartments.items.length > 0) {
            pageDepartments.remove(pageDepartments.items[0].id);
        }
        while (pagePlacements.items.length > 0) {
            pagePlacements.remove(pagePlacements.items[0].id);
        }
        // Prefill with user's department if available
        if (userDepartmentId) {
            const userDept = modalDepartmentItems.find((d) => d.id === userDepartmentId);
            if (userDept) {
                pageDepartments.append({ id: userDept.id, label: userDept.label, icon: userDept.icon });
            }
        }
        setCreatePageOpen(true);
    }, [pageDepartments, pagePlacements, userDepartmentId, modalDepartmentItems]);

    const handleCreateFolder = useCallback(async () => {
        if (!folderForm.name || pagePlacements.items.length === 0) return;

        try {
            const placementId = pagePlacements.items[0].id as string;
            let targetDepartmentId: string;
            let parentId: string | null = null;

            if (placementId.startsWith("dept-root-")) {
                targetDepartmentId = placementId.replace("dept-root-", "");
                parentId = null;
            } else if (placementId === "root") {
                targetDepartmentId = userDepartmentId || departments[0]?.id;
                if (!targetDepartmentId) return;
            } else {
                const parentFolder = entries.find((e) => e.id === placementId);
                if (!parentFolder) return;
                targetDepartmentId = parentFolder.department_id;
                parentId = placementId;
            }

            const result = await createFolder({
                department_id: targetDepartmentId,
                parent_id: parentId,
                name: folderForm.name,
                slug: folderForm.slug,
                emoji: folderForm.emoji || null,
            });

            if (!result.success) {
                console.error("Failed to create folder:", result.error);
                return;
            }

            const newEntry = result.data;
            if (newEntry) {
                setPendingFolderForPlacement({
                    id: newEntry.id,
                    name: newEntry.name,
                    emoji: newEntry.emoji ?? undefined,
                });
                updateDirectory((current) => ({
                    ...current,
                    entries: [...current.entries, newEntry],
                }));
            } else {
                invalidateEntriesAndFrames();
            }

            setCreateFolderOpen(false);
        } catch (err) {
            console.error("Failed to create folder:", err);
        }
    }, [folderForm, pagePlacements.items, userDepartmentId, departments, entries, updateDirectory, invalidateEntriesAndFrames]);

    const handleFolderSelected = useCallback((key: string | number) => {
        if (key === "__create_new__") {
            pagePlacements.remove("__create_new__");
            setFolderForm({ ...emptyForm, emoji: getRandomEmoji() });
            setFolderParentId(null);
            setCreateFolderOpen(true);
        }
    }, [pagePlacements]);

    const handleCreatePage = useCallback(async () => {
        if (!pageForm.name || !pageForm.iframeUrl || pageDepartments.items.length === 0 || pagePlacements.items.length === 0) return;

        try {
            const departmentIds = pageDepartments.items.map((item) => item.id as string);

            const placements = pagePlacements.items.map((placement) => {
                const placementId = placement.id as string;
                let targetDepartmentId: string;
                let parentId: string | null = null;

                if (placementId.startsWith("dept-root-")) {
                    targetDepartmentId = placementId.replace("dept-root-", "");
                    parentId = null;
                } else if (placementId === "root") {
                    targetDepartmentId = departmentIds[0];
                } else {
                    const parentFolder = entries.find((e) => e.id === placementId);
                    if (!parentFolder) {
                        targetDepartmentId = departmentIds[0];
                    } else {
                        targetDepartmentId = parentFolder.department_id;
                        parentId = placementId;
                    }
                }

                return {
                    department_id: targetDepartmentId,
                    parent_id: parentId,
                    slug: pageForm.slug,
                    emoji: pageForm.emoji || null,
                };
            });

            const result = await createPage({
                name: pageForm.name,
                iframe_url: pageForm.iframeUrl,
                description: pageForm.description || null,
                department_ids: departmentIds,
                placements,
            });

            if (!result.success) {
                console.error("Failed to create page:", result.error);
                return;
            }

            if (result.frame) {
                updateDirectory((current) => ({
                    ...current,
                    frames: [...current.frames, result.frame!],
                    entries: result.entries ? [...current.entries, ...result.entries] : current.entries,
                }));
            } else {
                invalidateEntriesAndFrames();
            }

            setCreatePageOpen(false);
        } catch (err) {
            console.error("Failed to create page:", err);
        }
    }, [pageForm, pageDepartments.items, pagePlacements.items, entries, updateDirectory, invalidateEntriesAndFrames]);

    const handleFolderParentIdChange = useCallback((id: string | null) => {
        setFolderParentId(id);
        while (pagePlacements.items.length > 0) {
            pagePlacements.remove(pagePlacements.items[0].id);
        }

        if (id?.startsWith("dept-root-")) {
            const deptId = id.replace("dept-root-", "");
            const dept = departments.find((d) => d.id === deptId);
            pagePlacements.append({
                id,
                label: dept ? `${dept.name} (Root)` : "Root",
            });
        } else if (id) {
            const folder = entries.find((e) => e.id === id);
            if (folder) {
                pagePlacements.append({ id, label: folder.name, emoji: folder.emoji ?? undefined });
            }
        } else {
            pagePlacements.append({ id: "root", label: "Top level" });
        }
    }, [pagePlacements, departments, entries]);

    return {
        // Folder modal state
        createFolderOpen,
        setCreateFolderOpen,
        folderForm,
        setFolderForm,
        folderParentId,
        handleFolderParentIdChange,
        handleNewFolder,
        handleCreateFolder,
        // Page modal state
        createPageOpen,
        setCreatePageOpen,
        pageForm,
        setPageForm,
        pageDepartments,
        pagePlacements,
        handleNewPage,
        handleCreatePage,
        handleFolderSelected,
    };
};
