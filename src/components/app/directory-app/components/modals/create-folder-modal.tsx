import { useState, useEffect, useMemo } from "react";
import { X } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { FormState } from "../../types";
import { EmojiPickerField } from "../emoji-picker-field";
import { slugify } from "../../utils";
import { getRandomEmoji } from "../../constants";

type ParentOption = {
    id: string;
    label: string;
    supportingText?: string;
    emoji?: string;
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
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Reset manual edit flag and set random emoji when modal opens
    useEffect(() => {
        if (isOpen) {
            setSlugManuallyEdited(false);
            // Set random emoji if not already set
            if (!form.emoji) {
                onFormChange({ ...form, emoji: getRandomEmoji() });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const isFormValid = useMemo(() => {
        return (
            form.name.trim() !== "" &&
            form.slug.trim() !== "" &&
            form.emoji.trim() !== "" &&
            parentId !== undefined
        );
    }, [form.name, form.slug, form.emoji, parentId]);

    const handleNameChange = (value: string) => {
        if (!slugManuallyEdited) {
            onFormChange({ ...form, name: value, slug: slugify(value) });
        } else {
            onFormChange({ ...form, name: value });
        }
    };

    const handleSlugChange = (value: string) => {
        setSlugManuallyEdited(true);
        onFormChange({ ...form, slug: value });
    };

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button className="hidden" />
            <ModalOverlay>
                <Modal className="max-w-xl">
                    <Dialog className="w-full">
                        <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-lg font-semibold text-primary">Create folder</p>
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
                                        isRequired
                                    />
                                    <div className="flex-1">
                                        <Input
                                            label="Folder name"
                                            value={form.name}
                                            onChange={handleNameChange}
                                            placeholder="e.g. Reporting"
                                            isRequired
                                        />
                                    </div>
                                </div>
                                <Input
                                    label="Slug"
                                    value={form.slug}
                                    onChange={handleSlugChange}
                                    placeholder="auto-generated"
                                    isRequired
                                />
                                <Select.ComboBox
                                    label="Parent folder"
                                    items={parentOptions}
                                    selectedKey={parentId ?? "root"}
                                    onSelectionChange={(key) => {
                                        const value = key as string;
                                        onParentIdChange(value === "root" ? null : value);
                                    }}
                                    placeholder="Search folders"
                                    isRequired
                                >
                                    {(item) => (
                                        <Select.Item id={item.id} supportingText={item.supportingText}>
                                            {item.emoji ? `${item.emoji} ${item.label}` : item.label}
                                        </Select.Item>
                                    )}
                                </Select.ComboBox>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button onClick={onSubmit} isDisabled={!isFormValid}>Create folder</Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
