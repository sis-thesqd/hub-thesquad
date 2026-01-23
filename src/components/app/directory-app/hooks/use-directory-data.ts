import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DirectoryEntry, Frame, RipplingDepartment } from "@/utils/supabase/types";
import { buildPathSegments, findEntryByPath } from "../utils";

type UseDirectoryDataProps = {
    initialDepartmentId?: string;
    initialPath: string[];
    departmentsOverride?: RipplingDepartment[];
    entriesOverride?: DirectoryEntry[];
    framesOverride?: Frame[];
};

export const useDirectoryData = ({
    initialDepartmentId,
    initialPath,
    departmentsOverride,
    entriesOverride,
    framesOverride,
}: UseDirectoryDataProps) => {
    const router = useRouter();
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId ?? "");
    const [pathSegments, setPathSegments] = useState(initialPath);
    const [error, setError] = useState<string | null>(null);

    // Use overrides directly - no local state duplication needed
    const departments = departmentsOverride ?? [];
    const frames = framesOverride ?? [];

    // Filter entries for the selected department
    const entries = useMemo(() => {
        if (!entriesOverride?.length || !selectedDepartmentId) return [];
        return entriesOverride.filter((e) => e.department_id === selectedDepartmentId);
    }, [entriesOverride, selectedDepartmentId]);

    // All folders from the override
    const allFolders = useMemo(() => {
        if (!entriesOverride?.length) return [];
        return entriesOverride.filter((e) => !e.frame_id);
    }, [entriesOverride]);

    // Determine loading state based on whether overrides have loaded
    const isLoading = !departmentsOverride?.length || !entriesOverride?.length || !framesOverride?.length;

    useEffect(() => {
        setSelectedDepartmentId(initialDepartmentId ?? "");
    }, [initialDepartmentId]);

    const initialPathKey = initialPath.join("/");
    useEffect(() => {
        setPathSegments(initialPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPathKey]);

    // Handle initial redirect if no department selected
    useEffect(() => {
        if (departmentsOverride?.length && !initialDepartmentId) {
            const first = departmentsOverride[0].id;
            setSelectedDepartmentId(first);
            router.replace(`/${first}`);
        }
    }, [departmentsOverride, initialDepartmentId, router]);

    // No-op refreshData - data comes from React Query via overrides
    // Parent components should use invalidateEntriesAndFrames() instead
    const refreshData = useCallback(async (_departmentId: string) => {
        // Data refresh is handled by React Query invalidation in parent
    }, []);

    const frameById = useMemo(() => new Map(frames.map((frame) => [frame.id, frame])), [frames]);

    const visibleFrameIds = useMemo(() => {
        const set = new Set<string>();
        frames.forEach((frame) => {
            if (!frame.department_ids?.length || frame.department_ids.includes(selectedDepartmentId)) {
                set.add(frame.id);
            }
        });
        return set;
    }, [frames, selectedDepartmentId]);

    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => !entry.frame_id || visibleFrameIds.has(entry.frame_id));
    }, [entries, visibleFrameIds]);

    const entriesById = useMemo(() => new Map(filteredEntries.map((entry) => [entry.id, entry])), [filteredEntries]);

    const childrenByParent = useMemo(() => {
        const map = new Map<string | null, DirectoryEntry[]>();
        filteredEntries.forEach((entry) => {
            const key = entry.parent_id ?? null;
            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(entry);
        });
        return map;
    }, [filteredEntries]);

    const pathById = useMemo(() => {
        const map = new Map<string, string[]>();
        filteredEntries.forEach((entry) => {
            map.set(entry.id, buildPathSegments(entriesById, entry));
        });
        return map;
    }, [entriesById, filteredEntries]);

    const allFoldersById = useMemo(() => new Map(allFolders.map((folder) => [folder.id, folder])), [allFolders]);

    const allFolderPathById = useMemo(() => {
        const map = new Map<string, string[]>();
        allFolders.forEach((folder) => {
            map.set(folder.id, buildPathSegments(allFoldersById, folder));
        });
        return map;
    }, [allFolders, allFoldersById]);

    const activeEntry = useMemo(() => {
        if (!pathSegments?.length) return null;
        return findEntryByPath(childrenByParent, pathSegments);
    }, [childrenByParent, pathSegments]);

    const activeFrame = activeEntry?.frame_id ? frameById.get(activeEntry.frame_id) ?? null : null;

    const activeParentId = activeEntry?.frame_id ? activeEntry.parent_id : activeEntry?.id ?? null;

    const activeChildren = useMemo(() => {
        if (!activeEntry) return childrenByParent.get(null) || [];
        if (activeEntry.frame_id) return [];
        return childrenByParent.get(activeEntry.id) || [];
    }, [activeEntry, childrenByParent]);

    const visibleFolders = useMemo(() => {
        return activeChildren.filter((entry) => !entry.frame_id);
    }, [activeChildren]);

    const visiblePages = useMemo(() => {
        return activeChildren.filter((entry) => entry.frame_id);
    }, [activeChildren]);

    const handleDepartmentSelect = (departmentId: string) => {
        setSelectedDepartmentId(departmentId);
        router.push(`/${departmentId}`);
    };

    return {
        departments,
        entries,
        allFolders,
        frames,
        selectedDepartmentId,
        pathSegments,
        isLoading,
        error,
        setError,
        frameById,
        filteredEntries,
        entriesById,
        childrenByParent,
        pathById,
        allFoldersById,
        allFolderPathById,
        activeEntry,
        activeFrame,
        activeParentId,
        activeChildren,
        visibleFolders,
        visiblePages,
        handleDepartmentSelect,
        refreshData,
    };
};
