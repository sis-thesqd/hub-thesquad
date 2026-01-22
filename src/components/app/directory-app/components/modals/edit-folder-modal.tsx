import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { FormState } from "../../types";

type EditFolderModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    form: FormState;
    onFormChange: (form: FormState) => void;
    onSubmit: () => void;
};

export const EditFolderModal = ({
    isOpen,
    onOpenChange,
    form,
    onFormChange,
    onSubmit,
}: EditFolderModalProps) => {
    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button className="hidden" />
            <ModalOverlay>
                <Modal className="max-w-xl">
                    <Dialog className="w-full">
                        <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                            <div className="mb-4">
                                <p className="text-lg font-semibold text-primary">Edit folder</p>
                            </div>
                            <div className="grid gap-4">
                                <Input
                                    label="Folder name"
                                    value={form.name}
                                    onChange={(value) => onFormChange({ ...form, name: value })}
                                />
                                <Input
                                    label="Slug"
                                    value={form.slug}
                                    onChange={(value) => onFormChange({ ...form, slug: value })}
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button color="secondary" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={onSubmit}>Save changes</Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
