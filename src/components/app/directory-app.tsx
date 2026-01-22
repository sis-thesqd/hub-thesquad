"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit01, FileCode01, Folder, Home01, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { MultiSelect } from "@/components/base/select/multi-select";
import type { SelectItemType } from "@/components/base/select/select";
import { NativeSelect } from "@/components/base/select/select-native";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { DirectoryEntry, Frame, RipplingDepartment } from "@/utils/supabase/types";
import { supabaseFetch, supabaseUpsert } from "@/utils/supabase/rest";
import { cx } from "@/utils/cx";
import { useListData } from "react-stately";

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
}: DirectoryAppProps) => {
    const router = useRouter();
    const [departments, setDepartments] = useState<RipplingDepartment[]>(departmentsOverride ?? []);
    const [entries, setEntries] = useState<DirectoryEntry[]>([]);
    const [frames, setFrames] = useState<Frame[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId ?? "");
    const [pathSegments, setPathSegments] = useState(initialPath);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [createPageOpen, setCreatePageOpen] = useState(false);
    const [editFolderOpen, setEditFolderOpen] = useState(false);
    const [editPageOpen, setEditPageOpen] = useState(false);

    const [folderForm, setFolderForm] = useState<FormState>(emptyForm);
    const [pageForm, setPageForm] = useState<FormState>(emptyForm);
    const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);

    const pageDepartments = useListData<SelectItemType>({
        initialItems: [],
    });

    const pagePlacements = useListData<SelectItemType>({
        initialItems: [],
    });

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

    const refreshData = useCallback(
        async (departmentId: string) => {
            setIsLoading(true);
            setError(null);
            try {
                const [entriesData, framesData] = await Promise.all([loadEntries(departmentId), loadFrames()]);
                setEntries(entriesData);
                setFrames(framesData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        },
        [loadEntries, loadFrames],
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

    const activeEntry = useMemo(() => {
        if (!pathSegments?.length) return null;
        return findEntryByPath(childrenByParent, pathSegments);
    }, [childrenByParent, pathSegments]);

    const activeFrame = activeEntry?.frame_id ? frameById.get(activeEntry.frame_id) ?? null : null;

    const folderOptions = useMemo(() => {
        const options = filteredEntries
            .filter((entry) => !entry.frame_id)
            .map((entry) => ({
                id: entry.id,
                label: entry.name,
                supportingText: pathById.get(entry.id)?.join("/") ?? entry.slug,
            }));

        return [{ id: "root", label: "Top level" }, ...options];
    }, [filteredEntries, pathById]);

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

    const handleCreatePage = async (placementIds: string[]) => {
        if (!selectedDepartmentId) return;

        const name = pageForm.name.trim();
        const iframeUrl = pageForm.iframeUrl.trim();
        if (!name || !iframeUrl) return;

        const slug = pageForm.slug.trim() || slugify(name);

        const [frame] = await supabaseUpsert<Frame[]>("sh_frames", {
            name,
            iframe_url: iframeUrl,
            description: pageForm.description.trim() || null,
            department_ids: pageDepartments.items.map((item) => item.id),
        });

        const placements = placementIds.length ? placementIds : ["root"];

        await supabaseUpsert("sh_directory", placements.map((placementId) => ({
            department_id: selectedDepartmentId,
            parent_id: placementId === "root" ? null : placementId,
            frame_id: frame.id,
            name,
            slug,
        })));

        setPageForm(emptyForm);
        setCreatePageOpen(false);
        clearSelectedItems(pageDepartments);
        clearSelectedItems(pagePlacements);

        await refreshData(selectedDepartmentId);

        const parentEntry = placements[0] === "root" ? null : entriesById.get(placements[0] as string) ?? null;
        const targetPath = parentEntry ? buildPathSegments(entriesById, parentEntry).concat(slug) : [slug];
        router.push(`/${selectedDepartmentId}/${targetPath.join("/")}`);
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
            .map((entry) => ({ id: entry.id, parent_id: entry.parent_id ?? "root" }));

        const selectedSet = new Set(placementIds.length ? placementIds : ["root"]);
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
                toAdd.map((placementId) => ({
                    department_id: selectedDepartmentId,
                    parent_id: placementId === "root" ? null : placementId,
                    frame_id: frame.id,
                    name,
                    slug,
                })),
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

    const outerClassName = variant === "full" ? "min-h-dvh bg-primary" : "w-full";
    const mainClassName = variant === "full" ? "flex min-h-dvh flex-col" : "flex min-h-0 flex-col";

    return (
        <div className={outerClassName}>
            <main className={mainClassName}>
                {/* Header with Actions */}
                <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                    <div>
                        <h1 className="text-xl font-semibold text-primary">
                            {activeEntry?.name ?? "Directory"}
                        </h1>
                        <p className="mt-0.5 text-sm text-tertiary">
                            {activeEntry?.frame_id
                                ? "Embedded page"
                                : visibleFolders.length > 0 || visiblePages.length > 0
                                    ? `${visibleFolders.length} folders, ${visiblePages.length} pages`
                                    : "No items yet"}
                        </p>
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
                        {activeEntry?.frame_id && activeFrame && (
                            <Button
                                size="sm"
                                color="tertiary"
                                iconLeading={Edit01}
                                onClick={() => {
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
                                    const placements = entries
                                        .filter((entry) => entry.frame_id === activeFrame.id && entry.department_id === selectedDepartmentId)
                                        .map((entry) => entry.parent_id ?? "root");
                                    replaceSelectedItems(
                                        pagePlacements,
                                        placements.map((id) => ({
                                            id,
                                            label: id === "root" ? "Top level" : entriesById.get(id)?.name ?? id,
                                        })),
                                    );
                                    setEditPageOpen(true);
                                }}
                            >
                                Edit
                            </Button>
                        )}
                        {!activeFrame && (
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
                                            const label = entriesById.get(activeParentId)?.name ?? "Current folder";
                                            replaceSelectedItems(pagePlacements, [{ id: activeParentId, label }]);
                                        } else {
                                            replaceSelectedItems(pagePlacements, [{ id: "root", label: "Top level" }]);
                                        }
                                        setCreatePageOpen(true);
                                    }}
                                >
                                    New page
                                </Button>
                            </>
                        )}
                    </div>
                </header>

                {/* Content */}
                <section className="flex-1 px-6 pb-8">
                    {error && (
                        <div className="mb-4 rounded-lg border border-error_subtle bg-error_primary/10 px-4 py-3 text-sm text-error_primary">
                            {error}
                        </div>
                    )}
                    {isLoading && <p className="text-sm text-tertiary">Loading…</p>}

                    {/* Embedded Page View */}
                    {!isLoading && activeFrame && (
                        <div className="flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-2xl border border-secondary_alt bg-primary">
                            <div className="flex items-center justify-between border-b border-secondary_alt px-4 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-primary">{activeFrame.name}</p>
                                    {activeFrame.description && (
                                        <p className="text-xs text-tertiary">{activeFrame.description}</p>
                                    )}
                                </div>
                            </div>
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
                                                    const label = entriesById.get(activeParentId)?.name ?? "Current folder";
                                                    replaceSelectedItems(pagePlacements, [{ id: activeParentId, label }]);
                                                } else {
                                                    replaceSelectedItems(pagePlacements, [{ id: "root", label: "Top level" }]);
                                                }
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
                                    >
                                        {(item) => <MultiSelect.Item id={item.id}>{item.label}</MultiSelect.Item>}
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
                                    >
                                        {(item) => <MultiSelect.Item id={item.id}>{item.label}</MultiSelect.Item>}
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
        </div>
    );
};
