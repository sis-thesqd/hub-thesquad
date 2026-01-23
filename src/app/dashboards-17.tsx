"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { FolderClosed, Plus } from "@untitledui/icons";
import { useListData } from "react-stately";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { DirectoryApp } from "@/components/app/directory-app";
import { DirectoryCommandMenu } from "@/components/app/directory-app/components/directory-command-menu";
import { CreateFolderModal, CreatePageModal } from "@/components/app/directory-app/components/modals";
import { emptyForm, getRandomEmoji } from "@/components/app/directory-app/constants";
import type { FormState } from "@/components/app/directory-app/types";
import type { Frame } from "@/utils/supabase/types";
import { getIconByName } from "@/utils/icon-map";
import { createFolder, createPage } from "@/app/api/directory/actions";
import { useAuth } from "@/providers/auth-provider";
import { useAppendUrlParams, useUrlParams } from "@/hooks/use-url-params";
import { Button } from "@/components/base/buttons/button";
import type { SelectItemType } from "@/components/base/select/select";
import { HomeGrid } from "./components/home-grid";
import { RecentPages } from "./components/recent-pages";
import { FavoritesView } from "./components/favorites-view";
import { useFavorites } from "@/hooks/use-favorites";
import { useDirectoryQueries, useInvalidateDirectory } from "@/hooks/use-directory-queries";
import { AnimatedGroup } from "@/components/base/animated-group/animated-group";

interface Dashboard17Props {
    initialDepartmentId?: string;
    initialPath?: string[];
    showFavorites?: boolean;
}

