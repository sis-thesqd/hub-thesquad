"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { FolderClosed } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { DirectoryApp } from "@/components/app/directory-app";
import type { NavigationPage, RipplingDepartment, ShConfig } from "@/utils/supabase/types";
import { supabaseFetch } from "@/utils/supabase/rest";
import { getIconByName } from "@/utils/icon-map";
import { HomeGrid } from "./components/home-grid";

interface Dashboard17Props {
    initialDepartmentId?: string;
    initialPath?: string[];
}

export const Dashboard17 = ({ initialDepartmentId, initialPath }: Dashboard17Props) => {
    const router = useRouter();
    const [departments, setDepartments] = useState<RipplingDepartment[]>([]);
    const [navigationPages, setNavigationPages] = useState<NavigationPage[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId ?? "");
    const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);

    const isHomePage = !initialDepartmentId;

    useEffect(() => {
        setSelectedDepartmentId(initialDepartmentId ?? "");
    }, [initialDepartmentId]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                // Load departments and navigation config in parallel
                const [deptData, configData] = await Promise.all([
                    supabaseFetch<RipplingDepartment[]>("rippling_departments?select=id,name&order=name.asc"),
                    supabaseFetch<ShConfig<NavigationPage[]>[]>("sh_config?key=eq.navigation_pages&select=value"),
                ]);
                
                if (!isMounted) return;
                setDepartments(deptData);
                
                if (configData?.[0]?.value) {
                    setNavigationPages(configData[0].value);
                }
            } catch {
                if (!isMounted) return;
                setDepartments([]);
            }
        };

        void loadData();

        return () => {
            isMounted = false;
        };
    }, [router, initialDepartmentId]);

    const departmentItems = useMemo(() => {
        // Map navigation pages to departments
        return navigationPages.map((page) => {
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
                label: page.title,
                href: department ? `/${department.id}` : "#",
                icon: getIconByName(page.icon, FolderClosed),
            };
        }).filter((item) => item.href !== "#");
    }, [departments, navigationPages]);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-primary lg:flex-row">
            <SidebarNavigationSlim
                hideBorder
                activeUrl={selectedDepartmentId ? `/${selectedDepartmentId}` : undefined}
                items={departmentItems}
            />
            <main className="min-w-0 flex-1 overflow-hidden lg:pt-2 lg:pl-1">
                <div className="flex h-full flex-col gap-8 overflow-hidden border-secondary pt-8 pb-12 lg:rounded-tl-[24px] lg:border-t lg:border-l">
                    <div className="flex flex-col justify-between gap-4 px-4 lg:flex-row lg:px-8">
                        {headerContent || (
                            <p className="text-xl font-semibold text-primary lg:text-display-xs">
                                {isHomePage ? "Departments" : "Department directory"}
                            </p>
                        )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto px-4 lg:px-8">
                        {isHomePage ? (
                            <HomeGrid departments={departments} />
                        ) : (
                            <DirectoryApp
                                initialDepartmentId={selectedDepartmentId || initialDepartmentId}
                                initialPath={initialPath}
                                variant="embedded"
                                showDepartments={false}
                                departmentsOverride={departments}
                                onHeaderContentChange={setHeaderContent}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
