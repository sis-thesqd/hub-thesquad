"use client";

import type { ListData } from "react-stately";
import { CreateFolderModal, CreatePageModal, FullscreenIframeModal } from "@/components/app/directory-app/components/modals";
import type { FormState } from "@/components/app/directory-app/types";
import type { SelectItemType } from "@/components/base/select/select";
import type { Frame } from "@/utils/supabase/types";

interface HomeModalsProps {
    // Folder modal
    createFolderOpen: boolean;
    onCreateFolderOpenChange: (open: boolean) => void;
    folderForm: FormState;
    onFolderFormChange: (form: FormState) => void;
    folderOptions: SelectItemType[];
    folderParentId: string | null;
    onFolderParentIdChange: (id: string | null) => void;
    onFolderSubmit: () => void;
    // Page modal
    createPageOpen: boolean;
    onCreatePageOpenChange: (open: boolean) => void;
    pageForm: FormState;
    onPageFormChange: (form: FormState) => void;
    departmentItems: SelectItemType[];
    pageDepartments: ListData<SelectItemType>;
    pagePlacements: ListData<SelectItemType>;
    onFolderSelected: (key: string | number) => void;
    onPageSubmit: () => void;
    // Fullscreen modal
    fullscreenOpen: boolean;
    onFullscreenOpenChange: (open: boolean) => void;
    fullscreenFrame: Frame | null;
    fullscreenPathSegments: string[];
}

export const HomeModals = ({
    createFolderOpen,
    onCreateFolderOpenChange,
    folderForm,
    onFolderFormChange,
    folderOptions,
    folderParentId,
    onFolderParentIdChange,
    onFolderSubmit,
    createPageOpen,
    onCreatePageOpenChange,
    pageForm,
    onPageFormChange,
    departmentItems,
    pageDepartments,
    pagePlacements,
    onFolderSelected,
    onPageSubmit,
    fullscreenOpen,
    onFullscreenOpenChange,
    fullscreenFrame,
    fullscreenPathSegments,
}: HomeModalsProps) => {
    return (
        <>
            <CreateFolderModal
                isOpen={createFolderOpen}
                onOpenChange={onCreateFolderOpenChange}
                form={folderForm}
                onFormChange={onFolderFormChange}
                parentOptions={folderOptions}
                parentId={folderParentId}
                onParentIdChange={onFolderParentIdChange}
                onSubmit={onFolderSubmit}
            />

            <CreatePageModal
                isOpen={createPageOpen}
                onOpenChange={onCreatePageOpenChange}
                form={pageForm}
                onFormChange={onPageFormChange}
                departmentItems={departmentItems}
                pageDepartments={pageDepartments}
                folderOptions={folderOptions}
                pagePlacements={pagePlacements}
                onFolderSelected={onFolderSelected}
                onSubmit={onPageSubmit}
            />

            <FullscreenIframeModal
                isOpen={fullscreenOpen}
                onOpenChange={onFullscreenOpenChange}
                frame={fullscreenFrame}
                pathSegments={fullscreenPathSegments}
            />
        </>
    );
};
