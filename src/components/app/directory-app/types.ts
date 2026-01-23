import type React from "react";
import type { DirectoryEntry, Frame, NavigationPage, RipplingDepartment } from "@/utils/supabase/types";

export type DirectoryAppProps = {
    initialDepartmentId?: string;
    initialPath?: string[];
    variant?: "full" | "embedded";
    showDepartments?: boolean;
    departmentsOverride?: RipplingDepartment[];
    entriesOverride?: DirectoryEntry[];
    framesOverride?: Frame[];
    navigationPages?: NavigationPage[];
    onHeaderContentChange?: (content: React.ReactNode | null) => void;
    initialModalAction?: "folder" | "page" | null;
    onModalActionHandled?: () => void;
    favoriteEntryIds?: string[];
    onToggleFavorite?: (entryId: string) => void;
};

export type FormState = {
    name: string;
    slug: string;
    iframeUrl: string;
    description: string;
    emoji: string;
};
