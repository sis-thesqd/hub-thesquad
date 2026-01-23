import { useState, useEffect, useMemo } from "react";
import type { FC, HTMLAttributes } from "react";
import { Trash01, X } from "@untitledui/icons";

const SlashIcon: FC<HTMLAttributes<HTMLSpanElement>> = ({ className }) => (
    <span className={`${className} text-lg`}>/</span>
);
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
    onDelete?: () => void;
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
    onDelete,
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

    const isFormValid = useMemo(() => {
        return (
            form.name.trim() !== "" &&
            form.slug.trim() !== "" &&
            form.iframeUrl.trim() !== "" &&
            form.description.trim() !== "" &&
            pageDepartments.items.length > 0 &&
            pagePlacements.items.length > 0
        );
    }, [form.name, form.slug, form.iframeUrl, form.description, pageDepartments.items.length, pagePlacements.items.length]);

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button className="hidden" />
            <ModalOverlay>
                <Modal className="max-w-xl">
                    <Dialog className="w-full">
                        <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-lg font-semibold text-primary">Edit page</p>
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
                                    <div className="flex-1">
                                        <Input
                                            label="Page name"
                                            value={form.name}
                                            onChange={handleNameChange}
                                            isRequired
                                        />
                                    </div>
                                    <EmojiPickerField
                                        value={form.emoji}
                                        onChange={(emoji) => onFormChange({ ...form, emoji })}
                                        isRequired
                                    />
                                </div>
                                <Input
                                    label="Slug"
                                    value={form.slug}
                                    onChange={handleSlugChange}
                                    icon={SlashIcon}
                                    inputClassName="pl-8"
                                    isRequired
                                />
                                <Input
                                    label="Public app link"
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

                            <div className="mt-8 flex justify-between">
                                {onDelete && (
                                    <Button color="primary-destructive" iconLeading={Trash01} onClick={onDelete}>
                                        Delete page
                                    </Button>
                                )}
                                <div className="ml-auto">
                                    <Button onClick={onSubmit} isDisabled={!isFormValid}>Save changes</Button>
                                </div>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
