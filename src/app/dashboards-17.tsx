"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import {
    Announcement03,
    Briefcase01,
    Building02,
    Compass01,
    CpuChip01,
    Globe01,
    MessageChatCircle,
    Package,
    Palette,
    Repeat01,
    Sale01,
    SearchLg,
    Share01,
    Stars02,
    Target01,
    VideoRecorder,
    FolderClosed,
} from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { Input } from "@/components/base/input/input";
import { DirectoryApp } from "@/components/app/directory-app";
import type { RipplingDepartment } from "@/utils/supabase/types";
import { supabaseFetch } from "@/utils/supabase/rest";

interface Dashboard17Props {
    initialDepartmentId?: string;
    initialPath?: string[];
}

export const Dashboard17 = ({ initialDepartmentId, initialPath }: Dashboard17Props) => {
    const router = useRouter();
    const [departments, setDepartments] = useState<RipplingDepartment[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId ?? "");
    const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);

    useEffect(() => {
        setSelectedDepartmentId(initialDepartmentId ?? "");
    }, [initialDepartmentId]);

    useEffect(() => {
        let isMounted = true;

        const loadDepartments = async () => {
            try {
                const data = await supabaseFetch<RipplingDepartment[]>("rippling_departments?select=id,name&order=name.asc");
                if (!isMounted) return;
                setDepartments(data);
                if (data.length > 0 && !initialDepartmentId) {
                    const firstId = data[0].id;
                    setSelectedDepartmentId(firstId);
                    router.replace(`/${firstId}`);
                }
            } catch {
                if (!isMounted) return;
                setDepartments([]);
            }
        };

        void loadDepartments();

        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, initialDepartmentId]);

    const departmentItems = useMemo(() => {
        const iconFor = (name?: string | null) => {
            const value = name?.toLowerCase() ?? "";
            if (value.includes("brand")) return Stars02;
            if (value.includes("creative direction")) return Compass01;
            if (value.includes("creative products")) return Package;
            if (value.includes("c-suite")) return Building02;
            if (value.includes("customer experience")) return MessageChatCircle;
            if (value.includes("design")) return Palette;
            if (value.includes("exec")) return Briefcase01;
            if (value.includes("marketing")) return Announcement03;
            if (value.includes("remix")) return Repeat01;
            if (value.includes("sales")) return Sale01;
            if (value.includes("social media")) return Share01;
            if (value.includes("strategy")) return Target01;
            if (value.includes("systems integration")) return CpuChip01;
            if (value.includes("video")) return VideoRecorder;
            if (value.includes("web")) return Globe01;
            return FolderClosed;
        };

        return departments.map((department) => ({
            label: department.name ?? department.id,
            href: `/${department.id}`,
            icon: iconFor(department.name),
        }));
    }, [departments]);

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
                            <p className="text-xl font-semibold text-primary lg:text-display-xs">Department directory</p>
                        )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden px-4 lg:px-8">
                        <DirectoryApp
                            initialDepartmentId={selectedDepartmentId || initialDepartmentId}
                            initialPath={initialPath}
                            variant="embedded"
                            showDepartments={false}
                            departmentsOverride={departments}
                            onHeaderContentChange={setHeaderContent}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
