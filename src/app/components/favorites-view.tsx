"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Star01 } from "@untitledui/icons";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { FolderCard, PageCard } from "@/components/app/directory-app/components";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import type { DirectoryEntry, Frame, NavigationPage, RipplingDepartment, ShFavorite } from "@/utils/supabase/types";
import { getIconByName } from "@/utils/icon-map";
import { cx } from "@/utils/cx";

interface FavoritesViewProps {
    favorites: ShFavorite[];
    entries: DirectoryEntry[];
    frames: Frame[];
    departments: RipplingDepartment[];
    navigationPages: NavigationPage[];
    onToggleFavorite: (entryId?: string, departmentId?: string) => void;
}

// Build path segments from entry to root
const buildPathToRoot = (
    entriesById: Map<string, DirectoryEntry>,
    entry: DirectoryEntry
): string[] => {
    const pathParts: string[] = [entry.slug];
    let currentParentId = entry.parent_id;

    while (currentParentId) {
        const parent = entriesById.get(currentParentId);
        if (parent) {
            pathParts.unshift(parent.slug);
            currentParentId = parent.parent_id;
        } else {
            break;
        }
    }

    return pathParts;
};

export const FavoritesView = ({
    favorites,
    entries,
    frames,
    departments,
    navigationPages,
    onToggleFavorite,
}: FavoritesViewProps) => {
    const appendUrlParams = useAppendUrlParams();

    const { favoriteDepartments, favoriteFolders, favoritePages } = useMemo(() => {
        const entriesById = new Map(entries.map((e) => [e.id, e]));
        const framesById = new Map(frames.map((f) => [f.id, f]));

        const deptFavorites: Array<{
            id: string;
            department: RipplingDepartment;
            navPage: NavigationPage | undefined;
        }> = [];
        const folderFavorites: Array<{
            entry: DirectoryEntry;
            path: string[];
            childCount: number;
        }> = [];
        const pageFavorites: Array<{
            entry: DirectoryEntry;
            path: string[];
            frame: Frame | null;
        }> = [];

        for (const fav of favorites) {
            if (fav.department_id) {
                const dept = departments.find((d) => d.id === fav.department_id);
                if (dept) {
                    const deptSlug = dept.name
                        ?.toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "");
                    const navPage = navigationPages.find((p) => p.slug === deptSlug);
                    deptFavorites.push({ id: fav.department_id, department: dept, navPage });
                }
            } else if (fav.entry_id) {
                const entry = entriesById.get(fav.entry_id);
                if (entry) {
                    const path = buildPathToRoot(entriesById, entry);
                    if (entry.frame_id) {
                        const frame = framesById.get(entry.frame_id) ?? null;
                        pageFavorites.push({ entry, path, frame });
                    } else {
                        const childCount = entries.filter((e) => e.parent_id === entry.id).length;
                        folderFavorites.push({ entry, path, childCount });
                    }
                }
            }
        }

        return {
            favoriteDepartments: deptFavorites,
            favoriteFolders: folderFavorites,
            favoritePages: pageFavorites,
        };
    }, [favorites, entries, frames, departments, navigationPages]);

    const hasNoFavorites =
        favoriteDepartments.length === 0 &&
        favoriteFolders.length === 0 &&
        favoritePages.length === 0;

    if (hasNoFavorites) {
        return (
            <div className="flex h-full min-h-[400px] items-center justify-center">
                <EmptyState size="md">
                    <EmptyState.Header>
                        <EmptyState.FeaturedIcon color="gray" icon={Star01} />
                    </EmptyState.Header>

                    <EmptyState.Content>
                        <EmptyState.Title>No favorites yet</EmptyState.Title>
                        <EmptyState.Description>
                            Star departments, folders, and pages to quickly access them here.
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Favorite Departments */}
            {favoriteDepartments.length > 0 && (
                <div>
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        Departments
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {favoriteDepartments.map(({ id, department, navPage }) => {
                            const Icon = navPage ? getIconByName(navPage.icon) : Star01;
                            const href = appendUrlParams(`/${id}`);
                            return (
                                <Link
                                    key={id}
                                    href={href}
                                    className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                                >
                                    <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                                        <Icon className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-primary">
                                            {navPage?.title ?? department.name}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onToggleFavorite(undefined, id);
                                        }}
                                        className="flex size-8 cursor-pointer items-center justify-center rounded-md text-warning-primary transition hover:bg-secondary"
                                        title="Remove from favorites"
                                    >
                                        <Star01 className="size-4 fill-warning-primary" />
                                    </button>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Favorite Folders */}
            {favoriteFolders.length > 0 && (
                <div>
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        Folders
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {favoriteFolders.map(({ entry, path, childCount }) => (
                            <FolderCard
                                key={entry.id}
                                entry={entry}
                                path={path}
                                childCount={childCount}
                                isFavorite
                                onToggleFavorite={() => onToggleFavorite(entry.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Favorite Pages */}
            {favoritePages.length > 0 && (
                <div>
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        Pages
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {favoritePages.map(({ entry, path, frame }) => (
                            <PageCard
                                key={entry.id}
                                entry={entry}
                                path={path}
                                frame={frame}
                                isFavorite
                                onToggleFavorite={() => onToggleFavorite(entry.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
