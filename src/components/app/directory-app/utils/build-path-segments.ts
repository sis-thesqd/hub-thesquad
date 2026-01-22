import type { DirectoryEntry } from "@/utils/supabase/types";

export const buildPathSegments = (entriesById: Map<string, DirectoryEntry>, entry: DirectoryEntry) => {
    const segments: string[] = [entry.slug];
    let current = entry.parent_id ? entriesById.get(entry.parent_id) : null;

    while (current) {
        segments.unshift(current.slug);
        current = current.parent_id ? entriesById.get(current.parent_id) : null;
    }

    return segments;
};
