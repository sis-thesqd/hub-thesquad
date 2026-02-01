"use client";

import Link from "next/link";
import { ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface WikiBreadcrumbProps {
    path: string;
    className?: string;
}

const formatSegment = (segment: string) =>
    segment
        .replace(/\.md$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

export const WikiBreadcrumb = ({ path, className }: WikiBreadcrumbProps) => {
    const segments = path.split("/").filter(Boolean);

    return (
        <nav className={cx("flex flex-wrap items-center gap-1 text-sm text-tertiary", className)} aria-label="Wiki breadcrumb">
            <Link href="/wiki" className="transition hover:text-secondary">
                Wiki
            </Link>
            {segments.map((segment, index) => {
                const href = `/wiki/${segments.slice(0, index + 1).join("/")}`;
                const isLast = index === segments.length - 1;
                const label = formatSegment(segment);

                return (
                    <span key={`${segment}-${index}`} className="flex items-center gap-1">
                        <ChevronRight className="size-3.5 text-fg-quaternary" />
                        {isLast ? (
                            <span className="text-secondary">{label}</span>
                        ) : (
                            <Link href={href} className="transition hover:text-secondary">
                                {label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
};
