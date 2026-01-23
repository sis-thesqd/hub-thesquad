"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileCode01 } from "@untitledui/icons";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";

type PageCardProps = {
    entry: DirectoryEntry;
    path: string[];
    frame: Frame | null;
};

export const PageCard = ({ entry, path, frame }: PageCardProps) => {
    const searchParams = useSearchParams();
    const basePath = `/${entry.department_id}/${path.join("/")}`;
    const queryString = searchParams.toString();
    const href = queryString ? `${basePath}?${queryString}` : basePath;

    return (
        <Link
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
        >
            <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                {entry.emoji ? (
                    <span className="text-2xl">{entry.emoji}</span>
                ) : (
                    <FileCode01 className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-primary">{entry.name}</p>
                {frame?.description && (
                    <p className="mt-0.5 truncate text-xs text-tertiary">
                        {frame.description}
                    </p>
                )}
            </div>
        </Link>
    );
};
