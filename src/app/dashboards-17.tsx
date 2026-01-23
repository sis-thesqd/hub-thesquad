"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderClosed } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { DirectoryApp } from "@/components/app/directory-app";
import { DirectoryCommandMenu } from "@/components/app/directory-app/components/directory-command-menu";
import type { DirectoryEntry, Frame, NavigationPage, RipplingDepartment, ShConfig } from "@/utils/supabase/types";
import { supabaseFetch } from "@/utils/supabase/rest";
import { getIconByName } from "@/utils/icon-map";
import { useAuth } from "@/providers/auth-provider";
import { HomeGrid } from "./components/home-grid";

interface Dashboard17Props {
    initialDepartmentId?: string;
    initialPath?: string[];
}

export const Dashboard17 = ({ initialDepartmentId, initialPath }: Dashboard17Props) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { worker } = useAuth();
    const [departments, setDepartments] = useState<RipplingDepartment[]>([]);
    const [navigationPages, setNavigationPages] = useState<NavigationPage[]>([]);
    const [entries, setEntries] = useState<DirectoryEntry[]>([]);
    const [frames, setFrames] = useState<Frame[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId ?? "");
    const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);

    const isHomePage = !initialDepartmentId;
    const firstName = worker?.preferred_given_name || worker?.given_name || "there";

    useEffect(() => {
        setSelectedDepartmentId(initialDepartmentId ?? "");
    }, [initialDepartmentId]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                // Load departments, navigation config, entries, and frames in parallel
                const [deptData, configData, entriesData, framesData] = await Promise.all([
                    supabaseFetch<RipplingDepartment[]>("rippling_departments?select=id,name&order=name.asc"),
                    supabaseFetch<ShConfig<NavigationPage[]>[]>("sh_config?key=eq.navigation_pages&select=value"),
                    supabaseFetch<DirectoryEntry[]>("sh_directory?select=id,department_id,parent_id,frame_id,name,slug,sort_order,emoji&order=name.asc"),
                    supabaseFetch<Frame[]>("sh_frames?select=id,name,description,iframe_url,department_ids&order=name.asc"),
                ]);

                if (!isMounted) return;
                setDepartments(deptData);
                setEntries(entriesData);
                setFrames(framesData);

                if (configData?.[0]?.value) {
                    setNavigationPages(configData[0].value);
                }
            } catch {
                if (!isMounted) return;
                setDepartments([]);
                setEntries([]);
                setFrames([]);
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

    const handleCommandMenuSelect = useCallback((type: "department" | "folder" | "page", id: string) => {
        const queryString = searchParams.toString();
        const appendQuery = (path: string) => queryString ? `${path}?${queryString}` : path;

        if (type === "department") {
            router.push(appendQuery(`/${id}`));
        } else if (type === "folder") {
            // Find the folder to get its department and build the path
            const folder = entries.find((e) => e.id === id);
            if (folder) {
                // Build path from folder to root
                const pathParts: string[] = [folder.slug];
                let currentParentId = folder.parent_id;
                while (currentParentId) {
                    const parent = entries.find((e) => e.id === currentParentId);
                    if (parent) {
                        pathParts.unshift(parent.slug);
                        currentParentId = parent.parent_id;
                    } else {
                        break;
                    }
                }
                router.push(appendQuery(`/${folder.department_id}/${pathParts.join("/")}`));
            }
        } else if (type === "page") {
            // Find the frame and its entry to navigate
            const frame = frames.find((f) => f.id === id);
            const entry = entries.find((e) => e.frame_id === id);
            if (frame && entry) {
                // Build path from entry to root
                const pathParts: string[] = [entry.slug];
                let currentParentId = entry.parent_id;
                while (currentParentId) {
                    const parent = entries.find((e) => e.id === currentParentId);
                    if (parent) {
                        pathParts.unshift(parent.slug);
                        currentParentId = parent.parent_id;
                    } else {
                        break;
                    }
                }
                router.push(appendQuery(`/${entry.department_id}/${pathParts.join("/")}`));
            }
        }
    }, [entries, frames, router, searchParams]);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-primary lg:flex-row">
            <SidebarNavigationSlim
                hideBorder
                activeUrl={selectedDepartmentId ? `/${selectedDepartmentId}` : undefined}
                items={departmentItems}
                onSearchClick={() => setCommandMenuOpen(true)}
            />

            <DirectoryCommandMenu
                isOpen={commandMenuOpen}
                onOpenChange={setCommandMenuOpen}
                departments={departments}
                entries={entries}
                frames={frames}
                navigationPages={navigationPages}
                onSelect={handleCommandMenuSelect}
            />
            <main className="min-w-0 flex-1 overflow-hidden lg:pt-2 lg:pl-1">
                <div className="flex h-full flex-col gap-8 overflow-hidden border-secondary pt-8 pb-12 lg:rounded-tl-[24px] lg:border-t lg:border-l">
                    <div className="flex flex-col justify-between gap-4 px-4 lg:flex-row lg:px-8">
                        {headerContent || (
                            <p className="text-xl font-semibold text-primary lg:text-display-xs">
                                {isHomePage ? `Hello, ${firstName}` : ""}
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
                                navigationPages={navigationPages}
                                onHeaderContentChange={setHeaderContent}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
