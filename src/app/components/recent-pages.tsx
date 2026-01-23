"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FileCode01, Star01 } from "@untitledui/icons";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";

interface RecentPagesProps {
    entries: DirectoryEntry[];
    frames: Frame[];
    userDepartmentId: string | null;
    favoriteEntryIds?: string[];
}

// Build path segments from entry to root
const buildPathToRoot = (
    entriesById: Map<string, DirectoryEntry>,
    entry: DirectoryEntry
): string[] => {
    const pathParts: string[] = [entry.slug];
    let currentParentId = entry.parent_id;

    while (currentParentId) {
        const parent = entriesById.get(currentParentId);
        if (parent) {
            pathParts.unshift(parent.slug);
            currentParentId = parent.parent_id;
        } else {
            break;
        }
    }

    return pathParts;
};

export const RecentPages = ({ entries, frames, userDepartmentId, favoriteEntryIds = [] }: RecentPagesProps) => {
    const appendUrlParams = useAppendUrlParams();

    const recentPages = useMemo(() => {
        // Create a lookup map for entries
        const entriesById = new Map(entries.map((e) => [e.id, e]));

        // Filter frames by user's department visibility
        const visibleFrames = frames.filter((frame) => {
            // If no department_ids, frame is visible to all
            if (!frame.department_ids?.length) return true;
            // Otherwise, check if user's department is in the list
            return userDepartmentId && frame.department_ids.includes(userDepartmentId);
        });

        // Sort by created_at descending (most recent first)
        const sortedFrames = [...visibleFrames].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });

        // Take only the first 8 recent pages
        const recentFrames = sortedFrames.slice(0, 8);

        // Map frames to their directory entries to get the URL path
        return recentFrames.map((frame) => {
            // Find the first entry for this frame
            const entry = entries.find((e) => e.frame_id === frame.id);
            if (!entry) return null;

            // Build full path including parent folders
            const pathParts = buildPathToRoot(entriesById, entry);
            const href = `/${entry.department_id}/${pathParts.join("/")}`;

            return {
                id: frame.id,
                entryId: entry.id,
                name: frame.name,
                description: frame.description,
                emoji: entry.emoji,
                href,
                createdAt: frame.created_at,
            };
        }).filter(Boolean) as Array<{
            id: string;
            entryId: string;
            name: string;
            description: string | null;
            emoji: string | null;
            href: string;
            createdAt: string | undefined;
        }>;
    }, [frames, entries, userDepartmentId]);

    if (recentPages.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-primary">Recently Added</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentPages.map((page) => {
                    const href = appendUrlParams(page.href);
                    const isFavorite = favoriteEntryIds.includes(page.entryId);
                    return (
                        <Link
                            key={page.id}
                            href={href}
                            className="group relative flex items-start gap-3 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                        >
                            {isFavorite && (
                                <div className="absolute top-2 right-2">
                                    <Star01 className="size-4 fill-warning-primary text-warning-primary" />
                                </div>
                            )}
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                {page.emoji ? (
                                    <span className="text-lg">{page.emoji}</span>
                                ) : (
                                    <FileCode01 className="size-5 text-fg-tertiary group-hover:text-brand-secondary" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-primary">{page.name}</p>
                                {page.createdAt && (
                                    <p className="mt-0.5 text-sm text-tertiary">
                                        Added {new Date(page.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
