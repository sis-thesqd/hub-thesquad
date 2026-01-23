import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DirectoryEntry, Frame, RipplingDepartment } from "@/utils/supabase/types";
import { supabaseFetch } from "@/utils/supabase/rest";
import { buildPathSegments, findEntryByPath } from "../utils";

type UseDirectoryDataProps = {
    initialDepartmentId?: string;
    initialPath: string[];
    departmentsOverride?: RipplingDepartment[];
};

export const useDirectoryData = ({
    initialDepartmentId,
    initialPath,
    departmentsOverride,
}: UseDirectoryDataProps) => {
    const router = useRouter();
    const [departments, setDepartments] = useState<RipplingDepartment[]>(departmentsOverride ?? []);
    const [entries, setEntries] = useState<DirectoryEntry[]>([]);
    const [allFolders, setAllFolders] = useState<DirectoryEntry[]>([]);
    const [frames, setFrames] = useState<Frame[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId ?? "");
    const [pathSegments, setPathSegments] = useState(initialPath);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedDepartmentId(initialDepartmentId ?? "");
    }, [initialDepartmentId]);

    const initialPathKey = initialPath.join("/");
    useEffect(() => {
        setPathSegments(initialPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPathKey]);

    const loadDepartments = useCallback(async () => {
        const data = await supabaseFetch<RipplingDepartment[]>("rippling_departments?select=id,name&order=name.asc");
        return data;
    }, []);

    const loadFrames = useCallback(async () => {
        return await supabaseFetch<Frame[]>("sh_frames?select=id,name,iframe_url,description,department_ids&order=name.asc");
    }, []);

    const loadEntries = useCallback(async (departmentId: string) => {
        const filter = `department_id=eq.${encodeURIComponent(departmentId)}`;
        return await supabaseFetch<DirectoryEntry[]>(
            `sh_directory?select=id,department_id,parent_id,frame_id,name,slug,sort_order,emoji&${filter}&order=sort_order.asc.nullslast,name.asc`,
        );
    }, []);

    const loadAllFolders = useCallback(async () => {
        return await supabaseFetch<DirectoryEntry[]>(
            `sh_directory?select=id,department_id,parent_id,frame_id,name,slug,sort_order,emoji&frame_id=is.null&order=name.asc`,
        );
    }, []);

    const refreshData = useCallback(
        async (departmentId: string) => {
            setIsLoading(true);
            setError(null);
            try {
                const [entriesData, framesData, allFoldersData] = await Promise.all([
                    loadEntries(departmentId),
                    loadFrames(),
                    loadAllFolders(),
                ]);
                setEntries(entriesData);
                setFrames(framesData);
                setAllFolders(allFoldersData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        },
        [loadEntries, loadFrames, loadAllFolders],
    );

    useEffect(() => {
        if (!departmentsOverride?.length) return;
        setDepartments(departmentsOverride);
    }, [departmentsOverride]);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            if (departmentsOverride?.length) {
                if (!initialDepartmentId) {
                    const first = departmentsOverride[0].id;
                    setSelectedDepartmentId(first);
                    router.replace(`/${first}`);
                }
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const deptData = await loadDepartments();
                if (!isMounted) return;
                setDepartments(deptData);

                if (!initialDepartmentId && deptData.length > 0) {
                    const first = deptData[0].id;
                    setSelectedDepartmentId(first);
                    router.replace(`/${first}`);
                }
            } catch (err) {
                if (!isMounted) return;
                setError(err instanceof Error ? err.message : "Failed to load departments");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void init();

        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [departmentsOverride, loadDepartments, router, initialDepartmentId]);

    useEffect(() => {
        if (!selectedDepartmentId) return;
        void refreshData(selectedDepartmentId);
    }, [refreshData, selectedDepartmentId]);

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
