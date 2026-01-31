"use client";

import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

interface AddDivisionModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    newDivision: string;
    onNewDivisionChange: (value: string) => void;
    onAddDivision: () => void;
}

export const AddDivisionModal = ({
    isOpen,
    onOpenChange,
    newDivision,
    onNewDivisionChange,
    onAddDivision,
}: AddDivisionModalProps) => {
    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
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
                                    onChange={onNewDivisionChange}
                                    onKeyDown={(e) => e.key === "Enter" && onAddDivision()}
                                />
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button
                                    color="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        onOpenChange(false);
                                        onNewDivisionChange("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    className="flex-1"
                                    onClick={onAddDivision}
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
    );
};
