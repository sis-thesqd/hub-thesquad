"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor01, Moon01, Sun, Save01, FolderClosed, LayoutLeft, LayoutRight, ChevronUp, ChevronDown, X, Plus, AlertTriangle } from "@untitledui/icons";
import * as AllIcons from "@untitledui/icons";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useDirectoryQueries, directoryKeys } from "@/hooks/use-directory-queries";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { DirectoryCommandMenu } from "@/components/app/directory-app/components/directory-command-menu";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { NativeSelect } from "@/components/base/select/select-native";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import type { SelectItemType } from "@/components/base/select/select";
import * as RadioGroups from "@/components/base/radio-groups/radio-groups";
import type { NavigationPage } from "@/utils/supabase/types";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { cx } from "@/utils/cx";
import { getIconByName } from "@/utils/icon-map";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { getDepartmentSlug, buildDepartmentUrl } from "@/utils/department-slugs";
import { updateNavigationPages, updateDivisionOrder } from "./actions";

const SIDEBAR_DEFAULT_EXPANDED_KEY = "sidebar-default-expanded";
const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const themeItems = [
    {
        value: "system",
        title: "System",
        secondaryTitle: "",
        description: "Use your device's settings.",
        icon: Monitor01,
    },
    {
        value: "light",
        title: "Light",
        secondaryTitle: "",
        description: "Always light mode.",
        icon: Sun,
    },
    {
        value: "dark",
        title: "Dark",
        secondaryTitle: "",
        description: "Always dark mode.",
        icon: Moon01,
    },
];

const sidebarItems = [
    {
        value: "expanded",
        title: "Expanded",
        secondaryTitle: "",
        description: "Always show labels.",
        icon: LayoutLeft,
    },
    {
        value: "collapsed",
        title: "Collapsed",
        secondaryTitle: "",
        description: "Always show only icons.",
        icon: LayoutRight,
    },
];

// Get all icon names from @untitledui/icons (computed once at module level)
const ALL_ICON_NAMES = Object.keys(AllIcons).filter(
    key => typeof (AllIcons as Record<string, unknown>)[key] === 'function'
).sort();

// Pre-compute icon options at module level for performance
const ICON_OPTIONS: SelectItemType[] = ALL_ICON_NAMES.map(iconName => ({
    id: iconName,
    label: iconName,
}));

const SIS_DEPARTMENT_ID = process.env.NEXT_PUBLIC_SIS_DEPARTMENT_ID || "6932e7d2edd1d2e954e4264d"; // Systems Integration Squad

