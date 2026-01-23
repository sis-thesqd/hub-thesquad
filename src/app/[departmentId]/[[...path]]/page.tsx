"use client";

import { Suspense, use } from "react";
import { Dashboard17 } from "@/app/dashboards-17";

interface PageProps {
    params: Promise<{
        departmentId: string;
        path?: string[];
    }>;
}

export default function DepartmentDirectoryPage({ params }: PageProps) {
    const resolvedParams = use(params);
    return (
        <Suspense>
            <Dashboard17 initialDepartmentId={resolvedParams.departmentId} initialPath={resolvedParams.path ?? []} />
        </Suspense>
    );
}
