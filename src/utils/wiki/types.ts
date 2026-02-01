export type FileNode = {
    name: string;
    path: string;
    type: "file" | "dir";
    children?: FileNode[];
    sha?: string;
};

export type DocFile = {
    path: string;
    content: string;
    sha: string;
};
