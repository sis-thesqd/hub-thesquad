"use client";

import Link from "next/link";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { Badge } from "@/components/base/badges/badges";
import type { NavigationPage, RipplingDepartment } from "@/utils/supabase/types";
import { getIconByName } from "@/utils/icon-map";

interface HomeGridProps {
    departments: RipplingDepartment[];
    navigationPages: NavigationPage[];
    userDepartmentId: string | null;
}

export const HomeGrid = ({ departments, navigationPages, userDepartmentId }: HomeGridProps) => {
    const appendUrlParams = useAppendUrlParams();

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

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
                const Icon = getIconByName(item.icon);
                const href = item.href !== "#" ? appendUrlParams(item.href) : item.href;
                const isUserDepartment = item.departmentId === userDepartmentId;
                return (
                    <Link
                        key={item.slug}
                        href={href}
                        className="group flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
                    >
                        <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                            <Icon className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-primary">{item.title}</p>
                                {isUserDepartment && (
                                    <Badge size="sm" color="brand" type="pill-color">
                                        Your team
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};
