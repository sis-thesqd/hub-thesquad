import type { DirectoryEntry } from "@/utils/supabase/types";

/**
 * Builds an array of slug segments from an entry back to the root of the directory tree.
 * The resulting array is ordered from root to the entry (e.g., ["parent-slug", "child-slug", "entry-slug"]).
 */
export const buildPathToRoot = (
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

/**
 * Creates a Map of entries keyed by their ID for efficient lookups.
 */
export const createEntriesMap = (entries: DirectoryEntry[]): Map<string, DirectoryEntry> => {
    return new Map(entries.map((e) => [e.id, e]));
};
