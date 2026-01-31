"use client";

import { useCallback, useSyncExternalStore } from "react";

let hasPatchedHistory = false;

const ensureHistoryPatched = () => {
    if (hasPatchedHistory || typeof window === "undefined") return;

    hasPatchedHistory = true;
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const notify = () => queueMicrotask(() => window.dispatchEvent(new Event("urlchange")));

    window.history.pushState = function pushState(...args) {
        const result = originalPushState.apply(this, args as unknown as Parameters<History["pushState"]>);
        notify();
        return result;
    };

    window.history.replaceState = function replaceState(...args) {
        const result = originalReplaceState.apply(this, args as unknown as Parameters<History["replaceState"]>);
        notify();
        return result;
    };

    window.addEventListener("popstate", notify);
};

/**
 * A hook that safely reads URL search params without triggering Suspense.
 * Uses useSyncExternalStore to subscribe to URL changes.
 */
export function useUrlParams() {
    const subscribe = useCallback((callback: () => void) => {
        ensureHistoryPatched();
        window.addEventListener("urlchange", callback);
        window.addEventListener("popstate", callback);
        return () => {
            window.removeEventListener("urlchange", callback);
            window.removeEventListener("popstate", callback);
        };
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
