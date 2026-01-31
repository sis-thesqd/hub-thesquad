"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderClosed } from "@untitledui/icons";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useDirectoryQueries, directoryKeys } from "@/hooks/use-directory-queries";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { DirectoryCommandMenu } from "@/components/app/directory-app/components/directory-command-menu";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { NativeSelect } from "@/components/base/select/select-native";
import type { NavigationPage } from "@/utils/supabase/types";
import { getIconByName } from "@/utils/icon-map";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { getDepartmentSlug, buildDepartmentUrl } from "@/utils/department-slugs";
import { updateNavigationPages, updateDivisionOrder } from "./actions";
import {
    SIDEBAR_DEFAULT_EXPANDED_KEY,
    SIDEBAR_COLLAPSED_KEY,
    FULLSCREEN_DEFAULT_KEY,
    SIS_DEPARTMENT_ID,
} from "./constants";
import { AppSettingsTab } from "./components/app-settings/app-settings-tab";
import { AdminTab } from "./components/admin/admin-tab";

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
    const [fullscreenDefault, setFullscreenDefault] = useState<boolean>(false);
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
        setSidebarDefaultExpanded(stored !== "false");
    }, []);

    // Load fullscreen default preference from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(FULLSCREEN_DEFAULT_KEY);
        setFullscreenDefault(stored === "true");
    }, []);

    const handleSidebarDefaultChange = useCallback((value: string) => {
        const expanded = value === "expanded";
        setSidebarDefaultExpanded(expanded);
        localStorage.setItem(SIDEBAR_DEFAULT_EXPANDED_KEY, String(expanded));
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!expanded));
        window.location.reload();
    }, []);

    const handleFullscreenDefaultChange = useCallback((value: string) => {
        const enabled = value === "on";
        setFullscreenDefault(enabled);
        localStorage.setItem(FULLSCREEN_DEFAULT_KEY, String(enabled));
    }, []);

    // Check if user is admin
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
                items.push({
                    label: division,
                    isHeading: true,
                });

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
        const pagesInDivision = editedPages.filter(p => p.division === division);
        setDivisionToDelete(division);

        if (pagesInDivision.length > 0) {
            const availableDivisions = editedDivisionOrder.filter(d => d !== division);
            setTargetDivision(availableDivisions[0] || "");
            setDeleteDivisionModalOpen(true);
        } else {
            setEditedDivisionOrder(prev => prev.filter(d => d !== division));
        }
    }, [editedPages, editedDivisionOrder]);

    const handleConfirmDeleteDivision = useCallback(() => {
        if (!divisionToDelete || !targetDivision) return;

        setEditedPages(prev => prev.map(page =>
            page.division === divisionToDelete ? { ...page, division: targetDivision } : page
        ));

        setEditedDivisionOrder(prev => prev.filter(d => d !== divisionToDelete));

        setDeleteDivisionModalOpen(false);
        setDivisionToDelete(null);
        setTargetDivision("");
    }, [divisionToDelete, targetDivision]);

    const handleCancelDeleteDivision = useCallback(() => {
        setDeleteDivisionModalOpen(false);
        setDivisionToDelete(null);
        setTargetDivision("");
    }, []);

    const handleDeleteDivisionModalOpenChange = useCallback((open: boolean) => {
        setDeleteDivisionModalOpen(open);
        if (!open) {
            setDivisionToDelete(null);
            setTargetDivision("");
        }
    }, []);

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
                            <AppSettingsTab
                                theme={theme}
                                setTheme={setTheme}
                                sidebarDefaultExpanded={sidebarDefaultExpanded}
                                onSidebarDefaultChange={handleSidebarDefaultChange}
                                fullscreenDefault={fullscreenDefault}
                                onFullscreenDefaultChange={handleFullscreenDefaultChange}
                                mounted={mounted}
                            />
                        )}

                        {selectedTab === "admin" && isAdmin && (
                            <AdminTab
                                editedPages={editedPages}
                                editedDivisionOrder={editedDivisionOrder}
                                departments={departments}
                                hasChanges={hasChanges}
                                hasDivisionOrderChanges={hasDivisionOrderChanges}
                                isSaving={isSaving}
                                navPagesLoading={navPagesLoading}
                                addDivisionModalOpen={addDivisionModalOpen}
                                deleteDivisionModalOpen={deleteDivisionModalOpen}
                                newDivision={newDivision}
                                divisionToDelete={divisionToDelete}
                                targetDivision={targetDivision}
                                onSave={handleSave}
                                onSaveDivisionOrder={handleSaveDivisionOrder}
                                onIconChange={handleIconChange}
                                onSlugChange={handleSlugChange}
                                onDivisionChange={handleDivisionChange}
                                onMoveDivision={handleMoveDivision}
                                onOpenDeleteDivision={handleOpenDeleteDivision}
                                onOpenAddDivisionModal={() => setAddDivisionModalOpen(true)}
                                onAddDivisionModalOpenChange={setAddDivisionModalOpen}
                                onDeleteDivisionModalOpenChange={handleDeleteDivisionModalOpenChange}
                                onNewDivisionChange={setNewDivision}
                                onTargetDivisionChange={setTargetDivision}
                                onAddDivision={handleAddDivision}
                                onConfirmDeleteDivision={handleConfirmDeleteDivision}
                                onCancelDeleteDivision={handleCancelDeleteDivision}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
