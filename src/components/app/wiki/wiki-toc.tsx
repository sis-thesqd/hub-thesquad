"use client";

import { useMemo } from "react";
import { cx } from "@/utils/cx";
import { slugify } from "@/utils/slugify";

type TocItem = {
    id: string;
    level: number;
    text: string;
};

interface WikiTocProps {
    content: string;
    className?: string;
}

const buildToc = (content: string): TocItem[] => {
    const lines = content.split("\n");
    const items: TocItem[] = [];
    const counts = new Map<string, number>();

    for (const line of lines) {
        const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
        if (!match) continue;
        const level = match[1].length;
        const text = match[2].replace(/\s+#\s*$/, "").trim();
        if (!text) continue;

        const base = slugify(text);
        const count = counts.get(base) ?? 0;
        const id = count === 0 ? base : `${base}-${count}`;
        counts.set(base, count + 1);

        items.push({ id, level, text });
    }

    return items;
};

export const WikiToc = ({ content, className }: WikiTocProps) => {
    const items = useMemo(() => buildToc(content), [content]);

    if (!items.length) return null;

    return (
        <aside className={cx("sticky top-6", className)}>
            <div className="rounded-2xl border border-secondary_alt bg-primary p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-tertiary">On this page</p>
                <div className="mt-3 flex flex-col gap-2">
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={cx(
                                "text-sm text-secondary transition hover:text-secondary_hover",
                                item.level === 3 && "pl-3 text-tertiary",
                            )}
                        >
                            {item.text}
                        </a>
                    ))}
                </div>
            </div>
        </aside>
    );
};
