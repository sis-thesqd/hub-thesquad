export type RipplingDepartment = {
    id: string;
    name: string | null;
};

export type DirectoryEntryType = "frame" | "folder" | "article";

export type DirectoryEntry = {
    id: string;
    department_id: string;
    parent_id: string | null;
    frame_id: string | null;
    name: string;
    slug: string;
    sort_order: number | null;
    emoji: string | null;
    type?: DirectoryEntryType;
    created_by?: string | null;
    updated_by?: string | null;
};

export type Frame = {
    id: string;
    name: string;
    iframe_url: string;
    description: string | null;
    department_ids: string[];
    created_at?: string;
    updated_at?: string;
    created_by?: string | null;
    updated_by?: string | null;
};

export type DirectoryPlacement = {
    id: string;
    parent_id: string | null;
};

export type NavigationPage = {
    department_id: string;
    slug: string;
    title: string;
    icon: string;
    division?: string;
};

export type ShConfig<T = unknown> = {
    id: string;
    key: string;
    value: T;
    created_at: string;
    updated_at: string;
};

export type ShFavorite = {
    id: string;
    user_id: string;
    entry_id: string | null;
    department_id: string | null;
    article_path?: string | null;
    created_at: string;
};
