import { useState, useEffect, useMemo } from "react";
import type { FC } from "react";
import { X } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { SelectItemType } from "@/components/base/select/select";
import type { FormState } from "../../types";
import { useListData } from "react-stately";
import { EmojiPickerField } from "../emoji-picker-field";
import { slugify } from "../../utils";
import { getRandomEmoji } from "../../constants";

type FolderOption = {
    id: string;
    label: string;
    supportingText?: string;
};

type DepartmentItem = {
    id: string;
    label: string;
    icon: FC<{ className?: string }>;
};

type CreatePageModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    form: FormState;
    onFormChange: (form: FormState) => void;
    departmentItems: DepartmentItem[];
    pageDepartments: ReturnType<typeof useListData<SelectItemType>>;
    folderOptions: FolderOption[];
    pagePlacements: ReturnType<typeof useListData<SelectItemType>>;
    onFolderSelected: (key: string | number) => void;
    onSubmit: () => void;
};

export const CreatePageModal = ({
    isOpen,
    onOpenChange,
    form,
    onFormChange,
    departmentItems,
    pageDepartments,
    folderOptions,
    pagePlacements,
    onFolderSelected,
    onSubmit,
}: CreatePageModalProps) => {
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

    const isFormValid = useMemo(() => {
        return (
            form.name.trim() !== "" &&
            form.slug.trim() !== "" &&
            form.emoji.trim() !== "" &&
            form.iframeUrl.trim() !== "" &&
            form.description.trim() !== "" &&
            pageDepartments.items.length > 0 &&
            pagePlacements.items.length > 0
        );
    }, [form.name, form.slug, form.emoji, form.iframeUrl, form.description, pageDepartments.items.length, pagePlacements.items.length]);

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button className="hidden" />
            <ModalOverlay>
                <Modal className="max-w-xl">
                    <Dialog className="w-full">
                        <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-lg font-semibold text-primary">Create page</p>
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
                                            label="Page name"
                                            value={form.name}
                                            onChange={handleNameChange}
                                            placeholder="e.g. Intake form"
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
                                <Input
                                    label="Public app link"
                                    value={form.iframeUrl}
                                    onChange={(value) => onFormChange({ ...form, iframeUrl: value })}
                                    placeholder="https://..."
                                    isRequired
                                />
                                <TextArea
                                    label="Description"
                                    value={form.description}
                                    onChange={(value) => onFormChange({ ...form, description: value })}
                                    placeholder="Describe what this page is for"
                                    isRequired
                                />
                                <MultiSelect
                                    label="Visible to departments"
                                    items={departmentItems}
                                    selectedItems={pageDepartments}
                                    placeholder="Search departments"
                                    isRequired
                                >
                                    {(item) => <MultiSelect.Item id={item.id}>{item.label}</MultiSelect.Item>}
                                </MultiSelect>
                                <MultiSelect
                                    label="Folder placements"
                                    items={folderOptions}
                                    selectedItems={pagePlacements}
                                    placeholder="Pick folders"
                                    onItemInserted={onFolderSelected}
                                    isRequired
                                >
                                    {(item) => (
                                        <MultiSelect.Item id={item.id} label={item.label} supportingText={item.supportingText} />
                                    )}
                                </MultiSelect>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button onClick={onSubmit} isDisabled={!isFormValid}>Create page</Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
