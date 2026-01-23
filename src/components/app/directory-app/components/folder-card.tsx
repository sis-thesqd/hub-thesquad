"use client";

import Link from "next/link";
import { Folder } from "@untitledui/icons";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import type { DirectoryEntry } from "@/utils/supabase/types";

type FolderCardProps = {
    entry: DirectoryEntry;
    path: string[];
    childCount: number;
};

export const FolderCard = ({ entry, path, childCount }: FolderCardProps) => {
    const appendUrlParams = useAppendUrlParams();
    const basePath = `/${entry.department_id}/${path.join("/")}`;
    const href = appendUrlParams(basePath);

    return (
        <Link
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
        >
            <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                {entry.emoji ? (
                    <span className="text-2xl">{entry.emoji}</span>
                ) : (
                    <Folder className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-primary">{entry.name}</p>
                <p className="mt-0.5 text-xs text-tertiary">
                    {childCount} {childCount === 1 ? "item" : "items"}
                </p>
            </div>
        </Link>
    );
};
