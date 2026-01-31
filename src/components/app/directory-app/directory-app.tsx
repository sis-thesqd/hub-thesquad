"use client";

import { useAuth } from "@/providers/auth-provider";

import type { DirectoryAppProps } from "./types";
import { emptyForm } from "./constants";
import {
    useDirectoryData,
    useListDataHelpers,
    useModalState,
    useDeleteConfirmation,
    useFolderOptions,
    useDepartmentItems,
    useParentOptions,
    useInlineFolderOptions,
    useInitialModalAction,
    useActiveEntryEffect,
    useHeaderContentEffect,
    useDirectoryHandlers,
} from "./hooks";
import {
    FolderCard,
    PageCard,
    EmptyFolderState,
    NoDepartmentState,
    DirectoryHeader,
    IframeView,
    ExternalPagesLink,
    CreateFolderModal,
    EditFolderModal,
    CreatePageModal,
    EditPageModal,
    InlineFolderModal,
    ConfirmDeleteModal,
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
    onActiveEntryChange,
    initialModalAction,
    onModalActionHandled,
    favoriteEntryIds = [],
    onToggleFavorite,
    onFullscreen,
}: DirectoryAppProps) => {
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
        hasExternalPages,
        isExternalPagesView,
        externalPageEntries,
        externalPathById,
        iframePathSegments,
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

    const {
        createFolderOpen,
        setCreateFolderOpen,
        createPageOpen,
        setCreatePageOpen,
        editFolderOpen,
        setEditFolderOpen,
        editPageOpen,
        setEditPageOpen,
        inlineFolderOpen,
        setInlineFolderOpen,
        inlineFolderForm,
        setInlineFolderForm,
        inlineFolderLocation,
        setInlineFolderLocation,
        folderForm,
        setFolderForm,
        pageForm,
        setPageForm,
        createFolderParentId,
        setCreateFolderParentId,
    } = useModalState();

    const {
        deleteConfirmOpen,
        setDeleteConfirmOpen,
        deleteTarget,
        setDeleteTarget,
        isDeleting,
        setIsDeleting,
    } = useDeleteConfirmation();

    // Use passed favorites props, with fallback for standalone usage
    const toggleFavorite = onToggleFavorite ?? (() => {});

    const folderOptions = useFolderOptions({
        allFolders,
        allFolderPathById,
        departments,
    });

    const departmentItems = useDepartmentItems({
        departments,
        navigationPages,
    });

    const parentOptions = useParentOptions({
        filteredEntries,
    });

    const inlineFolderLocationOptions = useInlineFolderOptions({
        departments,
        allFolders,
        allFolderPathById,
    });

    useInitialModalAction({
        initialModalAction,
        selectedDepartmentId,
        departments,
        navigationPages,
        workerDepartmentId: worker?.department_id,
        pagePlacements,
        pageDepartments,
        clearSelectedItems,
        replaceSelectedItems,
        setFolderForm,
        setPageForm,
        setCreateFolderParentId,
        setCreateFolderOpen,
        setCreatePageOpen,
        onModalActionHandled,
    });

    useHeaderContentEffect({
        variant,
        onHeaderContentChange,
        activeEntry,
        activeFrame,
        departments,
        departmentItems,
        entries,
        selectedDepartmentId,
        entriesById,
        allFoldersById,
        favoriteEntryIds,
        toggleFavorite,
        pageDepartments,
        pagePlacements,
        replaceSelectedItems,
        setPageForm,
        setFolderForm,
        setEditPageOpen,
        setEditFolderOpen,
        setCreateFolderOpen,
        setCreatePageOpen,
        setCreateFolderParentId,
        setError,
        emptyForm,
        iframePathSegments,
        onFullscreen,
    });

    useActiveEntryEffect({
        onActiveEntryChange,
        activeEntry,
        activeFrame,
        selectedDepartmentId,
        departments,
        navigationPages,
        isExternalPagesView,
        iframePathSegments,
    });

    const {
        handleCreateFolder,
        handleInlineFolderCreate,
        handleCreatePage,
        handleUpdateFolder,
        handleUpdatePage,
        handleDeleteFolder,
        handleDeletePage,
        confirmDelete,
        handleFolderSelected,
        handleNewFolderClick,
        handleNewPageClick,
        handleEditFolderClick,
    } = useDirectoryHandlers({
        selectedDepartmentId,
        activeEntry,
        activeFrame,
        activeParentId,
        departments,
        entriesById,
        allFoldersById,
        pathById,
        folderForm,
        setFolderForm,
        pageForm,
        setPageForm,
        inlineFolderForm,
        setInlineFolderForm,
        inlineFolderLocation,
        setInlineFolderOpen,
        createFolderParentId,
        setCreateFolderParentId,
        setCreateFolderOpen,
        setCreatePageOpen,
        setEditFolderOpen,
        setEditPageOpen,
        setError,
        deleteTarget,
        setDeleteTarget,
        setDeleteConfirmOpen,
        setIsDeleting,
        departmentItems,
        pageDepartments,
        pagePlacements,
        clearSelectedItems,
        replaceSelectedItems,
    });

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
                <section className={`flex min-h-0 flex-1 flex-col overflow-hidden ${activeFrame ? "" : "px-4 pb-8 lg:px-6"}`}>
                    {error && (
                        <div className="mb-4 rounded-lg border border-error_subtle bg-error_primary/10 px-4 py-3 text-sm text-error_primary">
                            {error}
                        </div>
                    )}
                    {isLoading && <p className="text-sm text-tertiary">Loading…</p>}

                    {/* Embedded Page View */}
                    {!isLoading && activeFrame && (
                        <IframeView frame={activeFrame} pathSegments={iframePathSegments} />
                    )}

                    {/* Folder Grid View */}
                    {!isLoading && !activeFrame && (
                        <>
                            {/* Folders Section */}
                            {(visibleFolders.length > 0 || (!activeEntry && hasExternalPages && !isExternalPagesView)) && (
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
                                        {/* External Pages Folder - only shown at top level when there are external pages */}
                                        {!activeEntry && hasExternalPages && !isExternalPagesView && selectedDepartmentId && (
                                            <ExternalPagesLink
                                                selectedDepartmentId={selectedDepartmentId}
                                                externalPageCount={externalPageEntries.length}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pages Section */}
                            {visiblePages.length > 0 && (
                                <div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {visiblePages.map((child) => {
                                            // Use externalPathById for external pages, pathById for regular pages
                                            const path = isExternalPagesView
                                                ? externalPathById.get(child.id) ?? [child.slug]
                                                : pathById.get(child.id) ?? [child.slug];
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
                            {visibleFolders.length === 0 && visiblePages.length === 0 && selectedDepartmentId && !isExternalPagesView && !(!activeEntry && hasExternalPages) && (
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
                onDelete={() => activeEntry && handleDeleteFolder(activeEntry)}
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
                onDelete={() => activeFrame && handleDeletePage(activeFrame)}
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

            <ConfirmDeleteModal
                isOpen={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={deleteTarget?.type === "folder" ? "Confirm delete folder" : "Confirm delete page"}
                description={
                    deleteTarget?.type === "folder"
                        ? `This will also delete all contents inside.`
                        : `This cannot be undone.`
                }
                onConfirm={confirmDelete}
                isLoading={isDeleting}
            />
        </div>
    );
};
