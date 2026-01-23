"use client";

import { useMemo } from "react";
import { File06, Folder, Grid01 } from "@untitledui/icons";
import type { Selection } from "react-aria-components";
import { Heading as AriaHeading } from "react-aria-components";
import { useHotkeys } from "react-hotkeys-hook";
import type { CommandDropdownMenuItemProps } from "@/components/application/command-menus/base-components/command-menu-item";
import { CommandMenu } from "@/components/application/command-menus/command-menu";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import type { DirectoryEntry, Frame, RipplingDepartment } from "@/utils/supabase/types";

type DirectoryCommandMenuProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    departments: RipplingDepartment[];
    entries: DirectoryEntry[];
    frames: Frame[];
    onSelect: (type: "department" | "folder" | "page", id: string) => void;
};

export const DirectoryCommandMenu = ({
    isOpen,
    onOpenChange,
    departments,
    entries,
    frames,
    onSelect,
}: DirectoryCommandMenuProps) => {
    // Listen for Cmd+K
    useHotkeys("meta+k", (e) => {
        e.preventDefault();
        onOpenChange(true);
    }, { enableOnFormTags: true });

    const groups = useMemo(() => {
        // Departments group
        const departmentItems: CommandDropdownMenuItemProps[] = departments.map((dept) => ({
            id: `dept-${dept.id}`,
            type: "icon" as const,
            label: dept.name ?? dept.id,
            icon: Grid01,
            size: "sm" as const,
            description: "Department",
            stacked: true,
        }));

        // Folders group (entries without frame_id)
        const folders = entries.filter((entry) => !entry.frame_id);
        const folderItems: CommandDropdownMenuItemProps[] = folders.map((folder) => {
            const dept = departments.find((d) => d.id === folder.department_id);
            return {
                id: `folder-${folder.id}`,
                type: "icon" as const,
                label: folder.emoji ? `${folder.emoji} ${folder.name}` : folder.name,
                icon: Folder,
                size: "sm" as const,
                description: dept?.name ?? "Folder",
                stacked: true,
            };
        });

        // Pages group (frames)
        const pageItems: CommandDropdownMenuItemProps[] = frames.map((frame) => {
            // Find the entry for this frame to get its emoji
            const entry = entries.find((e) => e.frame_id === frame.id);
            const dept = departments.find((d) => frame.department_ids.includes(d.id));
            return {
                id: `page-${frame.id}`,
                type: "icon" as const,
                label: entry?.emoji ? `${entry.emoji} ${frame.name}` : frame.name,
                icon: File06,
                size: "sm" as const,
                description: frame.description || dept?.name || "Page",
                stacked: true,
            };
        });

        return [
            { id: "departments", title: "Departments", items: departmentItems },
            { id: "folders", title: "Folders", items: folderItems },
            { id: "pages", title: "Pages", items: pageItems },
        ].filter((group) => group.items.length > 0);
    }, [departments, entries, frames]);

    const handleSelectionChange = (selection: Selection) => {
        if (selection === "all") return;
        const keys = Array.from(selection);
        if (keys.length === 0) return;

        const keyStr = keys[0].toString();
        if (keyStr.startsWith("dept-")) {
            onSelect("department", keyStr.replace("dept-", ""));
        } else if (keyStr.startsWith("folder-")) {
            onSelect("folder", keyStr.replace("folder-", ""));
        } else if (keyStr.startsWith("page-")) {
            onSelect("page", keyStr.replace("page-", ""));
        }
        onOpenChange(false);
    };

    return (
        <CommandMenu
            isOpen={isOpen}
            items={groups}
            onOpenChange={onOpenChange}
            onSelectionChange={handleSelectionChange}
            emptyState={
                <EmptyState size="sm" className="overflow-hidden p-6 pb-10">
                    <EmptyState.Header>
                        <EmptyState.FeaturedIcon color="gray" />
                    </EmptyState.Header>

                    <EmptyState.Content className="mb-0">
                        <EmptyState.Title>No results found</EmptyState.Title>
                        <EmptyState.Description>
                            Your search did not match any departments, folders, or pages.
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState>
            }
        >
            <AriaHeading slot="title" className="sr-only">
                Search Directory
            </AriaHeading>
            <CommandMenu.Group>
                <CommandMenu.List className="min-h-49">
                    {(group) => (
                        <CommandMenu.Section {...group}>
                            {(item) => <CommandMenu.Item key={item.id} {...item} />}
                        </CommandMenu.Section>
                    )}
                </CommandMenu.List>
            </CommandMenu.Group>
        </CommandMenu>
    );
};
