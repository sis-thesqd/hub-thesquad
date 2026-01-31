"use client";

import type { NavigationPage, Department } from "@/utils/supabase/types";
import { DivisionOrderSection } from "./division-order-section";
import { DepartmentPagesSection } from "./department-pages-section";
import { AddDivisionModal } from "./add-division-modal";
import { DeleteDivisionModal } from "./delete-division-modal";

interface AdminTabProps {
    editedPages: NavigationPage[];
    editedDivisionOrder: string[];
    departments: Department[];
    hasChanges: boolean;
    hasDivisionOrderChanges: boolean;
    isSaving: boolean;
    navPagesLoading: boolean;
    addDivisionModalOpen: boolean;
    deleteDivisionModalOpen: boolean;
    newDivision: string;
    divisionToDelete: string | null;
    targetDivision: string;
    onSave: () => void;
    onSaveDivisionOrder: () => void;
    onIconChange: (departmentId: string, newIcon: string) => void;
    onSlugChange: (departmentId: string, newSlug: string) => void;
    onDivisionChange: (departmentId: string, newDivision: string) => void;
    onMoveDivision: (index: number, direction: "up" | "down") => void;
    onOpenDeleteDivision: (division: string) => void;
    onOpenAddDivisionModal: () => void;
    onAddDivisionModalOpenChange: (open: boolean) => void;
    onDeleteDivisionModalOpenChange: (open: boolean) => void;
    onNewDivisionChange: (value: string) => void;
    onTargetDivisionChange: (value: string) => void;
    onAddDivision: () => void;
    onConfirmDeleteDivision: () => void;
    onCancelDeleteDivision: () => void;
}

export const AdminTab = ({
    editedPages,
    editedDivisionOrder,
    departments,
    hasChanges,
    hasDivisionOrderChanges,
    isSaving,
    navPagesLoading,
    addDivisionModalOpen,
    deleteDivisionModalOpen,
    newDivision,
    divisionToDelete,
    targetDivision,
    onSave,
    onSaveDivisionOrder,
    onIconChange,
    onSlugChange,
    onDivisionChange,
    onMoveDivision,
    onOpenDeleteDivision,
    onOpenAddDivisionModal,
    onAddDivisionModalOpenChange,
    onDeleteDivisionModalOpenChange,
    onNewDivisionChange,
    onTargetDivisionChange,
    onAddDivision,
    onConfirmDeleteDivision,
    onCancelDeleteDivision,
}: AdminTabProps) => {
    const availableDivisions = editedDivisionOrder.filter(d => d !== divisionToDelete);
    const pagesInDivisionCount = editedPages.filter(p => p.division === divisionToDelete).length;

    return (
        <>
            <DivisionOrderSection
                editedDivisionOrder={editedDivisionOrder}
                editedPages={editedPages}
                hasDivisionOrderChanges={hasDivisionOrderChanges}
                isSaving={isSaving}
                onSaveDivisionOrder={onSaveDivisionOrder}
                onMoveDivision={onMoveDivision}
                onOpenDeleteDivision={onOpenDeleteDivision}
                onOpenAddDivisionModal={onOpenAddDivisionModal}
            />

            <AddDivisionModal
                isOpen={addDivisionModalOpen}
                onOpenChange={onAddDivisionModalOpenChange}
                newDivision={newDivision}
                onNewDivisionChange={onNewDivisionChange}
                onAddDivision={onAddDivision}
            />

            <DeleteDivisionModal
                isOpen={deleteDivisionModalOpen}
                onOpenChange={onDeleteDivisionModalOpenChange}
                divisionToDelete={divisionToDelete}
                targetDivision={targetDivision}
                onTargetDivisionChange={onTargetDivisionChange}
                availableDivisions={availableDivisions}
                pagesInDivisionCount={pagesInDivisionCount}
                onConfirmDelete={onConfirmDeleteDivision}
                onCancel={onCancelDeleteDivision}
            />

            <hr className="border-secondary" />

            <DepartmentPagesSection
                editedPages={editedPages}
                editedDivisionOrder={editedDivisionOrder}
                departments={departments}
                hasChanges={hasChanges}
                isSaving={isSaving}
                navPagesLoading={navPagesLoading}
                onSave={onSave}
                onIconChange={onIconChange}
                onSlugChange={onSlugChange}
                onDivisionChange={onDivisionChange}
            />
        </>
    );
};
