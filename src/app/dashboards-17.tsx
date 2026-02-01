"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import dynamic from "next/dynamic";
import { Lightbulb02 } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import type { ActiveEntryInfo } from "@/components/app/directory-app/types";
import { getDepartmentIdFromSlug, getDepartmentSlug } from "@/utils/department-slugs";
import { useAuth } from "@/providers/auth-provider";
import { useUrlParams } from "@/hooks/use-url-params";
import { useFavorites } from "@/hooks/use-favorites";
import { useDirectoryQueries } from "@/hooks/use-directory-queries";
import { useDepartmentItems, useFolderOptions } from "./dashboard-17/hooks/use-department-items";
import { useFullscreen } from "./dashboard-17/hooks/use-fullscreen";
import { useCommandMenuHandler } from "./dashboard-17/hooks/use-command-menu-handler";
import { useHomeModals } from "./dashboard-17/hooks/use-home-modals";
import { DashboardHeader } from "./dashboard-17/components/dashboard-header";
import { HomePageView } from "./dashboard-17/components/home-page-view";
import { FavoritesPageView } from "./dashboard-17/components/favorites-page-view";
import { DirectoryPageView } from "./dashboard-17/components/directory-page-view";
import { HomeModals } from "./dashboard-17/components/home-modals";

const DirectoryCommandMenu = dynamic(
    () => import("@/components/app/directory-app/components/directory-command-menu").then((mod) => mod.DirectoryCommandMenu),
    { ssr: false }
);

interface Dashboard17Props {
    initialDepartmentSlug?: string;
    initialPath?: string[];
    showFavorites?: boolean;
}

export const Dashboard17 = ({ initialDepartmentSlug, initialPath, showFavorites = false }: Dashboard17Props) => {
    const urlParams = useUrlParams();
    const { worker } = useAuth();

    // React Query for data fetching
    const { departments, navigationPages, entries, frames, divisionOrder, isLoading: isDirectoryLoading } = useDirectoryQueries();

    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);
    const [activeEntryInfo, setActiveEntryInfo] = useState<ActiveEntryInfo>(null);
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

    // Custom hooks
    const { sidebarItems, modalDepartmentItems } = useDepartmentItems(departments, navigationPages, divisionOrder);
    const folderOptions = useFolderOptions(entries, departments, navigationPages);
    const handleCommandMenuSelect = useCommandMenuHandler(entries, departments, navigationPages);

    const {
        fullscreenOpen,
        fullscreenFrame,
        fullscreenPathSegments,
        handleFullscreen,
        handleFullscreenClose,
    } = useFullscreen({ activeEntryInfo, frames });

    const homeModals = useHomeModals({
        entries,
        departments,
        userDepartmentId: worker?.department_id,
        modalDepartmentItems,
    });

    const isHomePage = !initialDepartmentSlug && !showFavorites;
    const isFavoritesPage = showFavorites;
    const isSlugResolved = !initialDepartmentSlug || (departments.length > 0 && navigationPages.length > 0);

    // Read modal action from URL params
    const modalParam = urlParams.get("modal");
    const initialModalAction = (modalParam === "folder" || modalParam === "page") ? modalParam : null;
    const firstName = worker?.preferred_given_name || worker?.given_name;
    const hasLoadedName = Boolean(firstName);

    // Resolve department slug to ID
    useEffect(() => {
        if (!initialDepartmentSlug) {
            setSelectedDepartmentId("");
            return;
        }
        if (departments.length === 0 || navigationPages.length === 0) {
            return;
        }
        const departmentId = getDepartmentIdFromSlug(initialDepartmentSlug, departments, navigationPages);
        setSelectedDepartmentId(departmentId ?? "");
    }, [initialDepartmentSlug, departments, navigationPages]);

    // Parent options for folder modal
    const parentOptions = useMemo(() => {
        return [{ id: "root", label: "Top level (select department in folder placement)" }];
    }, []);

    const footerItems = useMemo(() => ([
        {
            label: "Wiki",
            href: "/wiki",
            icon: Lightbulb02,
        },
    ]), []);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-primary lg:flex-row">
            <SidebarNavigationSlim
                hideBorder
                activeUrl={selectedDepartmentId ? `/${getDepartmentSlug(selectedDepartmentId, departments, navigationPages)}` : undefined}
                items={sidebarItems}
                footerItems={footerItems}
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

            <HomeModals
                createFolderOpen={homeModals.createFolderOpen}
                onCreateFolderOpenChange={homeModals.setCreateFolderOpen}
                folderForm={homeModals.folderForm}
                onFolderFormChange={homeModals.setFolderForm}
                folderOptions={folderOptions}
                folderParentId={homeModals.folderParentId}
                onFolderParentIdChange={homeModals.handleFolderParentIdChange}
                onFolderSubmit={homeModals.handleCreateFolder}
                createPageOpen={homeModals.createPageOpen}
                onCreatePageOpenChange={homeModals.setCreatePageOpen}
                pageForm={homeModals.pageForm}
                onPageFormChange={homeModals.setPageForm}
                departmentItems={modalDepartmentItems}
                pageDepartments={homeModals.pageDepartments}
                pagePlacements={homeModals.pagePlacements}
                onFolderSelected={homeModals.handleFolderSelected}
                onPageSubmit={homeModals.handleCreatePage}
                fullscreenOpen={fullscreenOpen}
                onFullscreenOpenChange={handleFullscreenClose}
                fullscreenFrame={fullscreenFrame}
                fullscreenPathSegments={fullscreenPathSegments}
            />

            <main className="min-w-0 flex-1 overflow-hidden lg:pt-2 lg:pl-1">
                <div className={`flex h-full flex-col overflow-hidden border-secondary lg:rounded-tl-[24px] lg:border-t lg:border-l ${isHomePage || isFavoritesPage ? "gap-8 pt-8 pb-12" : "gap-3 pt-4"}`}>
                    <DashboardHeader
                        isHomePage={isHomePage}
                        isFavoritesPage={isFavoritesPage}
                        firstName={firstName}
                        hasLoadedName={hasLoadedName}
                        activeEntryInfo={activeEntryInfo}
                        headerContent={headerContent}
                        hasDepartments={departments.length > 0}
                        onNewFolder={homeModals.handleNewFolder}
                        onNewPage={homeModals.handleNewPage}
                    />

                    <div className={`min-h-0 flex-1 overflow-auto ${isHomePage || isFavoritesPage ? "px-4 lg:px-8" : ""}`}>
                        {isFavoritesPage ? (
                            <FavoritesPageView
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
                            <HomePageView
                                departments={departments}
                                navigationPages={navigationPages}
                                entries={entries}
                                frames={frames}
                                userDepartmentId={worker?.department_id ?? null}
                                favoriteDepartmentIds={favoriteDepartmentIds}
                                favoriteEntryIds={favoriteEntryIds}
                                onToggleDepartmentFavorite={(deptId) => toggleFavorite(undefined, deptId)}
                            />
                        ) : !isSlugResolved ? (
                            <p className="px-4 text-sm text-tertiary">Loading…</p>
                        ) : (
                            <DirectoryPageView
                                selectedDepartmentId={selectedDepartmentId}
                                initialPath={initialPath}
                                departments={departments}
                                entries={entries}
                                frames={frames}
                                navigationPages={navigationPages}
                                initialModalAction={initialModalAction}
                                favoriteEntryIds={favoriteEntryIds}
                                onHeaderContentChange={setHeaderContent}
                                onActiveEntryChange={setActiveEntryInfo}
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
