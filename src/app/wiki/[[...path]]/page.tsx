"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Lightbulb02, Star01 } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { WikiBreadcrumb } from "@/components/app/wiki/wiki-breadcrumb";
import { WikiSearch } from "@/components/app/wiki/wiki-search";
import { WikiMarkdown } from "@/components/app/wiki/wiki-markdown";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useAuth } from "@/providers/auth-provider";
import { useFavorites } from "@/hooks/use-favorites";
import { useDirectoryQueries } from "@/hooks/use-directory-queries";
import { useDepartmentItems } from "@/app/dashboard-17/hooks/use-department-items";
import { useCommandMenuHandler } from "@/app/dashboard-17/hooks/use-command-menu-handler";
import type { FileNode } from "@/utils/wiki/types";
import Link from "next/link";

const DirectoryCommandMenu = dynamic(
    () => import("@/components/app/directory-app/components/directory-command-menu").then((mod) => mod.DirectoryCommandMenu),
    { ssr: false },
);

export default function WikiPage() {
    const params = useParams();
    const { worker } = useAuth();
    const { departments, navigationPages, entries, frames, divisionOrder } = useDirectoryQueries();
    const { sidebarItems } = useDepartmentItems(departments, navigationPages, divisionOrder);
    const handleCommandMenuSelect = useCommandMenuHandler(entries, departments, navigationPages);
    const { toggleFavorite, isFavorite } = useFavorites({ userId: worker?.id });

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);
    const [tree, setTree] = useState<FileNode[]>([]);
    const [treeLoading, setTreeLoading] = useState(true);

    const pathSegments = (params.path as string[] | undefined) ?? [];
    const filePath = pathSegments.length ? pathSegments.join("/") : "";

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

    const findNodeByPath = (nodes: typeof tree, path: string) => {
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
    const topLevelFiles = tree.filter((node) => node.type === "file");
    const folderItems = isFolder ? activeNode?.children ?? [] : [];

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
                    <header className="flex flex-wrap items-center gap-3 border-secondary bg-primary px-4 py-4 lg:px-8">
                        <WikiBreadcrumb path={filePath} className="flex-1" />
                        <div className="w-full max-w-sm">
                            <WikiSearch />
                        </div>
                        {filePath && (
                            <ButtonUtility
                                tooltip={isArticleFavorite ? "Remove from favorites" : "Add to favorites"}
                                icon={<Star01 className={isArticleFavorite ? "fill-warning-primary text-warning-primary" : ""} />}
                                color="secondary"
                                onClick={() => toggleFavorite(undefined, undefined, filePath)}
                            />
                        )}
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
                        {treeLoading ? (
                            <p className="text-sm text-tertiary">Loading documentation...</p>
                        ) : isFolder || !filePath ? (
                            <div className="space-y-8">
                                {!filePath && (
                                    <div>
                                        <h2 className="text-lg font-semibold text-primary">Top-level folders</h2>
                                        <p className="mt-1 text-sm text-tertiary">
                                            Choose a section to browse documentation.
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {(filePath ? folderItems : topLevelFolders).map((node) => (
                                        <Link
                                            key={node.path}
                                            href={`/wiki/${node.path}`}
                                            className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                                        >
                                            <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                                                <Lightbulb02 className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium text-primary">{node.name}</p>
                                                <p className="truncate text-xs text-tertiary">{node.path}</p>
                                            </div>
                                        </Link>
                                    ))}
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
                                                    <Lightbulb02 className="size-5 text-fg-tertiary group-hover:text-brand-secondary" />
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
                            <WikiMarkdown content={content} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