export const Dashboard17 = ({ initialDepartmentId, initialPath, showFavorites = false }: Dashboard17Props) => {
    const router = useRouter();
    const urlParams = useUrlParams();
    const appendUrlParams = useAppendUrlParams();
    const { worker } = useAuth();

    // React Query for data fetching - data persists across navigation
    const { departments, navigationPages, entries, frames, refetchAll, isLoading: isDirectoryLoading } = useDirectoryQueries();
    const { invalidateEntriesAndFrames } = useInvalidateDirectory();

    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId ?? "");
    const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);

    // Favorites hook
    const {
        favorites,
        favoriteDepartmentIds,
        favoriteEntryIds,
        toggleFavorite,
        isLoading: isFavoritesLoading,
        hasLoaded: hasFavoritesLoaded,
    } = useFavorites({ userId: worker?.id });

    // Home page modal states
    const [homeCreateFolderOpen, setHomeCreateFolderOpen] = useState(false);
    const [homeCreatePageOpen, setHomeCreatePageOpen] = useState(false);
    const [homeFolderForm, setHomeFolderForm] = useState<FormState>(emptyForm);
    const [homePageForm, setHomePageForm] = useState<FormState>(emptyForm);
    const [homeFolderParentId, setHomeFolderParentId] = useState<string | null>(null);

    // List data for page modal
    const homePageDepartments = useListData<SelectItemType>({ initialItems: [] });
    const homePagePlacements = useListData<SelectItemType>({ initialItems: [] });

    const isHomePage = !initialDepartmentId && !showFavorites;
    const isFavoritesPage = showFavorites;

    // Read modal action from URL params
    const modalParam = urlParams.get("modal");
    const initialModalAction = (modalParam === "folder" || modalParam === "page") ? modalParam : null;
    const firstName = worker?.preferred_given_name || worker?.given_name;
    const hasLoadedName = Boolean(firstName);

    useEffect(() => {
        setSelectedDepartmentId(initialDepartmentId ?? "");
    }, [initialDepartmentId]);

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

    // Department items with icons for modals
    const homeDepartmentItems = useMemo(() => {
        return departments.map((dept) => {
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

    // Folder options for page modal - all folders across all departments
    const homeFolderOptions = useMemo(() => {
        const folders = entries.filter((e) => !e.frame_id);
        const options = folders.map((folder) => {
            const dept = departments.find((d) => d.id === folder.department_id);
            return {
                id: folder.id,
                label: folder.name,
                supportingText: dept?.name ?? "Unknown",
                emoji: folder.emoji ?? undefined,
            };
        });

        return [
            { id: "__create_new__", label: "+ Create new folder" },
            ...options,
        ];
    }, [entries, departments]);

    // Parent folder options for folder modal - need to select department first
    const homeParentOptions = useMemo(() => {
        // When creating from home, show root option plus all folders grouped by department
        return [
            { id: "root", label: "Top level (select department in folder placement)" },
        ];
    }, []);

    const handleHomePageNewFolder = useCallback(() => {
        // Open folder modal directly on home page with random emoji
        setHomeFolderForm({ ...emptyForm, emoji: getRandomEmoji() });
        setHomeFolderParentId(null);
        setHomeCreateFolderOpen(true);
    }, []);

    const handleHomePageNewPage = useCallback(() => {
        // Open page modal directly on home page with random emoji
        setHomePageForm({ ...emptyForm, emoji: getRandomEmoji() });
        // Clear selected items
        while (homePageDepartments.items.length > 0) {
            homePageDepartments.remove(homePageDepartments.items[0].id);
        }
        while (homePagePlacements.items.length > 0) {
            homePagePlacements.remove(homePagePlacements.items[0].id);
        }
        // Prefill with user's department if available
        if (worker?.department_id) {
            const userDept = homeDepartmentItems.find((d) => d.id === worker.department_id);
            if (userDept) {
                homePageDepartments.append({ id: userDept.id, label: userDept.label, icon: userDept.icon });
            }
        }
        setHomeCreatePageOpen(true);
    }, [homePageDepartments, homePagePlacements, worker?.department_id, homeDepartmentItems]);

    const handleHomeCreateFolder = useCallback(async () => {
        if (!homeFolderForm.name || homePagePlacements.items.length === 0) return;

        try {
            // Get the first selected folder placement to determine department
            const placementId = homePagePlacements.items[0].id;
            let targetDepartmentId: string;
            let parentId: string | null = null;

            if (placementId === "root") {
                // Need a department - use user's department or first available
                targetDepartmentId = worker?.department_id || departments[0]?.id;
                if (!targetDepartmentId) return;
            } else {
                // Get department from selected folder
                const parentFolder = entries.find((e) => e.id === placementId);
                if (!parentFolder) return;
                targetDepartmentId = parentFolder.department_id;
                parentId = placementId as string;
            }

            const result = await createFolder({
                department_id: targetDepartmentId,
                parent_id: parentId,
                name: homeFolderForm.name,
                slug: homeFolderForm.slug,
                emoji: homeFolderForm.emoji || null,
            });

            if (!result.success) {
                console.error("Failed to create folder:", result.error);
                return;
            }

            invalidateEntriesAndFrames();
            setHomeCreateFolderOpen(false);
        } catch (err) {
            console.error("Failed to create folder:", err);
        }
    }, [homeFolderForm, homePagePlacements.items, worker, departments, entries, invalidateEntriesAndFrames]);

    const handleHomeCreatePage = useCallback(async () => {
        if (!homePageForm.name || !homePageForm.iframeUrl || homePageDepartments.items.length === 0 || homePagePlacements.items.length === 0) return;

        try {
            const departmentIds = homePageDepartments.items.map((item) => item.id as string);

            // Build placements array
            const placements = homePagePlacements.items.map((placement) => {
                const placementId = placement.id as string;
                let targetDepartmentId: string;
                let parentId: string | null = null;

                if (placementId === "root") {
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
                    slug: homePageForm.slug,
                    emoji: homePageForm.emoji || null,
                };
            });

            const result = await createPage({
                name: homePageForm.name,
                iframe_url: homePageForm.iframeUrl,
                description: homePageForm.description || null,
                department_ids: departmentIds,
                placements,
            });

            if (!result.success) {
                console.error("Failed to create page:", result.error);
                return;
            }

            invalidateEntriesAndFrames();
            setHomeCreatePageOpen(false);
        } catch (err) {
            console.error("Failed to create page:", err);
        }
    }, [homePageForm, homePageDepartments.items, homePagePlacements.items, entries, invalidateEntriesAndFrames]);

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

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-primary lg:flex-row">
            <SidebarNavigationSlim
                hideBorder
                activeUrl={selectedDepartmentId ? `/${selectedDepartmentId}` : undefined}
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

            {/* Home page modals */}
            <CreateFolderModal
                isOpen={homeCreateFolderOpen}
                onOpenChange={setHomeCreateFolderOpen}
                form={homeFolderForm}
                onFormChange={setHomeFolderForm}
                parentOptions={homeFolderOptions}
                parentId={homeFolderParentId}
                onParentIdChange={(id) => {
                    setHomeFolderParentId(id);
                    // Also add to placements for the submit handler
                    if (id) {
                        const folder = entries.find((e) => e.id === id);
                        if (folder) {
                            while (homePagePlacements.items.length > 0) {
                                homePagePlacements.remove(homePagePlacements.items[0].id);
                            }
                            homePagePlacements.append({ id, label: folder.name, emoji: folder.emoji ?? undefined });
                        }
                    } else {
                        while (homePagePlacements.items.length > 0) {
                            homePagePlacements.remove(homePagePlacements.items[0].id);
                        }
                        homePagePlacements.append({ id: "root", label: "Top level" });
                    }
                }}
                onSubmit={handleHomeCreateFolder}
            />

            <CreatePageModal
                isOpen={homeCreatePageOpen}
                onOpenChange={setHomeCreatePageOpen}
                form={homePageForm}
                onFormChange={setHomePageForm}
                departmentItems={homeDepartmentItems}
                pageDepartments={homePageDepartments}
                folderOptions={homeFolderOptions}
                pagePlacements={homePagePlacements}
                onFolderSelected={() => {}}
                onSubmit={handleHomeCreatePage}
            />

            <main className="min-w-0 flex-1 overflow-hidden lg:pt-2 lg:pl-1">
                <div className="flex h-full flex-col gap-8 overflow-hidden border-secondary pt-8 pb-12 lg:rounded-tl-[24px] lg:border-t lg:border-l">
                    <div className="flex flex-col justify-between gap-4 px-4 lg:flex-row lg:items-center lg:px-8">
                        {headerContent || (
                            <p className="text-xl font-semibold text-primary lg:text-display-xs">
                                {isHomePage && hasLoadedName ? (
                                    <AnimatedGroup staggerDelay={0.08} distance={8}>
                                        <span>Hello, </span>
                                        <span>{firstName}</span>
                                    </AnimatedGroup>
                                ) : isFavoritesPage ? "Favorites" : ""}
                            </p>
                        )}
                        {isHomePage && departments.length > 0 && (
                            <div className="flex gap-2">
                                <Button color="secondary" size="sm" iconLeading={Plus} onClick={handleHomePageNewFolder}>
                                    New folder
                                </Button>
                                <Button color="primary" size="sm" iconLeading={Plus} onClick={handleHomePageNewPage}>
                                    New page
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto px-4 lg:px-8">
                        {isFavoritesPage ? (
                            <FavoritesView
                                favorites={favorites}
                                entries={entries}
                                frames={frames}
                                departments={departments}
                                navigationPages={navigationPages}
                                onToggleFavorite={(entryId, departmentId) => toggleFavorite(entryId, departmentId)}
                                isLoading={isFavoritesLoading || isDirectoryLoading}
                                hasLoaded={hasFavoritesLoaded}
                            />
                        ) : isHomePage ? (
                            <>
                                <HomeGrid
                                    departments={departments}
                                    navigationPages={navigationPages}
                                    entries={entries}
                                    userDepartmentId={worker?.department_id ?? null}
                                    favoriteDepartmentIds={favoriteDepartmentIds}
                                    onToggleFavorite={(deptId) => toggleFavorite(undefined, deptId)}
                                />
                                <RecentPages
                                    entries={entries}
                                    frames={frames}
                                    userDepartmentId={worker?.department_id ?? null}
                                    favoriteEntryIds={favoriteEntryIds}
                                />
                            </>
                        ) : (
                            <DirectoryApp
                                initialDepartmentId={selectedDepartmentId || initialDepartmentId}
                                initialPath={initialPath}
                                variant="embedded"
                                showDepartments={false}
                                departmentsOverride={departments}
                                entriesOverride={entries}
                                framesOverride={frames}
                                navigationPages={navigationPages}
                                onHeaderContentChange={setHeaderContent}
                                initialModalAction={initialModalAction}
                                onModalActionHandled={() => {
                                    // Remove modal param from URL
                                    const newParams = new URLSearchParams(urlParams.toString());
                                    newParams.delete("modal");
                                    const newUrl = newParams.toString()
                                        ? `${window.location.pathname}?${newParams.toString()}`
                                        : window.location.pathname;
                                    router.replace(newUrl);
                                }}
                                favoriteEntryIds={favoriteEntryIds}
                                onToggleFavorite={toggleFavorite}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
