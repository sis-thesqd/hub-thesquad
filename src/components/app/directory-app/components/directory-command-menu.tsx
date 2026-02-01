"use client";

import { useEffect, useMemo, useState } from "react";
import { File02, File06, Folder, FolderClosed } from "@untitledui/icons";
import type { Selection } from "react-aria-components";
import { Heading as AriaHeading } from "react-aria-components";
import { useHotkeys } from "react-hotkeys-hook";
import type { CommandDropdownMenuItemProps } from "@/components/application/command-menus/base-components/command-menu-item";
import { CommandMenu } from "@/components/application/command-menus/command-menu";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { slugify } from "@/utils/slugify";
import type { DirectoryEntry, Frame, NavigationPage, RipplingDepartment } from "@/utils/supabase/types";
import { getIconByName } from "@/utils/icon-map";

type DirectoryCommandMenuProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    departments: RipplingDepartment[];
    entries: DirectoryEntry[];
    frames: Frame[];
    navigationPages: NavigationPage[];
    onSelect: (type: "department" | "folder" | "page" | "wiki", id: string) => void;
};

export const DirectoryCommandMenu = ({
    isOpen,
    onOpenChange,
    departments,
    entries,
    frames,
    navigationPages,
    onSelect,
}: DirectoryCommandMenuProps) => {
    // Listen for Cmd+K
    useHotkeys("meta+k", (e) => {
        e.preventDefault();
        onOpenChange(true);
    }, { enableOnFormTags: true });

    const [query, setQuery] = useState("");
    const [wikiResults, setWikiResults] = useState<Array<{ name: string; path: string }>>([]);

    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setWikiResults([]);
            return;
        }
        if (!query.trim()) {
            setWikiResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
                const data = await response.json();
                const results = Array.isArray(data?.results) ? data.results : [];
                setWikiResults(results.map((result: { name: string; path: string }) => ({
                    name: result.name,
                    path: result.path,
                })));
            } catch (error) {
                console.error("Wiki search failed:", error);
                setWikiResults([]);
            }
        }, 250);

        return () => clearTimeout(timeout);
    }, [isOpen, query]);

    const groups = useMemo(() => {
        // Departments group - use icons from navigationPages like home page
        const departmentItems: CommandDropdownMenuItemProps[] = departments.map((dept) => {
            // Match department with navigation page by slug (same as HomeGrid)
            const deptSlug = slugify(dept.name);
            const navPage = navigationPages.find((page) => page.slug === deptSlug);
            const icon = navPage ? getIconByName(navPage.icon, FolderClosed) : FolderClosed;

            return {
                id: `dept-${dept.id}`,
                type: "icon" as const,
                label: dept.name ?? dept.id,
                icon,
                size: "sm" as const,
                description: "Department",
                stacked: true,
            };
        });

        // Folders group (entries without frame_id)
        const folders = entries.filter((entry) => !entry.frame_id);
        const folderItems: CommandDropdownMenuItemProps[] = folders.map((folder) => {
            const dept = departments.find((d) => d.id === folder.department_id);
            // Use emoji type if folder has emoji, otherwise use icon type
            if (folder.emoji) {
                return {
                    id: `folder-${folder.id}`,
                    type: "emoji" as const,
                    label: folder.name,
                    emoji: folder.emoji,
                    size: "sm" as const,
                    description: dept?.name ?? "Folder",
                    stacked: true,
                };
            }
            return {
                id: `folder-${folder.id}`,
                type: "icon" as const,
                label: folder.name,
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
            // Use emoji type if entry has emoji, otherwise use icon type
            if (entry?.emoji) {
                return {
                    id: `page-${frame.id}`,
                    type: "emoji" as const,
                    label: frame.name,
                    emoji: entry.emoji,
                    size: "sm" as const,
                    description: frame.description || dept?.name || "Page",
                    stacked: true,
                };
            }
            return {
                id: `page-${frame.id}`,
                type: "icon" as const,
                label: frame.name,
                icon: File06,
                size: "sm" as const,
                description: frame.description || dept?.name || "Page",
                stacked: true,
            };
        });

        const wikiItems: CommandDropdownMenuItemProps[] = wikiResults.map((result) => ({
            id: `wiki-${result.path}`,
            type: "icon" as const,
            label: result.name.replace(/\\.md$/, ""),
            icon: File02,
            size: "sm" as const,
            description: result.path,
            stacked: true,
        }));

        return [
            { id: "departments", title: "Departments", items: departmentItems },
            { id: "folders", title: "Folders", items: folderItems },
            { id: "pages", title: "Pages", items: pageItems },
            { id: "wiki", title: "Wiki", items: wikiItems },
        ].filter((group) => group.items.length > 0);
    }, [departments, entries, frames, navigationPages, wikiResults]);

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
        } else if (keyStr.startsWith("wiki-")) {
            onSelect("wiki", keyStr.replace("wiki-", ""));
        }
        onOpenChange(false);
    };

    return (
        <CommandMenu
            isOpen={isOpen}
            items={groups}
            onOpenChange={onOpenChange}
            onSelectionChange={handleSelectionChange}
            inputValue={query}
            onInputChange={setQuery}
            emptyState={
                <EmptyState size="sm" className="overflow-hidden p-6 pb-10">
                    <EmptyState.Header>
                        <EmptyState.FeaturedIcon color="gray" />
                    </EmptyState.Header>

                    <EmptyState.Content className="mb-0">
                        <EmptyState.Title>No results found</EmptyState.Title>
                        <EmptyState.Description>
                            Your search did not match any departments, folders, pages, or wiki articles.
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
