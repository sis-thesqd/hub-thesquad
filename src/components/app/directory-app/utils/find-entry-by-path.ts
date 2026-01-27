import type { DirectoryEntry } from "@/utils/supabase/types";

export type FindEntryResult = {
    entry: DirectoryEntry | null;
    remainingPath: string[];
};

export const findEntryByPath = (childrenByParent: Map<string | null, DirectoryEntry[]>, segments: string[]): FindEntryResult => {
    let parentId: string | null = null;
    let current: DirectoryEntry | undefined;

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const children: DirectoryEntry[] = childrenByParent.get(parentId) ?? [];
        current = children.find((child: DirectoryEntry) => child.slug === segment);

        if (!current) {
            return { entry: null, remainingPath: [] };
        }

        // If this is a page (has frame_id), stop here and return remaining segments
        if (current.frame_id) {
            return {
                entry: current,
                remainingPath: segments.slice(i + 1),
            };
        }

        parentId = current.id;
    }

    return { entry: current ?? null, remainingPath: [] };
};
