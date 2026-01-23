"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A hook that safely reads URL search params without triggering Suspense.
 * Uses useSyncExternalStore to subscribe to URL changes.
 */
export function useUrlParams() {
    const subscribe = useCallback((callback: () => void) => {
        window.addEventListener("popstate", callback);
        return () => window.removeEventListener("popstate", callback);
    }, []);

    const getSnapshot = useCallback(() => {
        return window.location.search;
    }, []);

    const getServerSnapshot = useCallback(() => {
        return "";
    }, []);

    const searchString = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return new URLSearchParams(searchString);
}

/**
 * Helper to append current URL params to a path
 */
export function useAppendUrlParams() {
    const params = useUrlParams();

    return useCallback(
        (basePath: string) => {
            const queryString = params.toString();
            return queryString ? `${basePath}?${queryString}` : basePath;
        },
        [params]
    );
}
