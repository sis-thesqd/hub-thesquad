"use client";

import { useState } from "react";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";

export type DeleteTarget = {
    type: "folder" | "page";
    item: DirectoryEntry | Frame;
} | null;

export const useDeleteConfirmation = () => {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    return {
        deleteConfirmOpen,
        setDeleteConfirmOpen,
        deleteTarget,
        setDeleteTarget,
        isDeleting,
        setIsDeleting,
    };
};
