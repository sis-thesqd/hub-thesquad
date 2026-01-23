import { useState, useEffect } from "react";
import type { FC } from "react";
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

type EditPageModalProps = {
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

export const EditPageModal = ({
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
}: EditPageModalProps) => {
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
                            <div className="mb-4">
                                <p className="text-lg font-semibold text-primary">Edit page</p>
                            </div>
                            <div className="grid gap-4">
                                <EmojiPickerField
                                    value={form.emoji}
                                    onChange={(emoji) => onFormChange({ ...form, emoji })}
                                    isRequired
                                />
                                <Input
                                    label="Page name"
                                    value={form.name}
                                    onChange={handleNameChange}
                                    isRequired
                                />
                                <Input
                                    label="Slug"
                                    value={form.slug}
                                    onChange={handleSlugChange}
                                    isRequired
                                />
                                <Input
                                    label="Iframe URL"
                                    value={form.iframeUrl}
                                    onChange={(value) => onFormChange({ ...form, iframeUrl: value })}
                                    isRequired
                                />
                                <TextArea
                                    label="Description"
                                    value={form.description}
                                    onChange={(value) => onFormChange({ ...form, description: value })}
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
