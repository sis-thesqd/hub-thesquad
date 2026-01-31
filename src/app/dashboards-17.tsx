"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderClosed, Plus } from "@untitledui/icons";
import { useListData } from "react-stately";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { DirectoryApp } from "@/components/app/directory-app";
import { DirectoryCommandMenu } from "@/components/app/directory-app/components/directory-command-menu";
import { CreateFolderModal, CreatePageModal, FullscreenIframeModal } from "@/components/app/directory-app/components/modals";
import { emptyForm, getRandomEmoji } from "@/components/app/directory-app/constants";
import type { FormState, ActiveEntryInfo } from "@/components/app/directory-app/types";
import type { Frame } from "@/utils/supabase/types";
import { getIconByName } from "@/utils/icon-map";
import { slugify } from "@/utils/slugify";
import { buildPathToRoot, createEntriesMap } from "@/utils/directory/build-path";
import { getDepartmentIdFromSlug, getDepartmentSlug, buildDepartmentUrl } from "@/utils/department-slugs";
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
    initialDepartmentSlug?: string;
    initialPath?: string[];
    showFavorites?: boolean;
}

export const Dashboard17 = ({ initialDepartmentSlug, initialPath, showFavorites = false }: Dashboard17Props) => {
    const router = useRouter();
    const urlParams = useUrlParams();
    const appendUrlParams = useAppendUrlParams();
    const { worker } = useAuth();

    // React Query for data fetching - data persists across navigation
    const { departments, navigationPages, entries, frames, divisionOrder, refetchAll, isLoading: isDirectoryLoading } = useDirectoryQueries();
    const { invalidateEntriesAndFrames } = useInvalidateDirectory();

    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);
    const [activeEntryInfo, setActiveEntryInfo] = useState<ActiveEntryInfo>(null);
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [fullscreenFrame, setFullscreenFrame] = useState<Frame | null>(null);
    const [fullscreenPathSegments, setFullscreenPathSegments] = useState<string[]>([]);

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
    // Track newly created folder to add to page placements
    const [pendingFolderForPlacement, setPendingFolderForPlacement] = useState<{ id: string; name: string; emoji?: string } | null>(null);

    // List data for page modal
    const homePageDepartments = useListData<SelectItemType>({ initialItems: [] });
    const homePagePlacements = useListData<SelectItemType>({ initialItems: [] });

    // Effect to add newly created folder to placements when folder modal closes
    useEffect(() => {
        if (!homeCreateFolderOpen && pendingFolderForPlacement) {
            // Clear existing placements and add the new folder
            const itemsToRemove = [...homePagePlacements.items];
            itemsToRemove.forEach((item) => homePagePlacements.remove(item.id));
            homePagePlacements.append({
                id: pendingFolderForPlacement.id,
                label: pendingFolderForPlacement.name,
                emoji: pendingFolderForPlacement.emoji,
            });
            setPendingFolderForPlacement(null);
        }
    }, [homeCreateFolderOpen, pendingFolderForPlacement, homePagePlacements]);

    const isHomePage = !initialDepartmentSlug && !showFavorites;
    const isFavoritesPage = showFavorites;

    // Track whether slug resolution has been attempted (to avoid rendering DirectoryApp too early)
    const isSlugResolved = !initialDepartmentSlug || (departments.length > 0 && navigationPages.length > 0);

    // Read modal action from URL params
    const modalParam = urlParams.get("modal");
    const fullscreenParam = urlParams.get("fullscreen");
    const initialModalAction = (modalParam === "folder" || modalParam === "page") ? modalParam : null;
    const firstName = worker?.preferred_given_name || worker?.given_name;
    const hasLoadedName = Boolean(firstName);

    // Resolve department slug to ID once departments and navigationPages are loaded
    useEffect(() => {
        if (!initialDepartmentSlug) {
            setSelectedDepartmentId("");
            return;
        }
        if (departments.length === 0 || navigationPages.length === 0) {
            // Data not loaded yet, wait
            return;
        }
        const departmentId = getDepartmentIdFromSlug(initialDepartmentSlug, departments, navigationPages);
        setSelectedDepartmentId(departmentId ?? "");
    }, [initialDepartmentSlug, departments, navigationPages]);

    // Auto-open fullscreen from URL param
    useEffect(() => {
        if (fullscreenParam === "true" && activeEntryInfo?.isPage && activeEntryInfo.frameId && !fullscreenOpen) {
            const frame = frames.find((f) => f.id === activeEntryInfo.frameId);
            if (frame) {
                setFullscreenFrame(frame);
                setFullscreenPathSegments(activeEntryInfo.pathSegments ?? []);
                setFullscreenOpen(true);
            }
        }
    }, [fullscreenParam, activeEntryInfo, frames, fullscreenOpen]);

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
                    const department = departments.find((dept) => slugify(dept.name) === page.slug);
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

    // Department items with icons for modals
    const homeDepartmentItems = useMemo(() => {
        return departments.map((dept) => {
            const deptSlug = slugify(dept.name);
            const navPage = navigationPages.find((page) => page.slug === deptSlug);
            const Icon = navPage ? getIconByName(navPage.icon, FolderClosed) : FolderClosed;

            return {
                id: dept.id,
                label: dept.name ?? dept.id,
                icon: Icon,
            };
        });
    }, [departments, navigationPages]);

    // Folder options for page modal - all folders across all departments + department roots
    const homeFolderOptions = useMemo(() => {
        // Department root options
        const departmentRoots = departments.map((dept) => {
            const deptSlug = slugify(dept.name);
            const navPage = navigationPages.find((page) => page.slug === deptSlug);
            const Icon = navPage ? getIconByName(navPage.icon, FolderClosed) : FolderClosed;
            return {
                id: `dept-root-${dept.id}`,
                label: `${dept.name} (Root)`,
                supportingText: "Top level",
                icon: Icon,
            };
        });

        // Existing folder options
        const folders = entries.filter((e) => !e.frame_id);
        const folderOptions = folders.map((folder) => {
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
            ...departmentRoots,
            ...folderOptions,
        ];
    }, [entries, departments, navigationPages]);

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
            const placementId = homePagePlacements.items[0].id as string;
            let targetDepartmentId: string;
            let parentId: string | null = null;

            if (placementId.startsWith("dept-root-")) {
                // Department root selected - create at root of that department
                targetDepartmentId = placementId.replace("dept-root-", "");
                parentId = null;
            } else if (placementId === "root") {
                // Generic root - use user's department or first available
                targetDepartmentId = worker?.department_id || departments[0]?.id;
                if (!targetDepartmentId) return;
            } else {
                // Existing folder selected - get department from that folder
                const parentFolder = entries.find((e) => e.id === placementId);
                if (!parentFolder) return;
                targetDepartmentId = parentFolder.department_id;
                parentId = placementId;
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

            // Store newly created folder to add to page placements after modal closes
            if (result.data) {
                setPendingFolderForPlacement({
                    id: result.data.id,
                    name: result.data.name,
                    emoji: result.data.emoji ?? undefined,
                });
            }

            invalidateEntriesAndFrames();
            setHomeCreateFolderOpen(false);
        } catch (err) {
            console.error("Failed to create folder:", err);
        }
    }, [homeFolderForm, homePagePlacements.items, worker, departments, entries, invalidateEntriesAndFrames]);

    const handleHomeFolderSelected = useCallback((key: string | number) => {
        if (key === "__create_new__") {
            // Remove the "__create_new__" item from placements
            homePagePlacements.remove("__create_new__");
            // Open the create folder modal with a random emoji
            setHomeFolderForm({ ...emptyForm, emoji: getRandomEmoji() });
            setHomeFolderParentId(null);
            setHomeCreateFolderOpen(true);
        }
    }, [homePagePlacements]);

    const handleHomeCreatePage = useCallback(async () => {
        if (!homePageForm.name || !homePageForm.iframeUrl || homePageDepartments.items.length === 0 || homePagePlacements.items.length === 0) return;

        try {
            const departmentIds = homePageDepartments.items.map((item) => item.id as string);

            // Build placements array
            const placements = homePagePlacements.items.map((placement) => {
                const placementId = placement.id as string;
                let targetDepartmentId: string;
                let parentId: string | null = null;

                if (placementId.startsWith("dept-root-")) {
                    // Department root selected
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

    const handleFullscreen = useCallback(() => {
        if (activeEntryInfo?.isPage && activeEntryInfo.frameId) {
            const frame = frames.find((f) => f.id === activeEntryInfo.frameId);
            if (frame) {
                setFullscreenFrame(frame);
                setFullscreenPathSegments(activeEntryInfo.pathSegments ?? []);
                setFullscreenOpen(true);
                // Add fullscreen param to URL
                const newParams = new URLSearchParams(urlParams.toString());
                newParams.set("fullscreen", "true");
                const newUrl = `${window.location.pathname}?${newParams.toString()}`;
                router.replace(newUrl);
            }
        }
    }, [activeEntryInfo, frames, urlParams, router]);

    const handleFullscreenClose = useCallback((open: boolean) => {
        setFullscreenOpen(open);
        if (!open) {
            // Remove fullscreen param from URL
            const newParams = new URLSearchParams(urlParams.toString());
            newParams.delete("fullscreen");
            const newUrl = newParams.toString()
                ? `${window.location.pathname}?${newParams.toString()}`
                : window.location.pathname;
            router.replace(newUrl);
        }
    }, [urlParams, router]);

    const handleCommandMenuSelect = useCallback((type: "department" | "folder" | "page", id: string) => {
        const entriesById = createEntriesMap(entries);

        if (type === "department") {
            const slug = getDepartmentSlug(id, departments, navigationPages);
            router.push(appendUrlParams(`/${slug}`));
        } else if (type === "folder") {
            const folder = entriesById.get(id);
            if (folder) {
                const pathParts = buildPathToRoot(entriesById, folder);
                const url = buildDepartmentUrl(folder.department_id, pathParts, departments, navigationPages);
                router.push(appendUrlParams(url));
            }
        } else if (type === "page") {
            const entry = entries.find((e) => e.frame_id === id);
            if (entry) {
                const pathParts = buildPathToRoot(entriesById, entry);
                const url = buildDepartmentUrl(entry.department_id, pathParts, departments, navigationPages);
                router.push(appendUrlParams(url));
            }
        }
    }, [appendUrlParams, entries, departments, navigationPages, router]);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-primary lg:flex-row">
            <SidebarNavigationSlim
                hideBorder
                activeUrl={selectedDepartmentId ? `/${getDepartmentSlug(selectedDepartmentId, departments, navigationPages)}` : undefined}
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
                    while (homePagePlacements.items.length > 0) {
                        homePagePlacements.remove(homePagePlacements.items[0].id);
                    }

                    if (id?.startsWith("dept-root-")) {
                        // Department root selected - extract department ID
                        const deptId = id.replace("dept-root-", "");
                        const dept = departments.find((d) => d.id === deptId);
                        homePagePlacements.append({
                            id,
                            label: dept ? `${dept.name} (Root)` : "Root",
                        });
                    } else if (id) {
                        // Existing folder selected
                        const folder = entries.find((e) => e.id === id);
                        if (folder) {
                            homePagePlacements.append({ id, label: folder.name, emoji: folder.emoji ?? undefined });
                        }
                    } else {
                        // No selection (root fallback)
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
                onFolderSelected={handleHomeFolderSelected}
                onSubmit={handleHomeCreatePage}
            />

            <FullscreenIframeModal
                isOpen={fullscreenOpen}
                onOpenChange={handleFullscreenClose}
                frame={fullscreenFrame}
                pathSegments={fullscreenPathSegments}
            />

            <main className="min-w-0 flex-1 overflow-hidden lg:pt-2 lg:pl-1">
                <div className={`flex h-full flex-col overflow-hidden border-secondary lg:rounded-tl-[24px] lg:border-t lg:border-l ${isHomePage || isFavoritesPage ? "gap-8 pt-8 pb-12" : "gap-3 pt-4"}`}>
                    <div className="flex flex-col justify-between gap-4 px-4 lg:flex-row lg:items-center">
                        {isHomePage && hasLoadedName ? (
                            <p className="text-xl font-semibold text-primary lg:text-display-xs">
                                <AnimatedGroup staggerDelay={0.09} distance={4}>
                                    <span>Hello,</span>
                                    <span className="inline-block w-2" aria-hidden="true"></span>
                                    <span>{firstName}</span>
                                </AnimatedGroup>
                            </p>
                        ) : isFavoritesPage ? (
                            <p className="text-xl font-semibold text-primary lg:text-display-xs">Favorites</p>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex size-8 items-center justify-center rounded-md text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary"
                                    title="Go back"
                                >
                                    <ArrowLeft className="size-5" />
                                </button>
                                {activeEntryInfo && !activeEntryInfo.isPage && (
                                    <p className="flex items-center text-lg font-semibold text-primary">
                                        {activeEntryInfo.emoji && <span className="mr-2">{activeEntryInfo.emoji}</span>}
                                        {activeEntryInfo.icon && (() => {
                                            const Icon = getIconByName(activeEntryInfo.icon, FolderClosed);
                                            return <Icon className="mr-2 size-5 text-fg-quaternary" />;
                                        })()}
                                        {activeEntryInfo.name}
                                    </p>
                                )}
                                <div className="ml-auto">{headerContent}</div>
                            </>
                        )}
                        {!isFavoritesPage && isHomePage && departments.length > 0 && (
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

                    <div className={`min-h-0 flex-1 overflow-auto ${isHomePage || isFavoritesPage ? "px-4 lg:px-8" : ""}`}>
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
                                    departments={departments}
                                    navigationPages={navigationPages}
                                    userDepartmentId={worker?.department_id ?? null}
                                    favoriteEntryIds={favoriteEntryIds}
                                />
                            </>
                        ) : !isSlugResolved ? (
                            // Wait for slug resolution before rendering DirectoryApp
                            <p className="px-4 text-sm text-tertiary">Loading…</p>
                        ) : (
                            <DirectoryApp
                                initialDepartmentId={selectedDepartmentId}
                                initialPath={initialPath}
                                variant="embedded"
                                showDepartments={false}
                                departmentsOverride={departments}
                                entriesOverride={entries}
                                framesOverride={frames}
                                navigationPages={navigationPages}
                                onHeaderContentChange={setHeaderContent}
                                onActiveEntryChange={setActiveEntryInfo}
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
                                onFullscreen={handleFullscreen}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
