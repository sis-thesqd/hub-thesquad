import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Frame } from "@/utils/supabase/types";
import type { ActiveEntryInfo } from "@/components/app/directory-app/types";
import { useUrlParams } from "@/hooks/use-url-params";
import { FULLSCREEN_DEFAULT_KEY } from "../constants";

interface UseFullscreenProps {
    activeEntryInfo: ActiveEntryInfo;
    frames: Frame[];
}

export const useFullscreen = ({ activeEntryInfo, frames }: UseFullscreenProps) => {
    const router = useRouter();
    const urlParams = useUrlParams();
    const fullscreenParam = urlParams.get("fullscreen");

    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [fullscreenFrame, setFullscreenFrame] = useState<Frame | null>(null);
    const [fullscreenPathSegments, setFullscreenPathSegments] = useState<string[]>([]);
    const [fullscreenDefault, setFullscreenDefault] = useState(false);
    const [userClosedFullscreen, setUserClosedFullscreen] = useState(false);

    // Load fullscreen default setting from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(FULLSCREEN_DEFAULT_KEY);
        setFullscreenDefault(stored === "true");
    }, []);

    // Reset userClosedFullscreen when navigating to a different page
    useEffect(() => {
        setUserClosedFullscreen(false);
    }, [activeEntryInfo?.frameId]);

    // Auto-open fullscreen from URL param or default setting
    useEffect(() => {
        if (!activeEntryInfo?.isPage || !activeEntryInfo.frameId || fullscreenOpen) return;

        const shouldOpenFromParam = fullscreenParam === "true";
        const shouldOpenFromDefault = fullscreenDefault && !userClosedFullscreen;

        if (shouldOpenFromParam || shouldOpenFromDefault) {
            const frame = frames.find((f) => f.id === activeEntryInfo.frameId);
            if (frame) {
                setFullscreenFrame(frame);
                setFullscreenPathSegments(activeEntryInfo.pathSegments ?? []);
                setFullscreenOpen(true);
            }
        }
    }, [fullscreenParam, activeEntryInfo, frames, fullscreenOpen, fullscreenDefault, userClosedFullscreen]);

    const handleFullscreen = useCallback(() => {
        if (activeEntryInfo?.isPage && activeEntryInfo.frameId) {
            const frame = frames.find((f) => f.id === activeEntryInfo.frameId);
            if (frame) {
                setFullscreenFrame(frame);
                setFullscreenPathSegments(activeEntryInfo.pathSegments ?? []);
                setFullscreenOpen(true);
                // Add fullscreen param to URL
                const newParams = new URLSearchParams(urlParams.toString());
                newParams.set("fullscreen", "true");
                const newUrl = `${window.location.pathname}?${newParams.toString()}`;
                router.replace(newUrl);
            }
        }
    }, [activeEntryInfo, frames, urlParams, router]);

    const handleFullscreenClose = useCallback((open: boolean) => {
        setFullscreenOpen(open);
        if (!open) {
            setUserClosedFullscreen(true);
            const newParams = new URLSearchParams(urlParams.toString());
            newParams.delete("fullscreen");
            const newUrl = newParams.toString()
                ? `${window.location.pathname}?${newParams.toString()}`
                : window.location.pathname;
            window.history.replaceState(null, "", newUrl);
        }
    }, [urlParams]);

    return {
        fullscreenOpen,
        fullscreenFrame,
        fullscreenPathSegments,
        handleFullscreen,
        handleFullscreenClose,
    };
};
