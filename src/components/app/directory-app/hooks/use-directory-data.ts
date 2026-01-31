import { useCallback, useEffect, useMemo, useState } from "react";
import type { DirectoryEntry, Frame, RipplingDepartment } from "@/utils/supabase/types";
import { buildPathSegments, findEntryByPath } from "../utils";

export const EXTERNAL_PAGES_SLUG = "__external__";

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

    // External pages: entries from OTHER departments whose frames are visible to current department
    const externalPageEntries = useMemo(() => {
        if (!entriesOverride?.length || !selectedDepartmentId) return [];
        return entriesOverride.filter((entry) => {
            // Must be a page (has frame_id)
            if (!entry.frame_id) return false;
            // Must be from a different department
            if (entry.department_id === selectedDepartmentId) return false;
            // Frame must be visible to current department
            return visibleFrameIds.has(entry.frame_id);
        });
    }, [entriesOverride, selectedDepartmentId, visibleFrameIds]);

    const hasExternalPages = externalPageEntries.length > 0;

    // Check if we're viewing the external pages virtual folder
    const isExternalPagesView = pathSegments.length === 1 && pathSegments[0] === EXTERNAL_PAGES_SLUG;

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

    // Paths for external page entries (from other departments)
    const externalPathById = useMemo(() => {
        const map = new Map<string, string[]>();
        externalPageEntries.forEach((entry) => {
            // Build path using allFoldersById which contains folders from all departments
            const segments: string[] = [entry.slug];
            let current = entry.parent_id ? allFoldersById.get(entry.parent_id) : null;
            while (current) {
                segments.unshift(current.slug);
                current = current.parent_id ? allFoldersById.get(current.parent_id) : null;
            }
            map.set(entry.id, segments);
        });
        return map;
    }, [externalPageEntries, allFoldersById]);

    const { activeEntry, iframePathSegments } = useMemo(() => {
        if (!pathSegments?.length) return { activeEntry: null, iframePathSegments: [] };
        // External pages view is a virtual folder, not a real entry
        if (isExternalPagesView) return { activeEntry: null, iframePathSegments: [] };
        const result = findEntryByPath(childrenByParent, pathSegments);
        return { activeEntry: result.entry, iframePathSegments: result.remainingPath };
    }, [childrenByParent, pathSegments, isExternalPagesView]);

    const activeFrame = activeEntry?.frame_id ? frameById.get(activeEntry.frame_id) ?? null : null;

    const activeParentId = activeEntry?.frame_id ? activeEntry.parent_id : activeEntry?.id ?? null;

    const activeChildren = useMemo(() => {
        // External pages view shows external page entries
        if (isExternalPagesView) return externalPageEntries;
        if (!activeEntry) return childrenByParent.get(null) || [];
        if (activeEntry.frame_id) return [];
        return childrenByParent.get(activeEntry.id) || [];
    }, [activeEntry, childrenByParent, isExternalPagesView, externalPageEntries]);

    const visibleFolders = useMemo(() => {
        // External pages view has no folders
        if (isExternalPagesView) return [];
        return activeChildren.filter((entry) => !entry.frame_id);
    }, [activeChildren, isExternalPagesView]);

    const visiblePages = useMemo(() => {
        return activeChildren.filter((entry) => entry.frame_id);
    }, [activeChildren]);

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
        refreshData,
        // External pages support
        externalPageEntries,
        hasExternalPages,
        isExternalPagesView,
        externalPathById,
        // Iframe path forwarding
        iframePathSegments,
    };
};
