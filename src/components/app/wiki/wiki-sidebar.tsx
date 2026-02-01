"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, File02, FolderClosed } from "@untitledui/icons";
import type { FileNode } from "@/utils/wiki/types";
import { cx } from "@/utils/cx";

interface WikiSidebarProps {
    activePath: string;
    className?: string;
}

const buildExpandedFromPath = (path: string) => {
    const segments = path.split("/").filter(Boolean);
    const expanded = new Set<string>();
    let current = "";
    segments.slice(0, -1).forEach((segment) => {
        current = current ? `${current}/${segment}` : segment;
        expanded.add(current);
    });
    return expanded;
};

export const WikiSidebar = ({ activePath, className }: WikiSidebarProps) => {
    const [tree, setTree] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchTree = async () => {
            try {
                const res = await fetch("/api/docs/tree");
                const data = await res.json();
                setTree(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch docs tree:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTree();
    }, []);

    useEffect(() => {
        if (!activePath) return;
        setExpandedFolders(buildExpandedFromPath(activePath));
    }, [activePath]);

    const toggleFolder = (path: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const renderTree = (nodes: FileNode[], level = 0) => {
        return nodes.map((node) => {
            const padding = level === 0 ? "pl-3" : "pl-6";
            if (node.type === "dir") {
                const isExpanded = expandedFolders.has(node.path);
                const Icon = FolderClosed;
                return (
                    <div key={node.path} className="space-y-1">
                        <button
                            type="button"
                            onClick={() => toggleFolder(node.path)}
                            className={cx(
                                "flex w-full items-center justify-between rounded-md py-1 text-left text-sm text-secondary transition hover:bg-primary_hover",
                                padding,
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Icon className="size-4 text-fg-quaternary" />
                                {node.name}
                            </span>
                            <ChevronDown className={cx("size-4 text-fg-quaternary transition", isExpanded && "rotate-180")} />
                        </button>
                        {isExpanded && node.children && (
                            <div className="space-y-1">
                                {renderTree(node.children, level + 1)}
                            </div>
                        )}
                    </div>
                );
            }

            const isActive = activePath === node.path;
            return (
                <Link
                    key={node.path}
                    href={`/wiki/${node.path}`}
                    className={cx(
                        "flex items-center gap-2 rounded-md py-1 text-sm transition",
                        padding,
                        isActive ? "bg-active text-secondary_hover" : "text-secondary hover:bg-primary_hover",
                    )}
                >
                    <File02 className="size-4 text-fg-quaternary" />
                    <span className="truncate">{node.name.replace(/\\.md$/, "")}</span>
                </Link>
            );
        });
    };

    const content = useMemo(() => {
        if (loading) {
            return (
                <div className="px-3 py-4 text-sm text-tertiary">
                    Loading documentation...
                </div>
            );
        }
        if (!tree.length) {
            return (
                <div className="px-3 py-4 text-sm text-tertiary">
                    No documentation found.
                </div>
            );
        }
        return <div className="space-y-1">{renderTree(tree)}</div>;
    }, [loading, tree, expandedFolders, activePath]);

    return (
        <div className={cx("h-full overflow-y-auto py-3", className)}>
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Wiki
            </div>
            <div className="mt-2 space-y-1">
                {content}
            </div>
        </div>
    );
};
