"use client";

import { FolderClosed, Save01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { NativeSelect } from "@/components/base/select/select-native";
import { getIconByName } from "@/utils/icon-map";
import type { NavigationPage, Department } from "@/utils/supabase/types";
import { ICON_OPTIONS } from "./icon-options";

interface DepartmentPagesSectionProps {
    editedPages: NavigationPage[];
    editedDivisionOrder: string[];
    departments: Department[];
    hasChanges: boolean;
    isSaving: boolean;
    navPagesLoading: boolean;
    onSave: () => void;
    onIconChange: (departmentId: string, newIcon: string) => void;
    onSlugChange: (departmentId: string, newSlug: string) => void;
    onDivisionChange: (departmentId: string, newDivision: string) => void;
    onDocsFolderChange: (departmentId: string, newFolder: string) => void;
}

export const DepartmentPagesSection = ({
    editedPages,
    editedDivisionOrder,
    departments,
    hasChanges,
    isSaving,
    navPagesLoading,
    onSave,
    onIconChange,
    onSlugChange,
    onDivisionChange,
    onDocsFolderChange,
}: DepartmentPagesSectionProps) => {
    return (
        <>
            <div>
                <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch pb-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-primary">Department Pages</h2>
                        {hasChanges && (
                            <Button
                                color="primary"
                                size="sm"
                                iconLeading={Save01}
                                onClick={onSave}
                                isDisabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        )}
                    </div>
                    <p className="text-sm text-tertiary">
                        Configure department icons and URL slugs for the navigation menu.
                    </p>
                </div>
            </div>

            {navPagesLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <p className="text-sm text-tertiary">Loading...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {editedPages.map((page) => {
                        const department = departments.find(d => d.id === page.department_id);
                        const Icon = getIconByName(page.icon, FolderClosed);

                        return (
                            <div
                                key={page.department_id}
                                className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                        <Icon className="size-5 text-fg-quaternary" />
                                    </div>
                                    <p className="text-sm font-medium text-primary">
                                        {department?.name || page.title}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="w-44">
                                        <NativeSelect
                                            label="Division"
                                            aria-label="Division"
                                            value={page.division || "SQUAD"}
                                            onChange={(e) => onDivisionChange(page.department_id, e.target.value)}
                                            options={editedDivisionOrder.map(div => ({
                                                label: div.charAt(0) + div.slice(1).toLowerCase(),
                                                value: div,
                                            }))}
                                        />
                                    </div>

                                    <div className="w-56">
                                        <Select.ComboBox
                                            label="Department Icon"
                                            aria-label="Department Icon"
                                            size="sm"
                                            placeholder="Search icons..."
                                            items={ICON_OPTIONS}
                                            selectedKey={page.icon}
                                            onSelectionChange={(key) => onIconChange(page.department_id, key as string)}
                                            shortcut={false}
                                        >
                                            {(item) => {
                                                const ItemIcon = getIconByName(item.id, FolderClosed);
                                                return (
                                                    <Select.Item id={item.id} textValue={item.label}>
                                                        <div className="flex items-center gap-2">
                                                            <ItemIcon className="size-4 shrink-0 text-fg-quaternary" />
                                                            <span className="truncate">{item.label}</span>
                                                        </div>
                                                    </Select.Item>
                                                );
                                            }}
                                        </Select.ComboBox>
                                    </div>

                                    <div className="w-56">
                                        <Input
                                            label="Slug"
                                            aria-label="Slug"
                                            size="sm"
                                            placeholder="url-slug"
                                            value={page.slug}
                                            onChange={(value) => onSlugChange(page.department_id, value)}
                                        />
                                    </div>

                                    <div className="w-72">
                                        <Input
                                            label="Docs folder"
                                            aria-label="Docs folder"
                                            size="sm"
                                            placeholder="docs folder path"
                                            value={page.docs_folder || ""}
                                            onChange={(value) => onDocsFolderChange(page.department_id, value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};
