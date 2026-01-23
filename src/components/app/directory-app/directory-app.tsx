"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderClosed } from "@untitledui/icons";
import { useClipboard } from "@/hooks/use-clipboard";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { useAuth } from "@/providers/auth-provider";
import { useInvalidateDirectory } from "@/hooks/use-directory-queries";
import { getIconByName } from "@/utils/icon-map";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";
import {
    createFolder as createFolderAction,
    updateFolder as updateFolderAction,
    createFrame,
    updateFrame,
    createDirectoryEntries,
    updateDirectoryEntriesByFrameId,
    deleteDirectoryEntries,
    getPagePlacements,
    getExistingSlugs,
} from "@/app/api/directory/actions";

import type { DirectoryAppProps, FormState } from "./types";
import { emptyForm, getRandomEmoji } from "./constants";
import { slugify, buildPathSegments } from "./utils";
import { useDirectoryData, useListDataHelpers } from "./hooks";
import {
    FolderCard,
    PageCard,
    EmptyFolderState,
    NoDepartmentState,
    DirectoryHeader,
    EmbeddedHeaderContent,
    EmbeddedFolderHeader,
    IframeView,
    CreateFolderModal,
    EditFolderModal,
    CreatePageModal,
    EditPageModal,
    InlineFolderModal,
} from "./components";

