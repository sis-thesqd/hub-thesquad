"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor01, Moon01, Sun, Save01, FolderClosed } from "@untitledui/icons";
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
import type { NavigationPage } from "@/utils/supabase/types";
import { cx } from "@/utils/cx";
import { getIconByName } from "@/utils/icon-map";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { updateNavigationPages } from "./actions";

// Get all icon names from @untitledui/icons (computed once at module level)
const ALL_ICON_NAMES = Object.keys(AllIcons).filter(
    key => typeof (AllIcons as Record<string, unknown>)[key] === 'function'
).sort();

// Pre-compute icon options at module level for performance
const ICON_OPTIONS: SelectItemType[] = ALL_ICON_NAMES.map(iconName => ({
    id: iconName,
    label: iconName,
}));

const SIS_DEPARTMENT_ID = "6932e7d2edd1d2e954e4264d"; // Systems Integration Squad

export const SettingsPage = () => {
    const router = useRouter();
    const appendUrlParams = useAppendUrlParams();
    const { theme, setTheme } = useTheme();
    const { worker } = useAuth();
    const { departments, navigationPages, entries, frames } = useDirectoryQueries();
    const navPagesLoading = navigationPages.length === 0;
    const queryClient = useQueryClient();

    const [editedPages, setEditedPages] = useState<NavigationPage[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<string>("app-settings");

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
        return navigationPages.map((page) => {
            const department = departments.find((dept) => {
                const deptSlug = dept.name
                    ?.toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
                return deptSlug === page.slug;
            });
            return {
                label: page.title,
                href: department ? `/${department.id}` : "#",
                icon: getIconByName(page.icon, FolderClosed),
            };
        }).filter((item) => item.href !== "#");
    }, [departments, navigationPages]);

    // Handle command menu selection
    const handleCommandMenuSelect = useCallback((type: "department" | "folder" | "page", id: string) => {
        if (type === "department") {
            router.push(appendUrlParams(`/${id}`));
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
                router.push(appendUrlParams(`/${folder.department_id}/${pathParts.join("/")}`));
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
                router.push(appendUrlParams(`/${entry.department_id}/${pathParts.join("/")}`));
            }
        }
    }, [appendUrlParams, entries, frames, router]);

    // Initialize edited pages when navigation pages load
    useEffect(() => {
        if (navigationPages.length > 0 && editedPages.length === 0) {
            setEditedPages([...navigationPages]);
        }
    }, [navigationPages, editedPages.length]);

    // Track changes
    useEffect(() => {
        if (navigationPages.length === 0 || editedPages.length === 0) {
            setHasChanges(false);
            return;
        }
        const changed = JSON.stringify(navigationPages) !== JSON.stringify(editedPages);
        setHasChanges(changed);
    }, [navigationPages, editedPages]);

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

                                <div className="flex flex-col gap-5">
                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_minmax(480px,512px)] lg:gap-16">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium text-primary">Theme</p>
                                            <p className="text-sm text-tertiary">Select your preferred theme.</p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <ThemeOption
                                                icon={Monitor01}
                                                label="System"
                                                isSelected={theme === "system"}
                                                onClick={() => setTheme("system")}
                                            />
                                            <ThemeOption
                                                icon={Sun}
                                                label="Light"
                                                isSelected={theme === "light"}
                                                onClick={() => setTheme("light")}
                                            />
                                            <ThemeOption
                                                icon={Moon01}
                                                label="Dark"
                                                isSelected={theme === "dark"}
                                                onClick={() => setTheme("dark")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedTab === "admin" && isAdmin && (
                            <>
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

interface ThemeOptionProps {
    icon: React.FC<{ className?: string }>;
    label: string;
    isSelected: boolean;
    onClick: () => void;
}

const ThemeOption = ({ icon: Icon, label, isSelected, onClick }: ThemeOptionProps) => {
    return (
        <button
            onClick={onClick}
            className={cx(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                isSelected
                    ? "bg-brand-secondary text-brand-secondary ring-2 ring-brand"
                    : "bg-secondary text-secondary hover:bg-secondary_hover"
            )}
        >
            <Icon className="size-5" />
            {label}
        </button>
    );
};
