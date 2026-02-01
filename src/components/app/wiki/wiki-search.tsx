"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { File02, SearchLg } from "@untitledui/icons";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

type SearchResult = {
    name: string;
    path: string;
    type: "file" | "dir";
    snippet?: string;
};

interface WikiSearchProps {
    className?: string;
}

export const WikiSearch = ({ className }: WikiSearchProps) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                setOpen((prev) => !prev);
            }
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.results || []);
            } catch (error) {
                console.error("Wiki search failed:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    const hasResults = results.length > 0;
    const emptyState = !loading && !hasResults && query.trim().length > 0;

    return (
        <>
            <Input
                aria-label="Search wiki"
                size="sm"
                icon={SearchLg}
                placeholder="Search wiki..."
                shortcut
                isReadOnly
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                className={className}
            />

            <DialogTrigger isOpen={open} onOpenChange={setOpen}>
                <button type="button" className="hidden" />
                <ModalOverlay>
                    <Modal className="max-w-2xl">
                        <Dialog className="w-full">
                            <div className="w-full rounded-2xl bg-primary p-5 shadow-xl ring-1 ring-secondary_alt">
                                <div className="flex items-center gap-3">
                                    <Input
                                        aria-label="Search wiki"
                                        size="md"
                                        icon={SearchLg}
                                        placeholder="Search documentation..."
                                        value={query}
                                        onChange={setQuery}
                                        autoFocus
                                    />
                                </div>

                                <div className="mt-4 max-h-[420px] overflow-y-auto">
                                    {loading && (
                                        <div className="px-3 py-6 text-center text-sm text-tertiary">
                                            Searching...
                                        </div>
                                    )}
                                    {emptyState && (
                                        <div className="px-3 py-6 text-center text-sm text-tertiary">
                                            No results found.
                                        </div>
                                    )}
                                    {hasResults && (
                                        <div className="flex flex-col gap-1">
                                            {results.map((result) => (
                                                <Link
                                                    key={result.path}
                                                    href={`/wiki/${result.path}`}
                                                    onClick={() => setOpen(false)}
                                                    className={cx(
                                                        "group flex items-start gap-3 rounded-lg px-3 py-2 transition hover:bg-primary_hover",
                                                    )}
                                                >
                                                    <File02 className="mt-0.5 size-5 shrink-0 text-fg-quaternary group-hover:text-fg-secondary" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-primary">
                                                            {result.name.replace(/\.md$/, "")}
                                                        </p>
                                                        <p className="truncate text-xs text-tertiary">{result.path}</p>
                                                        {result.snippet && (
                                                            <p className="mt-1 line-clamp-2 text-xs text-tertiary">
                                                                {result.snippet}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>
        </>
    );
};
