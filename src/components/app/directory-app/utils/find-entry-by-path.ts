import type { DirectoryEntry } from "@/utils/supabase/types";

export const findEntryByPath = (childrenByParent: Map<string | null, DirectoryEntry[]>, segments: string[]) => {
    let parentId: string | null = null;
    let current: DirectoryEntry | undefined;

    for (const segment of segments) {
        const children: DirectoryEntry[] = childrenByParent.get(parentId) ?? [];
        current = children.find((child: DirectoryEntry) => child.slug === segment);
        if (!current) return null;
        parentId = current.id;
    }

    return current ?? null;
};
