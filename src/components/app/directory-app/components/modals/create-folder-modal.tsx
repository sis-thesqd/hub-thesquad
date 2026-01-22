import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { FormState } from "../../types";

type ParentOption = {
    label: string;
    value: string;
};

type CreateFolderModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    form: FormState;
    onFormChange: (form: FormState) => void;
    parentOptions: ParentOption[];
    parentId: string | null;
    onParentIdChange: (id: string | null) => void;
    onSubmit: () => void;
};

export const CreateFolderModal = ({
    isOpen,
    onOpenChange,
    form,
    onFormChange,
    parentOptions,
    parentId,
    onParentIdChange,
    onSubmit,
}: CreateFolderModalProps) => {
    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button className="hidden" />
            <ModalOverlay>
                <Modal className="max-w-xl">
                    <Dialog className="w-full">
                        <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                            <div className="mb-4">
                                <p className="text-lg font-semibold text-primary">Create folder</p>
                                <p className="text-sm text-tertiary">Organize pages for this department.</p>
                            </div>

                            <div className="grid gap-4">
                                <Input
                                    label="Folder name"
                                    value={form.name}
                                    onChange={(value) => onFormChange({ ...form, name: value })}
                                    placeholder="e.g. Reporting"
                                />
                                <Input
                                    label="Slug"
                                    value={form.slug}
                                    onChange={(value) => onFormChange({ ...form, slug: value })}
                                    placeholder="auto-generated"
                                />
                                <NativeSelect
                                    label="Parent folder"
                                    value={parentId ?? "root"}
                                    options={parentOptions}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        onParentIdChange(value === "root" ? null : value);
                                    }}
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button color="secondary" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={onSubmit}>Create folder</Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
