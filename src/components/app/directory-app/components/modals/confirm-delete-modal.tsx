import { AlertTriangle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";

type ConfirmDeleteModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    isLoading?: boolean;
};

export const ConfirmDeleteModal = ({
    isOpen,
    onOpenChange,
    title,
    description,
    onConfirm,
    isLoading,
}: ConfirmDeleteModalProps) => {
    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button className="hidden" />
            <ModalOverlay>
                <Modal className="max-w-md">
                    <Dialog className="w-full">
                        <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-error_secondary">
                                    <AlertTriangle className="size-6 text-fg-error_primary" />
                                </div>
                                <p className="text-lg font-semibold text-primary">{title}</p>
                                <p className="mt-2 text-sm text-tertiary">{description}</p>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Button
                                    color="secondary"
                                    className="flex-1"
                                    onClick={() => onOpenChange(false)}
                                    isDisabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary-destructive"
                                    className="flex-1"
                                    onClick={onConfirm}
                                    isDisabled={isLoading}
                                >
                                    {isLoading ? "Deleting..." : "Delete"}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