export const SettingsPage = () => {
    const router = useRouter();
    const appendUrlParams = useAppendUrlParams();
    const { theme, setTheme } = useTheme();
    const { worker } = useAuth();
    const { departments, navigationPages, entries, frames, divisionOrder } = useDirectoryQueries();
    const navPagesLoading = navigationPages.length === 0;
    const queryClient = useQueryClient();

    const [editedPages, setEditedPages] = useState<NavigationPage[]>([]);
    const [editedDivisionOrder, setEditedDivisionOrder] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [hasDivisionOrderChanges, setHasDivisionOrderChanges] = useState(false);
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<string>("app-settings");
    const [sidebarDefaultExpanded, setSidebarDefaultExpanded] = useState<boolean>(true);
    const [newDivision, setNewDivision] = useState("");
    const [addDivisionModalOpen, setAddDivisionModalOpen] = useState(false);
    const [deleteDivisionModalOpen, setDeleteDivisionModalOpen] = useState(false);
    const [divisionToDelete, setDivisionToDelete] = useState<string | null>(null);
    const [targetDivision, setTargetDivision] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    // Track mount state to avoid hydration mismatch with theme
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load sidebar default preference from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(SIDEBAR_DEFAULT_EXPANDED_KEY);
        // Default to expanded (true) if not set
        setSidebarDefaultExpanded(stored !== "false");
    }, []);

    const handleSidebarDefaultChange = useCallback((value: string) => {
        const expanded = value === "expanded";
        setSidebarDefaultExpanded(expanded);
        localStorage.setItem(SIDEBAR_DEFAULT_EXPANDED_KEY, String(expanded));
        // Also update the current collapsed state to match the new default
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!expanded));
        // Reload to apply the change immediately
        window.location.reload();
    }, []);

    // Check if user is admin (Systems Integration Squad or title contains "Systems")
    const isAdmin = worker?.department_id === SIS_DEPARTMENT_ID ||
                   (worker?.title?.toLowerCase().includes("systems") ?? false);

    // Build tabs based on admin status
    const tabs = useMemo(() => {
        const baseTabs = [{ id: "app-settings", label: "App Settings" }];
        if (isAdmin) {
            baseTabs.push({ id: "admin", label: "Admin" });
        }
        return baseTabs;
    }, [isAdmin]);

    // Build department items for sidebar
    const departmentItems = useMemo(() => {
        // Group pages by division (using page.division from config)
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
                // Add section heading
                items.push({
                    label: division,
                    isHeading: true,
                });

                // Add pages in this division
                pagesInDivision.forEach((page) => {
                    const department = departments.find((dept) => {
                        const deptSlug = dept.name
                            ?.toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)+/g, "");
                        return deptSlug === page.slug;
                    });
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

    // Handle command menu selection
    const handleCommandMenuSelect = useCallback((type: "department" | "folder" | "page", id: string) => {
        if (type === "department") {
            const slug = getDepartmentSlug(id, departments, navigationPages);
            router.push(appendUrlParams(`/${slug}`));
        } else if (type === "folder") {
            const folder = entries.find((e) => e.id === id);
            if (folder) {
                const pathParts: string[] = [folder.slug];
                let currentParentId = folder.parent_id;
                while (currentParentId) {
                    const parent = entries.find((e) => e.id === currentParentId);
                    if (parent) {
                        pathParts.unshift(parent.slug);
                        currentParentId = parent.parent_id;
                    } else {
                        break;
                    }
                }
                const url = buildDepartmentUrl(folder.department_id, pathParts, departments, navigationPages);
                router.push(appendUrlParams(url));
            }
        } else if (type === "page") {
            const frame = frames.find((f) => f.id === id);
            const entry = entries.find((e) => e.frame_id === id);
            if (frame && entry) {
                const pathParts: string[] = [entry.slug];
                let currentParentId = entry.parent_id;
                while (currentParentId) {
                    const parent = entries.find((e) => e.id === currentParentId);
                    if (parent) {
                        pathParts.unshift(parent.slug);
                        currentParentId = parent.parent_id;
                    } else {
                        break;
                    }
                }
                const url = buildDepartmentUrl(entry.department_id, pathParts, departments, navigationPages);
                router.push(appendUrlParams(url));
            }
        }
    }, [appendUrlParams, departments, navigationPages, entries, frames, router]);

    // Initialize edited pages when navigation pages load
    useEffect(() => {
        if (navigationPages.length > 0 && editedPages.length === 0) {
            setEditedPages([...navigationPages]);
        }
    }, [navigationPages, editedPages.length]);

    // Initialize edited division order
    useEffect(() => {
        if (divisionOrder.length > 0 && editedDivisionOrder.length === 0) {
            setEditedDivisionOrder([...divisionOrder]);
        }
    }, [divisionOrder, editedDivisionOrder.length]);

    // Track changes
    useEffect(() => {
        if (navigationPages.length === 0 || editedPages.length === 0) {
            setHasChanges(false);
            return;
        }
        const changed = JSON.stringify(navigationPages) !== JSON.stringify(editedPages);
        setHasChanges(changed);
    }, [navigationPages, editedPages]);

    // Track division order changes
    useEffect(() => {
        if (divisionOrder.length === 0 || editedDivisionOrder.length === 0) {
            setHasDivisionOrderChanges(false);
            return;
        }
        const changed = JSON.stringify(divisionOrder) !== JSON.stringify(editedDivisionOrder);
        setHasDivisionOrderChanges(changed);
    }, [divisionOrder, editedDivisionOrder]);

    const handleIconChange = useCallback((departmentId: string, newIcon: string) => {
        setEditedPages(prev => prev.map(page =>
            page.department_id === departmentId ? { ...page, icon: newIcon } : page
        ));
    }, []);

    const handleSlugChange = useCallback((departmentId: string, newSlug: string) => {
        setEditedPages(prev => prev.map(page =>
            page.department_id === departmentId ? { ...page, slug: newSlug } : page
        ));
    }, []);

    const handleDivisionChange = useCallback((departmentId: string, newDivision: string) => {
        setEditedPages(prev => prev.map(page =>
            page.department_id === departmentId ? { ...page, division: newDivision } : page
        ));
    }, []);

    const handleSave = useCallback(async () => {
        if (!hasChanges) return;

        setIsSaving(true);
        try {
            const result = await updateNavigationPages(editedPages);

            if (!result.success) {
                console.error("Failed to save navigation pages:", result.error);
                return;
            }

            // Invalidate the navigation pages query to refetch
            queryClient.invalidateQueries({ queryKey: directoryKeys.combined() });
            setHasChanges(false);
        } catch (err) {
            console.error("Failed to save navigation pages:", err);
        } finally {
            setIsSaving(false);
        }
    }, [editedPages, hasChanges, queryClient]);

    // Division order handlers
    const handleAddDivision = useCallback(() => {
        if (!newDivision.trim()) return;
        const trimmed = newDivision.trim().toUpperCase();
        if (editedDivisionOrder.includes(trimmed)) return;
        setEditedDivisionOrder(prev => [...prev, trimmed]);
        setNewDivision("");
        setAddDivisionModalOpen(false);
    }, [newDivision, editedDivisionOrder]);

    const handleOpenDeleteDivision = useCallback((division: string) => {
        // Check if any pages are in this division
        const pagesInDivision = editedPages.filter(p => p.division === division);
        setDivisionToDelete(division);

        if (pagesInDivision.length > 0) {
            // Set default target to first available division
            const availableDivisions = editedDivisionOrder.filter(d => d !== division);
            setTargetDivision(availableDivisions[0] || "");
            setDeleteDivisionModalOpen(true);
        } else {
            // No pages, remove directly
            setEditedDivisionOrder(prev => prev.filter(d => d !== division));
        }
    }, [editedPages, editedDivisionOrder]);

    const handleConfirmDeleteDivision = useCallback(() => {
        if (!divisionToDelete || !targetDivision) return;

        // Move pages to target division
        setEditedPages(prev => prev.map(page =>
            page.division === divisionToDelete ? { ...page, division: targetDivision } : page
        ));

        // Remove the division
        setEditedDivisionOrder(prev => prev.filter(d => d !== divisionToDelete));

        // Close modal and reset state
        setDeleteDivisionModalOpen(false);
        setDivisionToDelete(null);
        setTargetDivision("");
    }, [divisionToDelete, targetDivision]);

    const handleMoveDivision = useCallback((index: number, direction: "up" | "down") => {
        setEditedDivisionOrder(prev => {
            const newOrder = [...prev];
            const newIndex = direction === "up" ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= newOrder.length) return prev;
            [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
            return newOrder;
        });
    }, []);

    const handleSaveDivisionOrder = useCallback(async () => {
        if (!hasDivisionOrderChanges) return;

        setIsSaving(true);
        try {
            const result = await updateDivisionOrder(editedDivisionOrder);

            if (!result.success) {
                console.error("Failed to save division order:", result.error);
                return;
            }

            queryClient.invalidateQueries({ queryKey: directoryKeys.combined() });
            setHasDivisionOrderChanges(false);
        } catch (err) {
            console.error("Failed to save division order:", err);
        } finally {
            setIsSaving(false);
        }
    }, [editedDivisionOrder, hasDivisionOrderChanges, queryClient]);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-primary lg:flex-row">
            <SidebarNavigationSlim
                hideBorder
                items={departmentItems}
                onSearchClick={() => setCommandMenuOpen(true)}
            />

            <DirectoryCommandMenu
                isOpen={commandMenuOpen}
                onOpenChange={setCommandMenuOpen}
                departments={departments}
                entries={entries}
                frames={frames}
                navigationPages={navigationPages}
                onSelect={handleCommandMenuSelect}
            />

            <main className="min-w-0 flex-1 overflow-hidden lg:pt-2 lg:pl-1">
                <div className="flex h-full flex-col gap-8 overflow-auto border-secondary pt-8 pb-12 lg:rounded-tl-[24px] lg:border-t lg:border-l">
                    {/* Page Header */}
                    <div className="flex flex-col gap-5 px-4 lg:px-8">
                        <h1 className="text-xl font-semibold text-primary lg:text-display-xs">Settings</h1>

                        {/* Mobile tab select */}
                        <NativeSelect
                            aria-label="Settings tabs"
                            className="md:hidden"
                            value={selectedTab}
                            onChange={(event) => setSelectedTab(event.target.value)}
                            options={tabs.map((tab) => ({ label: tab.label, value: tab.id }))}
                        />

                        {/* Desktop tabs */}
                        <div className="-mx-4 -my-1 scrollbar-hide flex overflow-auto px-4 py-1 lg:-mx-8 lg:px-8">
                            <Tabs className="hidden w-full md:flex" selectedKey={selectedTab} onSelectionChange={(value) => setSelectedTab(value as string)}>
                                <TabList type="underline" className="w-full" items={tabs} />
                            </Tabs>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex flex-col gap-6 px-4 lg:px-8">
                        {selectedTab === "app-settings" && (
                            <>
                                {/* Appearance Section */}
                                <div>
                                    <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch pb-5">
                                        <h2 className="text-lg font-semibold text-primary">Appearance</h2>
                                        <p className="text-sm text-tertiary">
                                            Customize how Squad Hub looks on your device.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-8">
                                    {/* Theme Setting */}
                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium text-primary">Theme</p>
                                            <p className="text-sm text-tertiary">Select your preferred theme.</p>
                                        </div>

                                        {mounted ? (
                                            <RadioGroups.RadioButton
                                                aria-label="Theme"
                                                orientation="horizontal"
                                                value={theme}
                                                onChange={(value) => setTheme(value)}
                                                items={themeItems}
                                                className="flex-nowrap overflow-x-auto"
                                            />
                                        ) : (
                                            <div className="h-[88px]" />
                                        )}
                                    </div>

                                    {/* Sidebar Setting */}
                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium text-primary">Sidebar</p>
                                            <p className="text-sm text-tertiary">Choose the default sidebar state.</p>
                                        </div>

                                        {mounted ? (
                                            <RadioGroups.RadioButton
                                                aria-label="Sidebar default state"
                                                orientation="horizontal"
                                                value={sidebarDefaultExpanded ? "expanded" : "collapsed"}
                                                onChange={handleSidebarDefaultChange}
                                                items={sidebarItems}
                                                className="flex-nowrap overflow-x-auto"
                                            />
                                        ) : (
                                            <div className="h-[88px]" />
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedTab === "admin" && isAdmin && (
                            <>
                                {/* Division Order Section */}
                                <div>
                                    <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch pb-5">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-primary">Division Order</h2>
                                            {hasDivisionOrderChanges && (
                                                <Button
                                                    color="primary"
                                                    size="sm"
                                                    iconLeading={Save01}
                                                    onClick={handleSaveDivisionOrder}
                                                    isDisabled={isSaving}
                                                >
                                                    {isSaving ? "Saving..." : "Save Order"}
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-tertiary">
                                            Manage divisions and their display order in the navigation sidebar.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-5">
                                    {editedDivisionOrder.map((division, index) => {
                                        const pagesInDivision = editedPages.filter(p => p.division === division);
                                        return (
                                            <div
                                                key={division}
                                                className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                                        <span className="text-sm font-semibold text-fg-quaternary">{index + 1}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-medium text-primary">{division}</p>
                                                        <p className="text-xs text-tertiary">{pagesInDivision.length} page{pagesInDivision.length !== 1 ? "s" : ""}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveDivision(index, "up")}
                                                        disabled={index === 0}
                                                        className="rounded p-1.5 text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg-quaternary"
                                                        title="Move up"
                                                    >
                                                        <ChevronUp className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveDivision(index, "down")}
                                                        disabled={index === editedDivisionOrder.length - 1}
                                                        className="rounded p-1.5 text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg-quaternary"
                                                        title="Move down"
                                                    >
                                                        <ChevronDown className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDeleteDivision(division)}
                                                        className="rounded p-1.5 text-fg-quaternary transition hover:bg-error-secondary hover:text-error-primary"
                                                        title="Remove"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16">
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconLeading={Plus}
                                            onClick={() => setAddDivisionModalOpen(true)}
                                        >
                                            Add Division
                                        </Button>
                                    </div>
                                </div>

                                {/* Add Division Modal */}
                                <DialogTrigger isOpen={addDivisionModalOpen} onOpenChange={setAddDivisionModalOpen}>
                                    <Button id="add-division-modal-trigger" className="hidden" />
                                    <ModalOverlay>
                                        <Modal className="max-w-md">
                                            <Dialog className="w-full">
                                                <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                                                    <p className="text-lg font-semibold text-primary">Add Division</p>
                                                    <p className="mt-1 text-sm text-tertiary">Enter a name for the new division.</p>

                                                    <div className="mt-4">
                                                        <Input
                                                            label="Division Name"
                                                            aria-label="New division name"
                                                            size="sm"
                                                            placeholder="DIVISION_NAME"
                                                            value={newDivision}
                                                            onChange={setNewDivision}
                                                            onKeyDown={(e) => e.key === "Enter" && handleAddDivision()}
                                                        />
                                                    </div>

                                                    <div className="mt-6 flex gap-3">
                                                        <Button
                                                            color="secondary"
                                                            className="flex-1"
                                                            onClick={() => {
                                                                setAddDivisionModalOpen(false);
                                                                setNewDivision("");
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            color="primary"
                                                            className="flex-1"
                                                            onClick={handleAddDivision}
                                                            isDisabled={!newDivision.trim()}
                                                        >
                                                            Add Division
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Dialog>
                                        </Modal>
                                    </ModalOverlay>
                                </DialogTrigger>

                                {/* Delete Division Modal */}
                                <DialogTrigger isOpen={deleteDivisionModalOpen} onOpenChange={(open) => {
                                    setDeleteDivisionModalOpen(open);
                                    if (!open) {
                                        setDivisionToDelete(null);
                                        setTargetDivision("");
                                    }
                                }}>
                                    <Button id="delete-division-modal-trigger" className="hidden" />
                                    <ModalOverlay>
                                        <Modal className="max-w-md">
                                            <Dialog className="w-full">
                                                <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-warning_secondary">
                                                            <AlertTriangle className="size-6 text-fg-warning_primary" />
                                                        </div>
                                                        <p className="text-lg font-semibold text-primary">Delete &ldquo;{divisionToDelete}&rdquo;</p>
                                                        <p className="mt-2 text-sm text-tertiary">
                                                            This division has {editedPages.filter(p => p.division === divisionToDelete).length} page(s). Select a division to move them to.
                                                        </p>
                                                    </div>

                                                    <div className="mt-4">
                                                        <NativeSelect
                                                            label="Move pages to"
                                                            aria-label="Target division"
                                                            value={targetDivision}
                                                            onChange={(e) => setTargetDivision(e.target.value)}
                                                            options={editedDivisionOrder
                                                                .filter(d => d !== divisionToDelete)
                                                                .map(div => ({
                                                                    label: div.charAt(0) + div.slice(1).toLowerCase(),
                                                                    value: div,
                                                                }))}
                                                        />
                                                    </div>

                                                    <div className="mt-6 flex gap-3">
                                                        <Button
                                                            color="secondary"
                                                            className="flex-1"
                                                            onClick={() => {
                                                                setDeleteDivisionModalOpen(false);
                                                                setDivisionToDelete(null);
                                                                setTargetDivision("");
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            color="primary-destructive"
                                                            className="flex-1"
                                                            onClick={handleConfirmDeleteDivision}
                                                            isDisabled={!targetDivision}
                                                        >
                                                            Delete Division
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Dialog>
                                        </Modal>
                                    </ModalOverlay>
                                </DialogTrigger>

                                <hr className="border-secondary" />

                                {/* Navigation Pages Section */}
                                <div>
                                    <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch pb-5">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-primary">Department Pages</h2>
                                            {hasChanges && (
                                                <Button
                                                    color="primary"
                                                    size="sm"
                                                    iconLeading={Save01}
                                                    onClick={handleSave}
                                                    isDisabled={isSaving}
                                                >
                                                    {isSaving ? "Saving..." : "Save Changes"}
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-tertiary">
                                            Configure department icons and URL slugs for the navigation menu.
                                        </p>
                                    </div>
                                </div>

                                {navPagesLoading ? (
                                    <div className="flex h-32 items-center justify-center">
                                        <p className="text-sm text-tertiary">Loading...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-5">
                                        {editedPages.map((page) => {
                                            const department = departments.find(d => d.id === page.department_id);
                                            const Icon = getIconByName(page.icon, FolderClosed);

                                            return (
                                                <div
                                                    key={page.department_id}
                                                    className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                                            <Icon className="size-5 text-fg-quaternary" />
                                                        </div>
                                                        <p className="text-sm font-medium text-primary">
                                                            {department?.name || page.title}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap items-end gap-4">
                                                        <div className="w-44">
                                                            <NativeSelect
                                                                label="Division"
                                                                aria-label="Division"
                                                                value={page.division || "SQUAD"}
                                                                onChange={(e) => handleDivisionChange(page.department_id, e.target.value)}
                                                                options={editedDivisionOrder.map(div => ({
                                                                    label: div.charAt(0) + div.slice(1).toLowerCase(),
                                                                    value: div,
                                                                }))}
                                                            />
                                                        </div>

                                                        <div className="w-56">
                                                            <Select.ComboBox
                                                                label="Department Icon"
                                                                aria-label="Department Icon"
                                                                size="sm"
                                                                placeholder="Search icons..."
                                                                items={ICON_OPTIONS}
                                                                selectedKey={page.icon}
                                                                onSelectionChange={(key) => handleIconChange(page.department_id, key as string)}
                                                                shortcut={false}
                                                            >
                                                                {(item) => {
                                                                    const ItemIcon = getIconByName(item.id, FolderClosed);
                                                                    return (
                                                                        <Select.Item id={item.id} textValue={item.label}>
                                                                            <div className="flex items-center gap-2">
                                                                                <ItemIcon className="size-4 shrink-0 text-fg-quaternary" />
                                                                                <span className="truncate">{item.label}</span>
                                                                            </div>
                                                                        </Select.Item>
                                                                    );
                                                                }}
                                                            </Select.ComboBox>
                                                        </div>

                                                        <div className="w-56">
                                                            <Input
                                                                label="Slug"
                                                                aria-label="Slug"
                                                                size="sm"
                                                                placeholder="url-slug"
                                                                value={page.slug}
                                                                onChange={(value) => handleSlugChange(page.department_id, value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

