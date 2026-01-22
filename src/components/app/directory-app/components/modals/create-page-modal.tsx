import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { SelectItemType } from "@/components/base/select/select";
import type { RipplingDepartment } from "@/utils/supabase/types";
import type { FormState } from "../../types";
import { useListData } from "react-stately";

type FolderOption = {
    id: string;
    label: string;
    supportingText?: string;
};

type CreatePageModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    form: FormState;
    onFormChange: (form: FormState) => void;
    departments: RipplingDepartment[];
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
    departments,
    pageDepartments,
    folderOptions,
    pagePlacements,
    onFolderSelected,
    onSubmit,
}: CreatePageModalProps) => {
    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button className="hidden" />
            <ModalOverlay>
                <Modal className="max-w-xl">
                    <Dialog className="w-full">
                        <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary_alt">
                            <div className="mb-4">
                                <p className="text-lg font-semibold text-primary">Create page</p>
                                <p className="text-sm text-tertiary">Embed an app or form URL.</p>
                            </div>
                            <div className="grid gap-4">
                                <Input
                                    label="Page name"
                                    value={form.name}
                                    onChange={(value) => onFormChange({ ...form, name: value })}
                                    placeholder="e.g. Intake form"
                                />
                                <Input
                                    label="Slug"
                                    value={form.slug}
                                    onChange={(value) => onFormChange({ ...form, slug: value })}
                                    placeholder="auto-generated"
                                />
                                <Input
                                    label="Iframe URL"
                                    value={form.iframeUrl}
                                    onChange={(value) => onFormChange({ ...form, iframeUrl: value })}
                                    placeholder="https://..."
                                />
                                <TextArea
                                    label="Description"
                                    value={form.description}
                                    onChange={(value) => onFormChange({ ...form, description: value })}
                                    placeholder="Optional"
                                />
                                <MultiSelect
                                    label="Visible to departments"
                                    items={departments.map((department) => ({
                                        id: department.id,
                                        label: department.name ?? department.id,
                                    }))}
                                    selectedItems={pageDepartments}
                                    placeholder="Search departments"
                                >
                                    {(item) => <MultiSelect.Item id={item.id}>{item.label}</MultiSelect.Item>}
                                </MultiSelect>
                                <MultiSelect
                                    label="Folder placements"
                                    items={folderOptions}
                                    selectedItems={pagePlacements}
                                    placeholder="Pick folders"
                                    onItemInserted={onFolderSelected}
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
                                <Button onClick={onSubmit}>Create page</Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
