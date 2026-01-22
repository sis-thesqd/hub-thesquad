"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy01, Edit01, FileCode01, Folder, Home01, Plus, Share01, ArrowUpRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select, type SelectItemType } from "@/components/base/select/select";
import { NativeSelect } from "@/components/base/select/select-native";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { DirectoryEntry, Frame, RipplingDepartment } from "@/utils/supabase/types";
import { supabaseFetch, supabaseUpsert } from "@/utils/supabase/rest";
import { cx } from "@/utils/cx";
import { useListData } from "react-stately";
import { useClipboard } from "@/hooks/use-clipboard";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

type DirectoryAppProps = {
    initialDepartmentId?: string;
    initialPath?: string[];
    variant?: "full" | "embedded";
    showDepartments?: boolean;
    departmentsOverride?: RipplingDepartment[];
    onHeaderContentChange?: (content: React.ReactNode | null) => void;
};

type FormState = {
    name: string;
    slug: string;
    iframeUrl: string;
    description: string;
};

const emptyForm: FormState = {
    name: "",
    slug: "",
    iframeUrl: "",
    description: "",
};

const buildPathSegments = (entriesById: Map<string, DirectoryEntry>, entry: DirectoryEntry) => {
    const segments: string[] = [entry.slug];
    let current = entry.parent_id ? entriesById.get(entry.parent_id) : null;

    while (current) {
        segments.unshift(current.slug);
        current = current.parent_id ? entriesById.get(current.parent_id) : null;
    }

    return segments;
};

const findEntryByPath = (childrenByParent: Map<string | null, DirectoryEntry[]>, segments: string[]) => {
    let parentId: string | null = null;
    let current: DirectoryEntry | undefined;

    for (const segment of segments) {
        const children: DirectoryEntry[] = childrenByParent.get(parentId) ?? [];
        current = children.find((child: DirectoryEntry) => child.slug === segment);
        if (!current) return null;
        parentId = current.id;
    }

    return current ?? null;
};

