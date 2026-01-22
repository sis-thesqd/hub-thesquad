"use client";

import { useEffect, useMemo, useState } from "react";
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
        <div className="flex flex-col bg-primary lg:flex-row">
            <SidebarNavigationSlim
                hideBorder
                activeUrl={selectedDepartmentId ? `/${selectedDepartmentId}` : undefined}
                items={departmentItems}
            />
            <main className="min-w-0 flex-1 lg:pt-2 lg:pl-1">
                <div className="flex min-h-dvh flex-col gap-8 border-secondary pt-8 pb-12 lg:rounded-tl-[24px] lg:border-t lg:border-l">
                    <div className="flex flex-col justify-between gap-4 px-4 lg:flex-row lg:px-8">
                        <p className="text-xl font-semibold text-primary lg:text-display-xs">Department directory</p>
                        <Input size="sm" shortcut aria-label="Search" placeholder="Search" icon={SearchLg} className="lg:max-w-80" />
                    </div>

                    <div className="px-4 lg:px-8">
                        <DirectoryApp
                            initialDepartmentId={selectedDepartmentId || initialDepartmentId}
                            initialPath={initialPath}
                            variant="embedded"
                            showDepartments={false}
                            departmentsOverride={departments}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
