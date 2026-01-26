"use client";

import { useMemo } from "react";
import type { DirectoryEntry } from "@/utils/supabase/types";

type ParentOption = {
    id: string;
    label: string;
    emoji?: string;
};

type UseParentOptionsParams = {
    filteredEntries: DirectoryEntry[];
};

export const useParentOptions = ({
    filteredEntries,
}: UseParentOptionsParams): ParentOption[] => {
    return useMemo(() => {
        return [
            { id: "root", label: "Top level" },
            ...filteredEntries
                .filter((entry) => !entry.frame_id)
                .map((entry) => ({
                    id: entry.id,
                    label: entry.name,
                    emoji: entry.emoji ?? undefined,
                })),
        ];
    }, [filteredEntries]);
};