export const DirectoryApp = ({
    initialDepartmentId,
    initialPath = [],
    variant = "full",
    showDepartments = true,
    departmentsOverride,
    onHeaderContentChange,
}: DirectoryAppProps) => {
    const router = useRouter();
    const [departments, setDepartments] = useState<RipplingDepartment[]>(departmentsOverride ?? []);
    const [entries, setEntries] = useState<DirectoryEntry[]>([]);
    const [allFolders, setAllFolders] = useState<DirectoryEntry[]>([]); // All folders from all departments
    const [frames, setFrames] = useState<Frame[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId ?? "");
    const [pathSegments, setPathSegments] = useState(initialPath);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [createPageOpen, setCreatePageOpen] = useState(false);
    const [editFolderOpen, setEditFolderOpen] = useState(false);
    const [editPageOpen, setEditPageOpen] = useState(false);
    const [inlineFolderOpen, setInlineFolderOpen] = useState(false);
    const [inlineFolderForm, setInlineFolderForm] = useState<FormState>(emptyForm);
    const [inlineFolderLocation, setInlineFolderLocation] = useState<string>(""); // format: "departmentId:folderId" or "departmentId:root"

    const [folderForm, setFolderForm] = useState<FormState>(emptyForm);
    const [pageForm, setPageForm] = useState<FormState>(emptyForm);
    const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);

    const pageDepartments = useListData<SelectItemType>({
        initialItems: [],
    });

    const pagePlacements = useListData<SelectItemType>({
        initialItems: [],
    });

    const clipboard = useClipboard();

    const clearSelectedItems = (list: ReturnType<typeof useListData<SelectItemType>>) => {
        list.items.forEach((item) => list.remove(item.id));
    };

    const replaceSelectedItems = (list: ReturnType<typeof useListData<SelectItemType>>, items: { id: string; label?: string }[]) => {
        clearSelectedItems(list);
        items.forEach((item) => list.append(item));
    };

    useEffect(() => {
        setSelectedDepartmentId(initialDepartmentId ?? "");
    }, [initialDepartmentId]);

    // Serialize path to avoid infinite loop from array reference changes
    const initialPathKey = initialPath.join("/");
    useEffect(() => {
        setPathSegments(initialPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPathKey]);

    const loadDepartments = useCallback(async () => {
        const data = await supabaseFetch<RipplingDepartment[]>("rippling_departments?select=id,name&order=name.asc");
        return data;
    }, []);

    const loadFrames = useCallback(async () => {
        return await supabaseFetch<Frame[]>("sh_frames?select=id,name,iframe_url,description,department_ids&order=name.asc");
    }, []);

    const loadEntries = useCallback(async (departmentId: string) => {
        const filter = `department_id=eq.${encodeURIComponent(departmentId)}`;
        return await supabaseFetch<DirectoryEntry[]>(
            `sh_directory?select=id,department_id,parent_id,frame_id,name,slug,sort_order&${filter}&order=sort_order.asc.nullslast,name.asc`,
        );
    }, []);

    const loadAllFolders = useCallback(async () => {
        // Load all folders (entries without frame_id) from all departments
        return await supabaseFetch<DirectoryEntry[]>(
            `sh_directory?select=id,department_id,parent_id,frame_id,name,slug,sort_order&frame_id=is.null&order=name.asc`,
        );
    }, []);

    const refreshData = useCallback(
        async (departmentId: string) => {
            setIsLoading(true);
            setError(null);
            try {
                const [entriesData, framesData, allFoldersData] = await Promise.all([
                    loadEntries(departmentId),
                    loadFrames(),
                    loadAllFolders(),
                ]);
                setEntries(entriesData);
                setFrames(framesData);
                setAllFolders(allFoldersData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        },
        [loadEntries, loadFrames, loadAllFolders],
    );

    useEffect(() => {
        if (!departmentsOverride?.length) return;
        setDepartments(departmentsOverride);
    }, [departmentsOverride]);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            if (departmentsOverride?.length) {
                if (!initialDepartmentId) {
                    const first = departmentsOverride[0].id;
                    setSelectedDepartmentId(first);
                    router.replace(`/${first}`);
                }
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const deptData = await loadDepartments();
                if (!isMounted) return;
                setDepartments(deptData);

                if (!initialDepartmentId && deptData.length > 0) {
                    const first = deptData[0].id;
                    setSelectedDepartmentId(first);
                    router.replace(`/${first}`);
                }
            } catch (err) {
                if (!isMounted) return;
                setError(err instanceof Error ? err.message : "Failed to load departments");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void init();

        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [departmentsOverride, loadDepartments, router, initialDepartmentId]);

    useEffect(() => {
        if (!selectedDepartmentId) return;
        void refreshData(selectedDepartmentId);
    }, [refreshData, selectedDepartmentId]);

    const frameById = useMemo(() => new Map(frames.map((frame) => [frame.id, frame])), [frames]);

    const visibleFrameIds = useMemo(() => {
        const set = new Set<string>();
        frames.forEach((frame) => {
            if (!frame.department_ids?.length || frame.department_ids.includes(selectedDepartmentId)) {
                set.add(frame.id);
            }
        });
        return set;
    }, [frames, selectedDepartmentId]);

    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => !entry.frame_id || visibleFrameIds.has(entry.frame_id));
    }, [entries, visibleFrameIds]);

    const entriesById = useMemo(() => new Map(filteredEntries.map((entry) => [entry.id, entry])), [filteredEntries]);

    const childrenByParent = useMemo(() => {
        const map = new Map<string | null, DirectoryEntry[]>();
        filteredEntries.forEach((entry) => {
            const key = entry.parent_id ?? null;
            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(entry);
        });
        return map;
    }, [filteredEntries]);

    const pathById = useMemo(() => {
        const map = new Map<string, string[]>();
        filteredEntries.forEach((entry) => {
            map.set(entry.id, buildPathSegments(entriesById, entry));
        });
        return map;
    }, [entriesById, filteredEntries]);

    // Map of all folders by ID (across all departments)
    const allFoldersById = useMemo(() => new Map(allFolders.map((folder) => [folder.id, folder])), [allFolders]);

    // Build paths for all folders (not just current department)
    const allFolderPathById = useMemo(() => {
        const map = new Map<string, string[]>();
        allFolders.forEach((folder) => {
            map.set(folder.id, buildPathSegments(allFoldersById, folder));
        });
        return map;
    }, [allFolders, allFoldersById]);

    const activeEntry = useMemo(() => {
        if (!pathSegments?.length) return null;
        return findEntryByPath(childrenByParent, pathSegments);
    }, [childrenByParent, pathSegments]);

    const activeFrame = activeEntry?.frame_id ? frameById.get(activeEntry.frame_id) ?? null : null;

    // Provide header content to parent when variant is embedded
    useEffect(() => {
        if (variant === "embedded" && onHeaderContentChange) {
            if (activeFrame && activeEntry) {
                const handleEditClick = () => {
                    setPageForm({
                        name: activeFrame.name,
                        slug: activeEntry.slug,
                        iframeUrl: activeFrame.iframe_url,
                        description: activeFrame.description ?? "",
                    });
                    replaceSelectedItems(
                        pageDepartments,
                        activeFrame.department_ids.map((id) => ({
                            id,
                            label: departments.find((dept) => dept.id === id)?.name ?? id,
                        })),
                    );
                    // Only include placements that are in folders (not top level)
                    const placements = entries
                        .filter((entry) => entry.frame_id === activeFrame.id && entry.department_id === selectedDepartmentId && entry.parent_id !== null)
                        .map((entry) => entry.parent_id as string);
                    replaceSelectedItems(
                        pagePlacements,
                        placements.map((id) => ({
                            id,
                            label: entriesById.get(id)?.name ?? id,
                        })),
                    );
                    setEditPageOpen(true);
                };

                const handleOpenInNewTab = () => {
                    window.open(activeFrame.iframe_url, "_blank", "noopener,noreferrer");
                };

                const handleCopyUrl = async () => {
                    await clipboard.copy(activeFrame.iframe_url);
                };

                onHeaderContentChange(
                    <>
                        <h1 className="text-xl font-semibold text-primary lg:text-display-xs">
                            {activeEntry.name ?? "Directory"}
                        </h1>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                color="tertiary"
                                onClick={handleEditClick}
                            >
                                Edit
                            </Button>
                            <Dropdown.Root>
                                <Button
                                    size="sm"
                                    color="primary"
                                >
                                    Share
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu>
                                        <Dropdown.Item
                                            icon={ArrowUpRight}
                                            onAction={handleOpenInNewTab}
                                        >
                                            Open in new tab
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            icon={Copy01}
                                            onAction={handleCopyUrl}
                                        >
                                            Copy URL
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown.Root>
                        </div>
                    </>
                );
            } else {
                onHeaderContentChange(null);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variant, onHeaderContentChange, activeFrame, activeEntry, departments, entries, selectedDepartmentId, entriesById]);

    const folderOptions = useMemo(() => {
        // Use allFolders to show folders from ALL departments, not just the current one
        const options = allFolders.map((folder) => {
            const dept = departments.find((d) => d.id === folder.department_id);
            const path = allFolderPathById.get(folder.id)?.join("/") ?? folder.slug;
            return {
                id: folder.id,
                label: folder.name,
                supportingText: `${dept?.name ?? "Unknown"} / ${path}`,
            };
        });

        // Create new folder is always first, no "Top level" option
        return [
            { id: "__create_new__", label: "+ Create new folder" },
            ...options,
        ];
    }, [allFolders, allFolderPathById, departments]);

    const parentOptions = useMemo(() => {
        return [
            { label: "Top level", value: "root" },
            ...filteredEntries
                .filter((entry) => !entry.frame_id)
                .map((entry) => ({
                    label: entry.name,
                    value: entry.id,
                })),
        ];
    }, [filteredEntries]);

    // Combined department + folder options for inline folder creation
    const inlineFolderLocationOptions = useMemo(() => {
        const options: { id: string; label: string; supportingText?: string }[] = [];

        departments.forEach((dept) => {
            // Add department top level option
            options.push({
                id: `${dept.id}:root`,
                label: dept.name ?? dept.id,
                supportingText: "Top level",
            });

            // Add folders for this department from allFolders (not just current dept entries)
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

    const activeParentId = activeEntry?.frame_id ? activeEntry.parent_id : activeEntry?.id ?? null;

    const handleDepartmentSelect = (departmentId: string) => {
        setSelectedDepartmentId(departmentId);
        router.push(`/${departmentId}`);
    };

    const handleCreateFolder = async (parentId: string | null) => {
        if (!selectedDepartmentId) return;
        const name = folderForm.name.trim();
        if (!name) return;

        const slug = folderForm.slug.trim() || slugify(name);

        await supabaseUpsert("sh_directory", {
            department_id: selectedDepartmentId,
            parent_id: parentId,
            frame_id: null,
            name,
            slug,
        });

        setFolderForm(emptyForm);
        setCreateFolderParentId(null);
        setCreateFolderOpen(false);
        await refreshData(selectedDepartmentId);
    };

    const handleInlineFolderCreate = async () => {
        if (!inlineFolderLocation) return;
        const name = inlineFolderForm.name.trim();
        if (!name) return;

        // Parse the combined location value: "departmentId:folderId" or "departmentId:root"
        const [departmentId, parentId] = inlineFolderLocation.split(":");
        const resolvedParentId = parentId === "root" ? null : parentId;

        const slug = inlineFolderForm.slug.trim() || slugify(name);

        const [newFolder] = await supabaseUpsert<DirectoryEntry[]>("sh_directory", {
            department_id: departmentId,
            parent_id: resolvedParentId,
            frame_id: null,
            name,
            slug,
        });

        setInlineFolderForm(emptyForm);
        setInlineFolderOpen(false);
        await refreshData(selectedDepartmentId);

        // Add the new folder to the placements selection
        if (newFolder) {
            pagePlacements.append({
                id: newFolder.id,
                label: newFolder.name,
            });
        }
    };

    const handleCreatePage = async (placementIds: string[]) => {
        if (!selectedDepartmentId) return;

        const name = pageForm.name.trim();
        const iframeUrl = pageForm.iframeUrl.trim();
        if (!name || !iframeUrl) return;

        // Require at least one folder placement
        if (!placementIds.length) {
            setError("Please select at least one folder placement");
            return;
        }

        const slug = pageForm.slug.trim() || slugify(name);

        // Always include the current department in visibility
        const selectedDeptIds = pageDepartments.items.map((item) => item.id);
        const departmentIds = selectedDeptIds.includes(selectedDepartmentId)
            ? selectedDeptIds
            : [selectedDepartmentId, ...selectedDeptIds];

        const [frame] = await supabaseUpsert<Frame[]>("sh_frames", {
            name,
            iframe_url: iframeUrl,
            description: pageForm.description.trim() || null,
            department_ids: departmentIds,
        });

        const placements = placementIds;

        await supabaseUpsert("sh_directory", placements.map((placementId) => {
            // Look up folder to get its department
            const folder = allFoldersById.get(placementId);
            const deptId = folder?.department_id ?? selectedDepartmentId;
            return {
                department_id: deptId,
                parent_id: placementId,
                frame_id: frame.id,
                name,
                slug,
            };
        }));

        setPageForm(emptyForm);
        setCreatePageOpen(false);
        clearSelectedItems(pageDepartments);
        clearSelectedItems(pagePlacements);

        await refreshData(selectedDepartmentId);

        // Navigate to the first placement - could be in a different department
        const firstPlacement = placements[0];
        const parentFolder = allFoldersById.get(firstPlacement);
        const targetDeptId = parentFolder?.department_id ?? selectedDepartmentId;
        const targetPath = parentFolder
            ? buildPathSegments(allFoldersById, parentFolder).concat(slug)
            : [slug];
        router.push(`/${targetDeptId}/${targetPath.join("/")}`);
    };

    const handleUpdateFolder = async (entry: DirectoryEntry) => {
        if (!selectedDepartmentId) return;
        const name = folderForm.name.trim();
        if (!name) return;

        const slug = folderForm.slug.trim() || slugify(name);

        await supabaseFetch("sh_directory?id=eq." + entry.id, {
            method: "PATCH",
            body: { name, slug },
            prefer: "return=representation",
        });

        setFolderForm(emptyForm);
        setEditFolderOpen(false);
        await refreshData(selectedDepartmentId);
    };

    const handleUpdatePage = async (frame: Frame, placementIds: string[]) => {
        if (!selectedDepartmentId) return;

        const name = pageForm.name.trim();
        const iframeUrl = pageForm.iframeUrl.trim();
        if (!name || !iframeUrl) return;

        const slug = pageForm.slug.trim() || slugify(name);

        await supabaseFetch(`sh_frames?id=eq.${frame.id}`, {
            method: "PATCH",
            body: {
                name,
                iframe_url: iframeUrl,
                description: pageForm.description.trim() || null,
                department_ids: pageDepartments.items.map((item) => item.id),
            },
            prefer: "return=representation",
        });

        await supabaseFetch(`sh_directory?frame_id=eq.${frame.id}&department_id=eq.${selectedDepartmentId}`, {
            method: "PATCH",
            body: { name, slug },
            prefer: "return=representation",
        });

        const existingPlacements = entries
            .filter((entry) => entry.frame_id === frame.id && entry.department_id === selectedDepartmentId)
            .map((entry) => ({ id: entry.id, parent_id: entry.parent_id }))
            .filter((placement): placement is { id: string; parent_id: string } => placement.parent_id !== null);

        const selectedSet = new Set(placementIds);
        const existingSet = new Set(existingPlacements.map((placement) => placement.parent_id));

        const toRemove = existingPlacements.filter((placement) => !selectedSet.has(placement.parent_id));
        const toAdd = Array.from(selectedSet).filter((id) => !existingSet.has(id));

        if (toRemove.length) {
            const ids = toRemove.map((placement) => placement.id).join(",");
            await supabaseFetch(`sh_directory?id=in.(${ids})`, { method: "DELETE" });
        }

        if (toAdd.length) {
            
            await supabaseUpsert(
                "sh_directory",
                toAdd.map((placementId) => {
                    // Look up folder to get its department
                    const folder = allFoldersById.get(placementId);
                    const deptId = folder?.department_id ?? selectedDepartmentId;
                    return {
                        department_id: deptId,
                        parent_id: placementId,
                        frame_id: frame.id,
                        name,
                        slug,
                    };
                }),
            );
        }

        setPageForm(emptyForm);
        setEditPageOpen(false);
        clearSelectedItems(pagePlacements);
        await refreshData(selectedDepartmentId);
    };

    const activeChildren = useMemo(() => {
        if (!activeEntry) return childrenByParent.get(null) || [];
        if (activeEntry.frame_id) return [];
        return childrenByParent.get(activeEntry.id) || [];
    }, [activeEntry, childrenByParent]);

    const visibleFolders = useMemo(() => {
        return activeChildren.filter((entry) => !entry.frame_id);
    }, [activeChildren]);

    const visiblePages = useMemo(() => {
        return activeChildren.filter((entry) => entry.frame_id);
    }, [activeChildren]);

    const outerClassName = variant === "full" ? "min-h-dvh bg-primary" : "w-full h-full";
    const mainClassName = variant === "full" ? "flex min-h-dvh flex-col" : "flex h-full min-h-0 flex-col";

    return (
        <div className={outerClassName}>
            <main className={mainClassName}>
                {/* Header with Actions - Only show when NOT viewing embedded page */}
                {!activeFrame && (
                    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                        <div>
                            <h1 className="text-xl font-semibold text-primary">
                                {activeEntry?.name ?? "Directory"}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeEntry && !activeEntry.frame_id && (
                                <Button
                                    size="sm"
                                    color="tertiary"
                                    iconLeading={Edit01}
                                    onClick={() => {
                                        setFolderForm({
                                            ...emptyForm,
                                            name: activeEntry.name,
                                            slug: activeEntry.slug,
                                        });
                                        setEditFolderOpen(true);
                                    }}
                                >
                                    Edit
                                </Button>
                            )}
                            <>
                                <Button
                                    size="sm"
                                    color="secondary"
                                    iconLeading={Plus}
                                    onClick={() => {
                                        setFolderForm(emptyForm);
                                        setCreateFolderParentId(activeParentId ?? null);
                                        setCreateFolderOpen(true);
                                    }}
                                >
                                    New folder
                                </Button>
                                <Button
                                    size="sm"
                                    color="primary"
                                    iconLeading={Plus}
                                    onClick={() => {
                                        setPageForm(emptyForm);
                                        replaceSelectedItems(pageDepartments, []);
                                        if (activeParentId) {
                                            const folder = entriesById.get(activeParentId);
                                            const label = folder?.name ?? "Current folder";
                                            replaceSelectedItems(pagePlacements, [{ id: activeParentId, label }]);
                                        } else {
                                            // No default - user must select a folder
                                            replaceSelectedItems(pagePlacements, []);
                                        }
                                        setError(null);
                                        setCreatePageOpen(true);
                                    }}
                                >
                                    New page
                                </Button>
                            </>
                        </div>
                    </header>
                )}

                {/* Content */}
                <section className={`flex min-h-0 flex-1 flex-col overflow-hidden ${activeFrame ? "" : "px-6 pb-8"}`}>
                    {error && (
                        <div className="mb-4 rounded-lg border border-error_subtle bg-error_primary/10 px-4 py-3 text-sm text-error_primary">
                            {error}
                        </div>
                    )}
                    {isLoading && <p className="text-sm text-tertiary">Loading…</p>}

                    {/* Embedded Page View */}
                    {!isLoading && activeFrame && (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-secondary_alt bg-primary">
                            <iframe
                                title={activeFrame.name}
                                src={activeFrame.iframe_url}
                                className="h-full w-full border-0"
                                allow="clipboard-read; clipboard-write; fullscreen;"
                            />
                        </div>
                    )}

                    {/* Folder Grid View */}
                    {!isLoading && !activeFrame && (
                        <>
                            {/* Folders Section */}
                            {visibleFolders.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-tertiary">
                                        Folders
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {visibleFolders.map((child) => {
                                            const path = pathById.get(child.id) ?? [child.slug];
                                            const href = `/${child.department_id}/${path.join("/")}`;
                                            const childCount = childrenByParent.get(child.id)?.length ?? 0;
                                            return (
                                                <Link
                                                    key={child.id}
                                                    href={href}
                                                    className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                                                >
                                                    <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                                                        <Folder className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium text-primary">{child.name}</p>
                                                        <p className="mt-0.5 text-xs text-tertiary">
                                                            {childCount} {childCount === 1 ? "item" : "items"}
                                                        </p>
                                                    </div>
                                                </Link>
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
                                            const href = `/${child.department_id}/${path.join("/")}`;
                                            const frame = child.frame_id ? frameById.get(child.frame_id) : null;
                                            return (
                                                <Link
                                                    key={child.id}
                                                    href={href}
                                                    className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                                                >
                                                    <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                                                        <FileCode01 className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium text-primary">{child.name}</p>
                                                        {frame?.description && (
                                                            <p className="mt-0.5 truncate text-xs text-tertiary">
                                                                {frame.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {visibleFolders.length === 0 && visiblePages.length === 0 && selectedDepartmentId && (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary_alt bg-primary px-6 py-16 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                                        <Folder className="size-7 text-fg-quaternary" />
                                    </div>
                                    <h3 className="mt-4 text-base font-semibold text-primary">
                                        {activeEntry ? "This folder is empty" : "No items yet"}
                                    </h3>
                                    <p className="mt-1 max-w-sm text-sm text-tertiary">
                                        {activeEntry
                                            ? "Add folders or pages to organize content inside this folder."
                                            : "Create your first folder or page to get started."}
                                    </p>
                                    <div className="mt-6 flex items-center gap-3">
                                        <Button
                                            size="md"
                                            color="secondary"
                                            iconLeading={Plus}
                                            onClick={() => {
                                                setFolderForm(emptyForm);
                                                setCreateFolderParentId(activeParentId ?? null);
                                                setCreateFolderOpen(true);
                                            }}
                                        >
                                            New folder
                                        </Button>
                                        <Button
                                            size="md"
                                            color="primary"
                                            iconLeading={Plus}
                                            onClick={() => {
                                                setPageForm(emptyForm);
                                                replaceSelectedItems(pageDepartments, []);
                                                if (activeParentId) {
                                                    const folder = entriesById.get(activeParentId);
                                                    const label = folder?.name ?? "Current folder";
                                                    replaceSelectedItems(pagePlacements, [{ id: activeParentId, label }]);
                                                } else {
                                                    // No default - user must select a folder
                                                    replaceSelectedItems(pagePlacements, []);
                                                }
                                                setError(null);
                                                setCreatePageOpen(true);
                                            }}
                                        >
                                            New page
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* No department selected */}
                            {!selectedDepartmentId && (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary_alt bg-primary px-6 py-16 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                                        <Home01 className="size-7 text-fg-quaternary" />
                                    </div>
                                    <h3 className="mt-4 text-base font-semibold text-primary">Welcome to Directory</h3>
                                    <p className="mt-1 max-w-sm text-sm text-tertiary">
                                        Select a department to view and manage its folders and pages.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>

            <DialogTrigger isOpen={createFolderOpen} onOpenChange={setCreateFolderOpen}>
                <Button className="hidden" />
                <ModalOverlay>
                    <Modal className="max-w-xl">
                        <Dialog className="w-full">
                            <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                                <div className="mb-4">
                                    <p className="text-lg font-semibold text-primary">Create folder</p>
                                    <p className="text-sm text-tertiary">Organize pages for this department.</p>
                                </div>

                                <div className="grid gap-4">
                                    <Input
                                        label="Folder name"
                                        value={folderForm.name}
                                        onChange={(value) => setFolderForm((prev) => ({ ...prev, name: value }))}
                                        placeholder="e.g. Reporting"
                                    />
                                    <Input
                                        label="Slug"
                                        value={folderForm.slug}
                                        onChange={(value) => setFolderForm((prev) => ({ ...prev, slug: value }))}
                                        placeholder="auto-generated"
                                    />
                                    <NativeSelect
                                        label="Parent folder"
                                        value={createFolderParentId ?? "root"}
                                        options={parentOptions}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setCreateFolderParentId(value === "root" ? null : value);
                                        }}
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <Button color="secondary" onClick={() => setCreateFolderOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => handleCreateFolder(createFolderParentId ?? null)}>Create folder</Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>

            <DialogTrigger isOpen={createPageOpen} onOpenChange={setCreatePageOpen}>
                <Button className="hidden" />
                <ModalOverlay>
                    <Modal className="max-w-xl">
                        <Dialog className="w-full">
                            <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                                <div className="mb-4">
                                    <p className="text-lg font-semibold text-primary">Create page</p>
                                    <p className="text-sm text-tertiary">Embed an app or form URL.</p>
                                </div>
                                <div className="grid gap-4">
                                    <Input
                                        label="Page name"
                                        value={pageForm.name}
                                        onChange={(value) => setPageForm((prev) => ({ ...prev, name: value }))}
                                        placeholder="e.g. Intake form"
                                    />
                                    <Input
                                        label="Slug"
                                        value={pageForm.slug}
                                        onChange={(value) => setPageForm((prev) => ({ ...prev, slug: value }))}
                                        placeholder="auto-generated"
                                    />
                                    <Input
                                        label="Iframe URL"
                                        value={pageForm.iframeUrl}
                                        onChange={(value) => setPageForm((prev) => ({ ...prev, iframeUrl: value }))}
                                        placeholder="https://..."
                                    />
                                    <TextArea
                                        label="Description"
                                        value={pageForm.description}
                                        onChange={(value) => setPageForm((prev) => ({ ...prev, description: value }))}
                                        placeholder="Optional"
                                    />
                                    <MultiSelect
                                        label="Visible to departments"
                                        items={departments.map((department) => ({
                                            id: department.id,
                                            label: department.name ?? department.id,
                                        }))}
                                        selectedItems={pageDepartments}
                                        placeholder="Search departments"
                                    >
                                        {(item) => <MultiSelect.Item id={item.id}>{item.label}</MultiSelect.Item>}
                                    </MultiSelect>
                                    <MultiSelect
                                        label="Folder placements"
                                        items={folderOptions}
                                        selectedItems={pagePlacements}
                                        placeholder="Pick folders"
                                        onItemInserted={(key) => {
                                            if (key === "__create_new__") {
                                                pagePlacements.remove("__create_new__");
                                                setInlineFolderForm(emptyForm);
                                                setInlineFolderLocation(`${selectedDepartmentId}:root`);
                                                setInlineFolderOpen(true);
                                            } else {
                                                // Auto-add department visibility when folder from different department is selected
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
                                        }}
                                    >
                                        {(item) => (
                                            <MultiSelect.Item id={item.id} label={item.label} supportingText={item.supportingText} />
                                        )}
                                    </MultiSelect>
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <Button color="secondary" onClick={() => setCreatePageOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => handleCreatePage(pagePlacements.items.map((item) => item.id))}>Create page</Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>

            <DialogTrigger isOpen={editFolderOpen} onOpenChange={setEditFolderOpen}>
                <Button className="hidden" />
                <ModalOverlay>
                    <Modal className="max-w-xl">
                        <Dialog className="w-full">
                            <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                                <div className="mb-4">
                                    <p className="text-lg font-semibold text-primary">Edit folder</p>
                                </div>
                                <div className="grid gap-4">
                                    <Input
                                        label="Folder name"
                                        value={folderForm.name}
                                        onChange={(value) => setFolderForm((prev) => ({ ...prev, name: value }))}
                                    />
                                    <Input
                                        label="Slug"
                                        value={folderForm.slug}
                                        onChange={(value) => setFolderForm((prev) => ({ ...prev, slug: value }))}
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <Button color="secondary" onClick={() => setEditFolderOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => activeEntry && handleUpdateFolder(activeEntry)}>Save changes</Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>

            <DialogTrigger isOpen={editPageOpen} onOpenChange={setEditPageOpen}>
                <Button className="hidden" />
                <ModalOverlay>
                    <Modal className="max-w-xl">
                        <Dialog className="w-full">
                            <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                                <div className="mb-4">
                                    <p className="text-lg font-semibold text-primary">Edit page</p>
                                </div>
                                <div className="grid gap-4">
                                    <Input
                                        label="Page name"
                                        value={pageForm.name}
                                        onChange={(value) => setPageForm((prev) => ({ ...prev, name: value }))}
                                    />
                                    <Input
                                        label="Slug"
                                        value={pageForm.slug}
                                        onChange={(value) => setPageForm((prev) => ({ ...prev, slug: value }))}
                                    />
                                    <Input
                                        label="Iframe URL"
                                        value={pageForm.iframeUrl}
                                        onChange={(value) => setPageForm((prev) => ({ ...prev, iframeUrl: value }))}
                                    />
                                    <TextArea
                                        label="Description"
                                        value={pageForm.description}
                                        onChange={(value) => setPageForm((prev) => ({ ...prev, description: value }))}
                                    />
                                    <MultiSelect
                                        label="Visible to departments"
                                        items={departments.map((department) => ({
                                            id: department.id,
                                            label: department.name ?? department.id,
                                        }))}
                                        selectedItems={pageDepartments}
                                        placeholder="Search departments"
                                    >
                                        {(item) => <MultiSelect.Item id={item.id}>{item.label}</MultiSelect.Item>}
                                    </MultiSelect>
                                    <MultiSelect
                                        label="Folder placements"
                                        items={folderOptions}
                                        selectedItems={pagePlacements}
                                        placeholder="Pick folders"
                                        onItemInserted={(key) => {
                                            if (key === "__create_new__") {
                                                pagePlacements.remove("__create_new__");
                                                setInlineFolderForm(emptyForm);
                                                setInlineFolderLocation(`${selectedDepartmentId}:root`);
                                                setInlineFolderOpen(true);
                                            } else {
                                                // Auto-add department visibility when folder from different department is selected
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
                                        }}
                                    >
                                        {(item) => (
                                            <MultiSelect.Item id={item.id} label={item.label} supportingText={item.supportingText} />
                                        )}
                                    </MultiSelect>
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <Button color="secondary" onClick={() => setEditPageOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => activeFrame && handleUpdatePage(activeFrame, pagePlacements.items.map((item) => item.id))}>Save changes</Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>

            <DialogTrigger isOpen={inlineFolderOpen} onOpenChange={setInlineFolderOpen}>
                <Button className="hidden" />
                <ModalOverlay>
                    <Modal className="max-w-xl">
                        <Dialog className="w-full">
                            <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                                <div className="mb-4">
                                    <p className="text-lg font-semibold text-primary">Create folder</p>
                                    <p className="text-sm text-tertiary">Create a new folder for this page.</p>
                                </div>

                                <div className="grid gap-4">
                                    <Input
                                        label="Folder name"
                                        value={inlineFolderForm.name}
                                        onChange={(value) => setInlineFolderForm((prev) => ({ ...prev, name: value }))}
                                        placeholder="e.g. Reporting"
                                    />
                                    <Input
                                        label="Slug"
                                        value={inlineFolderForm.slug}
                                        onChange={(value) => setInlineFolderForm((prev) => ({ ...prev, slug: value }))}
                                        placeholder="auto-generated"
                                    />
                                    <Select.ComboBox
                                        label="Location"
                                        items={inlineFolderLocationOptions}
                                        selectedKey={inlineFolderLocation}
                                        onSelectionChange={(key) => setInlineFolderLocation(key as string)}
                                        placeholder="Search locations"
                                    >
                                        {(item) => (
                                            <Select.Item id={item.id} supportingText={item.supportingText}>
                                                {item.label}
                                            </Select.Item>
                                        )}
                                    </Select.ComboBox>
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <Button color="secondary" onClick={() => setInlineFolderOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => handleInlineFolderCreate()}>Create folder</Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>
        </div>
    );
};
