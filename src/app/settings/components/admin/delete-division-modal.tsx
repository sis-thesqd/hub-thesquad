"use client";

import { AlertTriangle } from "@untitledui/icons";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { NativeSelect } from "@/components/base/select/select-native";

interface DeleteDivisionModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    divisionToDelete: string | null;
    targetDivision: string;
    onTargetDivisionChange: (value: string) => void;
    availableDivisions: string[];
    pagesInDivisionCount: number;
    onConfirmDelete: () => void;
    onCancel: () => void;
}

export const DeleteDivisionModal = ({
    isOpen,
    onOpenChange,
    divisionToDelete,
    targetDivision,
    onTargetDivisionChange,
    availableDivisions,
    pagesInDivisionCount,
    onConfirmDelete,
    onCancel,
}: DeleteDivisionModalProps) => {
    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
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
                                    This division has {pagesInDivisionCount} page(s). Select a division to move them to.
                                </p>
                            </div>

                            <div className="mt-4">
                                <NativeSelect
                                    label="Move pages to"
                                    aria-label="Target division"
                                    value={targetDivision}
                                    onChange={(e) => onTargetDivisionChange(e.target.value)}
                                    options={availableDivisions.map(div => ({
                                        label: div.charAt(0) + div.slice(1).toLowerCase(),
                                        value: div,
                                    }))}
                                />
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button
                                    color="secondary"
                                    className="flex-1"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary-destructive"
                                    className="flex-1"
                                    onClick={onConfirmDelete}
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
    );
};
