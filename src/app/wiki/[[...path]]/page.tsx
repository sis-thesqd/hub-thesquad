"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy01, File02, Folder, InfoCircle, Lightbulb02, Star01 } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { WikiMarkdown } from "@/components/app/wiki/wiki-markdown";
import { WikiToc } from "@/components/app/wiki/wiki-toc";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { useAuth } from "@/providers/auth-provider";
import { useFavorites } from "@/hooks/use-favorites";
import { useDirectoryQueries } from "@/hooks/use-directory-queries";
import { useDepartmentItems } from "@/app/dashboard-17/hooks/use-department-items";
import { useCommandMenuHandler } from "@/app/dashboard-17/hooks/use-command-menu-handler";
import type { FileNode } from "@/utils/wiki/types";
import Link from "next/link";
import { EmbeddedFolderHeader } from "@/components/app/directory-app/components/embedded-folder-header";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";

const DirectoryCommandMenu = dynamic(
    () => import("@/components/app/directory-app/components/directory-command-menu").then((mod) => mod.DirectoryCommandMenu),
    { ssr: false },
);

export default function WikiPage() {
    const router = useRouter();
    const params = useParams();
    const { worker } = useAuth();
    const { departments, navigationPages, entries, frames, divisionOrder } = useDirectoryQueries();
    const { sidebarItems } = useDepartmentItems(departments, navigationPages, divisionOrder);
    const handleCommandMenuSelect = useCommandMenuHandler(entries, departments, navigationPages);
    const { toggleFavorite, isFavorite } = useFavorites({ userId: worker?.id });
    const clipboard = useClipboard();

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);
    const [tree, setTree] = useState<FileNode[]>([]);
    const [treeLoading, setTreeLoading] = useState(true);

    const pathSegments = (params.path as string[] | undefined) ?? [];
    const filePath = pathSegments.length ? pathSegments.join("/") : "";

    const docsFolderMap = useMemo(() => {
        return new Map(
            navigationPages
                .filter((page) => page.docs_folder)
                .map((page) => [page.docs_folder as string, page]),
        );
    }, [navigationPages]);

    const footerItems = useMemo(
        () => [
            {
                label: "Wiki",
                href: "/wiki",
                icon: Lightbulb02,
            },
        ],
        [],
    );

    useEffect(() => {
        const fetchTree = async () => {
            try {
                const response = await fetch("/api/docs/tree");
                const data = await response.json();
                setTree(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching docs tree:", err);
                setTree([]);
            } finally {
                setTreeLoading(false);
            }
        };

        fetchTree();
    }, []);

    const findNodeByPath = (nodes: FileNode[], path: string): FileNode | null => {
        for (const node of nodes) {
            if (node.path === path) return node;
            if (node.children?.length) {
                const match = findNodeByPath(node.children, path);
                if (match) return match;
            }
        }
        return null;
    };

    const activeNode = filePath ? findNodeByPath(tree, filePath) : null;
    const isFolder = activeNode?.type === "dir";

    useEffect(() => {
        const fetchContent = async () => {
            if (!filePath || isFolder || treeLoading) {
                setContent("");
                setLoading(false);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/docs/${filePath}`);
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.details || data?.error || "Failed to fetch document");
                }
                setContent(data.content ?? "");
            } catch (err) {
                console.error("Error fetching document:", err);
                setError(err instanceof Error ? err.message : "Failed to load document");
                setContent("# Error\n\nFailed to load the requested document.");
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [filePath, isFolder, treeLoading]);

    const isArticleFavorite = filePath ? isFavorite(undefined, undefined, filePath) : false;

    const topLevelFolders = tree.filter((node) => node.type === "dir");
    const topLevelFiles = tree.filter((node) => node.type === "file" && !/readme\\.md$/i.test(node.name));
    const folderItems: FileNode[] = isFolder
        ? (activeNode?.children ?? []).filter((node) => node.type === "dir" || !/readme\.md$/i.test(node.name))
        : [];

    const formatFolderLabel = (value: string) => {
        const title = value
            .replace(/\.md$/i, "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());

        return title
            .replace(/\bN8n\b/g, "N8N")
            .replace(/\bSisx\b/g, "SISX")
            .replace(/\bSis(\d+)\b/g, "SIS$1")
            .replace(/\bSis\b/g, "SIS")
            .replace(/\bPrf\b/g, "PRF");
    };

    const headerTitle = useMemo(() => {
        if (!filePath) return "Wiki";
        if (!activeNode) return "Wiki";
        if (activeNode.type === "dir") {
            return formatFolderLabel(activeNode.name);
        }
        return formatFolderLabel(activeNode.name.replace(/\.md$/i, ""));
    }, [activeNode, filePath]);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-primary lg:flex-row">
            <SidebarNavigationSlim
                hideBorder
                items={sidebarItems}
                footerItems={footerItems}
                onSearchClick={() => setCommandMenuOpen(true)}
            />

            <DirectoryCommandMenu
                isOpen={commandMenuOpen}
                onOpenChange={setCommandMenuOpen}
                departments={departments}
                entries={entries}
                frames={frames}
                navigationPages={navigationPages}
                onSelect={handleCommandMenuSelect}
            />

            <main className="min-w-0 flex-1 overflow-hidden lg:pt-2 lg:pl-1">
                <div className="flex h-full flex-col overflow-hidden border-secondary lg:rounded-tl-[24px] lg:border-t lg:border-l">
                    <header className="flex flex-col gap-4 border-secondary bg-primary px-4 py-4 lg:flex-row lg:items-center lg:px-8">
                        {filePath ? (
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex size-8 items-center justify-center rounded-md text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary"
                                    title="Go back"
                                >
                                    <ArrowLeft className="size-5" />
                                </button>
                                <p className="text-lg font-semibold text-primary">{headerTitle}</p>
                            </div>
                        ) : (
                            <h1 className="text-lg font-semibold text-primary">Wiki</h1>
                        )}

                        {filePath && activeNode?.type === "dir" ? (
                            <div className="ml-auto">
                                <EmbeddedFolderHeader
                                    showEditButton
                                    onEditFolder={() => {}}
                                    onNewFolder={() => {}}
                                    onNewPage={() => {}}
                                    isFavorite={isArticleFavorite}
                                    onToggleFavorite={() => toggleFavorite(undefined, undefined, filePath)}
                                />
                            </div>
                        ) : filePath && activeNode?.type === "file" ? (
                            <div className="ml-auto flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleFavorite(undefined, undefined, filePath)}
                                    className={cx(
                                        "flex size-8 cursor-pointer items-center justify-center rounded-md transition hover:bg-secondary",
                                        isArticleFavorite ? "text-warning-primary" : "text-fg-quaternary"
                                    )}
                                    title={isArticleFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                    <Star01 className={cx("size-5", isArticleFavorite && "fill-warning-primary")} />
                                </button>
                                <button
                                    type="button"
                                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-fg-quaternary transition hover:bg-secondary"
                                    title="Article info"
                                    onClick={() => clipboard.copy(filePath, "path")}
                                >
                                    <InfoCircle className="size-5" />
                                </button>
                                <Dropdown.Root>
                                    <Button size="sm" color="primary">
                                        Actions
                                    </Button>
                                    <Dropdown.Popover>
                                        <Dropdown.Menu>
                                            <Dropdown.Item
                                                icon={Copy01}
                                                onAction={() => {
                                                    if (typeof window !== "undefined") {
                                                        clipboard.copy(`${window.location.origin}/wiki/${filePath}`, "link");
                                                    }
                                                }}
                                            >
                                                Copy link
                                            </Dropdown.Item>
                                            <Dropdown.Item
                                                icon={Copy01}
                                                onAction={() => clipboard.copy(filePath, "path")}
                                            >
                                                Copy path
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown.Popover>
                                </Dropdown.Root>
                            </div>
                        ) : null}
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
                        {treeLoading ? (
                            <p className="text-sm text-tertiary">Loading documentation...</p>
                        ) : isFolder || !filePath ? (
                            <div className="space-y-8">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {(filePath ? folderItems : topLevelFolders).map((node) => {
                                        const mappedPage = docsFolderMap.get(node.path);
                                        const Icon = node.type === "file" ? File02 : Folder;
                                        return (
                                            <Link
                                                key={node.path}
                                                href={`/wiki/${node.path}`}
                                            className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                                        >
                                            <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                                                <Icon className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium text-primary">
                                                    {mappedPage?.title ?? formatFolderLabel(node.name)}
                                                </p>
                                            </div>
                                        </Link>
                                        );
                                    })}
                                </div>

                                {!filePath && topLevelFiles.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-tertiary">
                                            Articles
                                        </h3>
                                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {topLevelFiles.map((node) => (
                                                <Link
                                                    key={node.path}
                                                    href={`/wiki/${node.path}`}
                                                    className="group flex items-center gap-3 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                                                >
                                                    <File02 className="size-5 text-fg-tertiary group-hover:text-brand-secondary" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-primary">
                                                            {node.name.replace(/\\.md$/, "")}
                                                        </p>
                                                        <p className="truncate text-xs text-tertiary">{node.path}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : loading ? (
                            <p className="text-sm text-tertiary">Loading article...</p>
                        ) : error ? (
                            <div className="rounded-lg border border-error_subtle bg-error_subtle/30 p-4">
                                <p className="text-sm text-fg-error-secondary">{error}</p>
                            </div>
                        ) : (
                            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-8">
                                <WikiMarkdown content={content} />
                                <div className="mt-10 hidden lg:block">
                                    <WikiToc content={content} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
