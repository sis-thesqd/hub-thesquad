"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NavigationPage, RipplingDepartment, ShConfig } from "@/utils/supabase/types";
import { supabaseFetch } from "@/utils/supabase/rest";
import { getIconByName } from "@/utils/icon-map";

interface HomeGridProps {
    departments: RipplingDepartment[];
}

export const HomeGrid = ({ departments }: HomeGridProps) => {
    const [navigationPages, setNavigationPages] = useState<NavigationPage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const data = await supabaseFetch<ShConfig<NavigationPage[]>[]>(
                    "sh_config?key=eq.navigation_pages&select=value"
                );
                if (data?.[0]?.value) {
                    setNavigationPages(data[0].value);
                }
            } catch (error) {
                console.error("Failed to load navigation config:", error);
            } finally {
                setIsLoading(false);
            }
        };

        void loadConfig();
    }, []);

    // Map navigation pages to departments
    const items = navigationPages.map((page) => {
        // Find matching department by comparing slugified name
        const department = departments.find((dept) => {
            const deptSlug = dept.name
                ?.toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
            return deptSlug === page.slug;
        });

        return {
            ...page,
            departmentId: department?.id,
            href: department ? `/${department.id}` : "#",
        };
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex h-[88px] animate-pulse items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4"
                    >
                        <div className="size-12 rounded-lg bg-secondary" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 rounded bg-secondary" />
                            <div className="h-3 w-16 rounded bg-secondary" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
                const Icon = getIconByName(item.icon);
                return (
                    <Link
                        key={item.slug}
                        href={item.href}
                        className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                    >
                        <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                            <Icon className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-primary">{item.title}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};
