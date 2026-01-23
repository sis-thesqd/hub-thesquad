"use client";

import type { MouseEvent } from "react";
import { Star01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface FavoriteButtonProps {
    isFavorite: boolean;
    onToggle: () => void;
    className?: string;
}

export const FavoriteButton = ({ isFavorite, onToggle, className }: FavoriteButtonProps) => {
    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cx(
                "flex size-8 cursor-pointer items-center justify-center rounded-md transition hover:bg-secondary",
                isFavorite ? "text-warning-primary" : "text-fg-quaternary opacity-0 group-hover:opacity-100",
                className
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
            <Star01
                className={cx("size-4", isFavorite && "fill-warning-primary")}
            />
        </button>
    );
};
