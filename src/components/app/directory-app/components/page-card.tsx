"use client";

import Link from "next/link";
import { FileCode01, Star01 } from "@untitledui/icons";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";
import { FavoriteButton } from "./favorite-button";

type PageCardProps = {
    entry: DirectoryEntry;
    path: string[];
    frame: Frame | null;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
};

export const PageCard = ({ entry, path, frame, isFavorite = false, onToggleFavorite }: PageCardProps) => {
    const appendUrlParams = useAppendUrlParams();
    const basePath = `/${entry.department_id}/${path.join("/")}`;
    const href = appendUrlParams(basePath);

    return (
        <Link
            href={href}
            className="group relative flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
        >
            {isFavorite && !onToggleFavorite && (
                <div className="absolute top-2 right-2">
                    <Star01 className="size-4 fill-warning-primary text-warning-primary" />
                </div>
            )}
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
            {onToggleFavorite && (
                <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
            )}
        </Link>
    );
};
