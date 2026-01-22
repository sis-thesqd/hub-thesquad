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
