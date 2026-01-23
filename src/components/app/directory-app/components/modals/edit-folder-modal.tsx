import { useState, useEffect } from "react";
import { Trash01, X } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { FormState } from "../../types";
import { EmojiPickerField } from "../emoji-picker-field";
import { slugify } from "../../utils";

type EditFolderModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    form: FormState;
    onFormChange: (form: FormState) => void;
    onSubmit: () => void;
    onDelete?: () => void;
};

export const EditFolderModal = ({
    isOpen,
    onOpenChange,
    form,
    onFormChange,
    onSubmit,
    onDelete,
}: EditFolderModalProps) => {
    // For edit mode, slug starts as manually edited (pre-populated with existing value)
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(true);

    // Reset to manually edited when modal opens (since it's pre-populated)
    useEffect(() => {
        if (isOpen) {
            setSlugManuallyEdited(true);
        }
    }, [isOpen]);

    const handleNameChange = (value: string) => {
        if (!slugManuallyEdited) {
            onFormChange({ ...form, name: value, slug: slugify(value) });
        } else {
            onFormChange({ ...form, name: value });
        }
    };

    const handleSlugChange = (value: string) => {
        // If user clears the slug, allow auto-generation again
        if (value === "") {
            setSlugManuallyEdited(false);
            onFormChange({ ...form, slug: slugify(form.name) });
        } else {
            setSlugManuallyEdited(true);
            onFormChange({ ...form, slug: value });
        }
    };

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button className="hidden" />
            <ModalOverlay>
                <Modal className="max-w-xl">
                    <Dialog className="w-full">
                        <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-lg font-semibold text-primary">Edit folder</p>
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="flex size-8 items-center justify-center rounded-md text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                            <div className="grid gap-4">
                                <div className="flex items-end gap-3">
                                    <EmojiPickerField
                                        value={form.emoji}
                                        onChange={(emoji) => onFormChange({ ...form, emoji })}
                                    />
                                    <div className="flex-1">
                                        <Input
                                            label="Folder name"
                                            value={form.name}
                                            onChange={handleNameChange}
                                        />
                                    </div>
                                </div>
                                <Input
                                    label="Slug"
                                    value={form.slug}
                                    onChange={handleSlugChange}
                                />
                            </div>

                            <div className="mt-6 flex justify-between">
                                {onDelete && (
                                    <Button color="primary-destructive" iconLeading={Trash01} onClick={onDelete}>
                                        Delete folder
                                    </Button>
                                )}
                                <div className="ml-auto">
                                    <Button onClick={onSubmit}>Save changes</Button>
                                </div>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
