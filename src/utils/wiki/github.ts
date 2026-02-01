import type { DocFile, FileNode } from "@/utils/wiki/types";

const owner = process.env.GITHUB_OWNER || "sis-thesqd";
const repo = process.env.GITHUB_REPO || "squad-wiki";
const branch = process.env.GITHUB_BRANCH || "main";
const token = process.env.GITHUB_TOKEN;

type GitHubTreeItem = {
    path?: string;
    type?: "blob" | "tree";
    sha?: string;
};

const githubFetch = async <T>(path: string): Promise<T> => {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`https://api.github.com${path}`, {
        headers,
    });

    if (!response.ok) {
        let message = "";
        try {
            const data = await response.json();
            message = typeof data?.message === "string" ? data.message : JSON.stringify(data);
        } catch {
            message = await response.text();
        }
        throw new Error(`GitHub API error (${response.status}): ${message}`);
    }

    return response.json() as Promise<T>;
};

const buildTree = (items: GitHubTreeItem[]): FileNode[] => {
    const root: FileNode[] = [];
    const lookup: Record<string, FileNode> = {};

    const sorted = [...items].sort((a, b) => {
        const aDepth = (a.path ?? "").split("/").length;
        const bDepth = (b.path ?? "").split("/").length;
        return aDepth - bDepth;
    });

    sorted.forEach((item) => {
        if (!item.path || !item.type) return;
        const parts = item.path.split("/");
        const name = parts[parts.length - 1];
        const node: FileNode = {
            name,
            path: item.path,
            type: item.type === "tree" ? "dir" : "file",
            sha: item.sha,
            children: item.type === "tree" ? [] : undefined,
        };

        lookup[item.path] = node;

        if (parts.length === 1) {
            root.push(node);
        } else {
            const parentPath = parts.slice(0, -1).join("/");
            const parent = lookup[parentPath];
            if (parent?.children) {
                parent.children.push(node);
            }
        }
    });

    return root;
};

export const getRepoTree = async (): Promise<FileNode[]> => {
    const data = await githubFetch<{ tree: GitHubTreeItem[] }>(
        `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    );

    const mdFiles = data.tree.filter(
        (item) =>
            item.type === "tree" ||
            (item.type === "blob" && item.path?.endsWith(".md")),
    );

    return buildTree(mdFiles);
};

export const getFileContent = async (path: string): Promise<DocFile> => {
    const encodedPath = path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
    const data = await githubFetch<{
        content?: string;
        sha?: string;
        type?: string;
    }>(`/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`);

    if (data.type !== "file" || !data.content) {
        throw new Error("Not a file");
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return {
        path,
        content,
        sha: data.sha ?? "",
    };
};

export const searchFiles = async (query: string): Promise<FileNode[]> => {
    const tree = await getRepoTree();
    const results: FileNode[] = [];

    const searchNodes = (nodes: FileNode[]) => {
        nodes.forEach((node) => {
            if (node.type === "file" && node.name.toLowerCase().includes(query.toLowerCase())) {
                results.push(node);
            }
            if (node.children?.length) {
                searchNodes(node.children);
            }
        });
    };

    searchNodes(tree);
    return results;
};

export const getAllMarkdownFiles = async (): Promise<FileNode[]> => {
    const tree = await getRepoTree();
    const files: FileNode[] = [];

    const collectFiles = (nodes: FileNode[]) => {
        nodes.forEach((node) => {
            if (node.type === "file") {
                files.push(node);
            }
            if (node.children?.length) {
                collectFiles(node.children);
            }
        });
    };

    collectFiles(tree);
    return files;
};