export const DirectoryApp = ({
    initialDepartmentId,
    initialPath = [],
    variant = "full",
    showDepartments = true,
    departmentsOverride,
    entriesOverride,
    framesOverride,
    navigationPages = [],
    onHeaderContentChange,
    initialModalAction,
    onModalActionHandled,
    favoriteEntryIds = [],
    onToggleFavorite,
}: DirectoryAppProps) => {
    const router = useRouter();
    const appendUrlParams = useAppendUrlParams();
    const clipboard = useClipboard();
    const { worker } = useAuth();

    const {
        departments,
        entries,
        allFolders,
        selectedDepartmentId,
        isLoading,
        error,
        setError,
        frameById,
        filteredEntries,
        entriesById,
        childrenByParent,
        pathById,
        allFoldersById,
        allFolderPathById,
        activeEntry,
        activeFrame,
        activeParentId,
        visibleFolders,
        visiblePages,
        refreshData,
    } = useDirectoryData({
        initialDepartmentId,
        initialPath,
        departmentsOverride,
        entriesOverride,
        framesOverride,
    });

    const {
        pageDepartments,
        pagePlacements,
        clearSelectedItems,
        replaceSelectedItems,
    } = useListDataHelpers();

    const { invalidateEntriesAndFrames } = useInvalidateDirectory();

    // Use passed favorites props, with fallback for standalone usage
    const toggleFavorite = onToggleFavorite ?? (() => {});

    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [createPageOpen, setCreatePageOpen] = useState(false);
    const [editFolderOpen, setEditFolderOpen] = useState(false);
    const [editPageOpen, setEditPageOpen] = useState(false);
    const [inlineFolderOpen, setInlineFolderOpen] = useState(false);
    const [inlineFolderForm, setInlineFolderForm] = useState<FormState>(emptyForm);
    const [inlineFolderLocation, setInlineFolderLocation] = useState<string>("");

    const [folderForm, setFolderForm] = useState<FormState>(emptyForm);
    const [pageForm, setPageForm] = useState<FormState>(emptyForm);
    const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);

    // Handle initial modal action from parent (e.g., home page buttons)
    useEffect(() => {
        if (!initialModalAction || !selectedDepartmentId) return;

        if (initialModalAction === "folder") {
            setFolderForm({ ...emptyForm, emoji: getRandomEmoji() });
            setCreateFolderParentId(null);
            setCreateFolderOpen(true);
        } else if (initialModalAction === "page") {
            setPageForm({ ...emptyForm, emoji: getRandomEmoji() });
            clearSelectedItems(pagePlacements);
            // Prefill with user's department if available
            if (worker?.department_id) {
                const userDept = departments.find((d) => d.id === worker.department_id);
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
    }, [initialModalAction, selectedDepartmentId, clearSelectedItems, replaceSelectedItems, pagePlacements, pageDepartments, departments, navigationPages, worker?.department_id, onModalActionHandled]);

    const folderOptions = useMemo(() => {
        const options = allFolders.map((folder) => {
            const dept = departments.find((d) => d.id === folder.department_id);
            const path = allFolderPathById.get(folder.id)?.join("/") ?? folder.slug;
            return {
                id: folder.id,
                label: folder.name,
                supportingText: `${dept?.name ?? "Unknown"} / ${path}`,
                emoji: folder.emoji ?? undefined,
            };
        });

        return [
            { id: "__create_new__", label: "+ Create new folder" },
            ...options,
        ];
    }, [allFolders, allFolderPathById, departments]);

    // Map departments to items with icons from navigation pages
    const departmentItems = useMemo(() => {
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

    const parentOptions = useMemo(() => {
        return [
            { id: "root", label: "Top level" },
            ...filteredEntries
                .filter((entry) => !entry.frame_id)
                .map((entry) => ({
                    id: entry.id,
                    label: entry.name,
                    emoji: entry.emoji ?? undefined,
                })),
        ];
    }, [filteredEntries]);

    const inlineFolderLocationOptions = useMemo(() => {
        const options: { id: string; label: string; supportingText?: string }[] = [];

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

    // Provide header content to parent when variant is embedded
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
    }, [variant, onHeaderContentChange, activeFrame, activeEntry, departments, departmentItems, entries, selectedDepartmentId, entriesById, allFoldersById, favoriteEntryIds]);

    const handleCreateFolder = async (parentId: string | null) => {
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
        invalidateEntriesAndFrames();
    };

    const handleInlineFolderCreate = async () => {
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
        invalidateEntriesAndFrames();

        if (result.data) {
            pagePlacements.append({
                id: result.data.id,
                label: result.data.name,
                emoji: result.data.emoji ?? undefined,
            });
        }
    };

    const handleCreatePage = async (placementIds: string[]) => {
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

        // Check for slug conflicts in target folders
        const slugsResult = await getExistingSlugs(placementIds);
        const slugsByParent = new Map<string, Set<string>>();
        if (slugsResult.success && slugsResult.data) {
            slugsResult.data.forEach((entry) => {
                if (!slugsByParent.has(entry.parent_id)) {
                    slugsByParent.set(entry.parent_id, new Set());
                }
                slugsByParent.get(entry.parent_id)?.add(entry.slug);
            });
        }

        // Generate unique slugs for each placement
        const getUniqueSlug = (parentId: string, baseSlug: string): string => {
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

        const directoryEntries = placementIds.map((placementId, index) => {
            const folder = allFoldersById.get(placementId);
            const deptId = folder?.department_id ?? selectedDepartmentId;
            const uniqueSlug = getUniqueSlug(placementId, slug);
            // Track the first placement's slug for navigation
            if (index === 0) firstPlacementSlug = uniqueSlug;
            // Add the slug to the set so subsequent placements in the same folder get unique slugs
            if (!slugsByParent.has(placementId)) {
                slugsByParent.set(placementId, new Set());
            }
            slugsByParent.get(placementId)?.add(uniqueSlug);
            return {
                department_id: deptId,
                parent_id: placementId,
                frame_id: frame.id,
                name,
                slug: uniqueSlug,
                emoji: pageForm.emoji || null,
                type: "frame" as const,
            };
        });

        await createDirectoryEntries(directoryEntries);

        setPageForm(emptyForm);
        setCreatePageOpen(false);
        clearSelectedItems(pageDepartments);
        clearSelectedItems(pagePlacements);

        invalidateEntriesAndFrames();

        const firstPlacement = placementIds[0];
        const parentFolder = allFoldersById.get(firstPlacement);
        const targetDeptId = parentFolder?.department_id ?? selectedDepartmentId;
        const targetPath = parentFolder
            ? buildPathSegments(allFoldersById, parentFolder).concat(firstPlacementSlug)
            : [firstPlacementSlug];
        router.push(appendUrlParams(`/${targetDeptId}/${targetPath.join("/")}`));
    };

    const handleUpdateFolder = async (entry: DirectoryEntry) => {
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
        invalidateEntriesAndFrames();
    };

    const handleUpdatePage = async (frame: Frame, placementIds: string[]) => {
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

        const existingPlacements = allExistingPlacements
            .filter((placement): placement is { id: string; parent_id: string } => placement.parent_id !== null);

        const selectedSet = new Set(placementIds);
        const existingSet = new Set(existingPlacements.map((placement) => placement.parent_id));

        const toRemove = existingPlacements.filter((placement) => !selectedSet.has(placement.parent_id));
        const toAdd = Array.from(selectedSet).filter((id) => !existingSet.has(id));

        if (toRemove.length) {
            const ids = toRemove.map((placement) => placement.id);
            await deleteDirectoryEntries(ids);
        }

        if (toAdd.length) {
            // Check for slug conflicts in target folders
            const slugsResult = await getExistingSlugs(toAdd);
            const slugsByParent = new Map<string, Set<string>>();
            if (slugsResult.success && slugsResult.data) {
                slugsResult.data.forEach((entry) => {
                    if (!slugsByParent.has(entry.parent_id)) {
                        slugsByParent.set(entry.parent_id, new Set());
                    }
                    slugsByParent.get(entry.parent_id)?.add(entry.slug);
                });
            }

            // Generate unique slugs for each placement
            const getUniqueSlug = (parentId: string, baseSlug: string): string => {
                const existingInFolder = slugsByParent.get(parentId) ?? new Set();
                if (!existingInFolder.has(baseSlug)) return baseSlug;
                let counter = 2;
                while (existingInFolder.has(`${baseSlug}-${counter}`)) {
                    counter++;
                }
                return `${baseSlug}-${counter}`;
            };

            const newEntries = toAdd.map((placementId) => {
                const folder = allFoldersById.get(placementId);
                const deptId = folder?.department_id ?? selectedDepartmentId;
                const uniqueSlug = getUniqueSlug(placementId, slug);
                // Add the slug to the set so subsequent placements in the same folder get unique slugs
                if (!slugsByParent.has(placementId)) {
                    slugsByParent.set(placementId, new Set());
                }
                slugsByParent.get(placementId)?.add(uniqueSlug);
                return {
                    department_id: deptId,
                    parent_id: placementId,
                    frame_id: frame.id,
                    name,
                    slug: uniqueSlug,
                    emoji: pageForm.emoji || null,
                    type: "frame" as const,
                };
            });

            await createDirectoryEntries(newEntries);
        }

        setPageForm(emptyForm);
        setEditPageOpen(false);
        clearSelectedItems(pagePlacements);
        invalidateEntriesAndFrames();
    };

    const handleFolderSelected = useCallback((key: string | number) => {
        if (key === "__create_new__") {
            pagePlacements.remove("__create_new__");
            setInlineFolderForm(emptyForm);
            setInlineFolderLocation(`${selectedDepartmentId}:root`);
            setInlineFolderOpen(true);
        } else {
            const folder = allFoldersById.get(key as string);
            if (folder) {
                const deptId = folder.department_id;
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
    }, [selectedDepartmentId, allFoldersById, pageDepartments, pagePlacements, departments]);

    const handleNewFolderClick = useCallback(() => {
        setFolderForm(emptyForm);
        setCreateFolderParentId(activeParentId ?? null);
        setCreateFolderOpen(true);
    }, [activeParentId]);

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
    }, [activeParentId, entriesById, departmentItems, pageDepartments, pagePlacements, replaceSelectedItems, setError]);

    const handleEditFolderClick = useCallback(() => {
        if (!activeEntry) return;
        setFolderForm({
            ...emptyForm,
            name: activeEntry.name,
            slug: activeEntry.slug,
            emoji: activeEntry.emoji ?? "",
        });
        setEditFolderOpen(true);
    }, [activeEntry]);

    const outerClassName = variant === "full" ? "min-h-dvh bg-primary" : "w-full h-full";
    const mainClassName = variant === "full" ? "flex min-h-dvh flex-col" : "flex h-full min-h-0 flex-col";

    return (
        <div className={outerClassName}>
            <main className={mainClassName}>
                {/* Header with Actions - Only show in full mode and when NOT viewing embedded page */}
                {variant === "full" && !activeFrame && (
                    <DirectoryHeader
                        activeEntry={activeEntry}
                        onEditFolder={handleEditFolderClick}
                        onNewFolder={handleNewFolderClick}
                        onNewPage={handleNewPageClick}
                    />
                )}

                {/* Content */}
                <section className={`flex min-h-0 flex-1 flex-col overflow-hidden ${activeFrame ? "" : "px-4 pb-8 lg:px-8"}`}>
                    {error && (
                        <div className="mb-4 rounded-lg border border-error_subtle bg-error_primary/10 px-4 py-3 text-sm text-error_primary">
                            {error}
                        </div>
                    )}
                    {isLoading && <p className="text-sm text-tertiary">Loading…</p>}

                    {/* Embedded Page View */}
                    {!isLoading && activeFrame && (
                        <IframeView frame={activeFrame} />
                    )}

                    {/* Folder Grid View */}
                    {!isLoading && !activeFrame && (
                        <>
                            {/* Folders Section */}
                            {visibleFolders.length > 0 && (
                                <div className="mb-8">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {visibleFolders.map((child) => {
                                            const path = pathById.get(child.id) ?? [child.slug];
                                            const childCount = childrenByParent.get(child.id)?.length ?? 0;
                                            return (
                                                <FolderCard
                                                    key={child.id}
                                                    entry={child}
                                                    path={path}
                                                    childCount={childCount}
                                                    isFavorite={favoriteEntryIds.includes(child.id)}
                                                    onToggleFavorite={() => toggleFavorite(child.id)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Pages Section */}
                            {visiblePages.length > 0 && (
                                <div>
                                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-tertiary">
                                        Pages
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {visiblePages.map((child) => {
                                            const path = pathById.get(child.id) ?? [child.slug];
                                            const frame = child.frame_id ? frameById.get(child.frame_id) : null;
                                            return (
                                                <PageCard
                                                    key={child.id}
                                                    entry={child}
                                                    path={path}
                                                    frame={frame ?? null}
                                                    isFavorite={favoriteEntryIds.includes(child.id)}
                                                    onToggleFavorite={() => toggleFavorite(child.id)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {visibleFolders.length === 0 && visiblePages.length === 0 && selectedDepartmentId && (
                                <EmptyFolderState activeEntry={activeEntry} />
                            )}

                            {/* No department selected */}
                            {!selectedDepartmentId && (
                                <NoDepartmentState />
                            )}
                        </>
                    )}
                </section>
            </main>

            <CreateFolderModal
                isOpen={createFolderOpen}
                onOpenChange={setCreateFolderOpen}
                form={folderForm}
                onFormChange={setFolderForm}
                parentOptions={parentOptions}
                parentId={createFolderParentId}
                onParentIdChange={setCreateFolderParentId}
                onSubmit={() => handleCreateFolder(createFolderParentId ?? null)}
            />

            <CreatePageModal
                isOpen={createPageOpen}
                onOpenChange={setCreatePageOpen}
                form={pageForm}
                onFormChange={setPageForm}
                departmentItems={departmentItems}
                pageDepartments={pageDepartments}
                folderOptions={folderOptions}
                pagePlacements={pagePlacements}
                onFolderSelected={handleFolderSelected}
                onSubmit={() => handleCreatePage(pagePlacements.items.map((item) => item.id))}
            />

            <EditFolderModal
                isOpen={editFolderOpen}
                onOpenChange={setEditFolderOpen}
                form={folderForm}
                onFormChange={setFolderForm}
                onSubmit={() => activeEntry && handleUpdateFolder(activeEntry)}
            />

            <EditPageModal
                isOpen={editPageOpen}
                onOpenChange={setEditPageOpen}
                form={pageForm}
                onFormChange={setPageForm}
                departmentItems={departmentItems}
                pageDepartments={pageDepartments}
                folderOptions={folderOptions}
                pagePlacements={pagePlacements}
                onFolderSelected={handleFolderSelected}
                onSubmit={() => activeFrame && handleUpdatePage(activeFrame, pagePlacements.items.map((item) => item.id))}
            />

            <InlineFolderModal
                isOpen={inlineFolderOpen}
                onOpenChange={setInlineFolderOpen}
                form={inlineFolderForm}
                onFormChange={setInlineFolderForm}
                locationOptions={inlineFolderLocationOptions}
                location={inlineFolderLocation}
                onLocationChange={setInlineFolderLocation}
                onSubmit={handleInlineFolderCreate}
            />
        </div>
    );
};
