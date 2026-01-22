import type React from "react";
import type { RipplingDepartment } from "@/utils/supabase/types";

export type DirectoryAppProps = {
    initialDepartmentId?: string;
    initialPath?: string[];
    variant?: "full" | "embedded";
    showDepartments?: boolean;
    departmentsOverride?: RipplingDepartment[];
    onHeaderContentChange?: (content: React.ReactNode | null) => void;
};

export type FormState = {
    name: string;
    slug: string;
    iframeUrl: string;
    description: string;
};
