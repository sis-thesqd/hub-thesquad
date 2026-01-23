export type RipplingDepartment = {
    id: string;
    name: string | null;
};

export type DirectoryEntry = {
    id: string;
    department_id: string;
    parent_id: string | null;
    frame_id: string | null;
    name: string;
    slug: string;
    sort_order: number | null;
    emoji: string | null;
};

export type Frame = {
    id: string;
    name: string;
    iframe_url: string;
    description: string | null;
    department_ids: string[];
};

export type DirectoryPlacement = {
    id: string;
    parent_id: string | null;
};

export type NavigationPage = {
    slug: string;
    title: string;
    icon: string;
};

export type ShConfig<T = unknown> = {
    id: string;
    key: string;
    value: T;
    created_at: string;
    updated_at: string;
};
