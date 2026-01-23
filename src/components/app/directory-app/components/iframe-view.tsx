"use client";

import { useMemo } from "react";
import { useUrlParams } from "@/hooks/use-url-params";
import type { Frame } from "@/utils/supabase/types";

type IframeViewProps = {
    frame: Frame;
};

export const IframeView = ({ frame }: IframeViewProps) => {
    const urlParams = useUrlParams();

    const iframeSrc = useMemo(() => {
        if (!frame.iframe_url) return "";

        try {
            const url = new URL(frame.iframe_url);

            // Merge parent URL params into iframe URL
            // Parent params take precedence over existing iframe params
            urlParams.forEach((value, key) => {
                url.searchParams.set(key, value);
            });

            return url.toString();
        } catch {
            // If iframe_url is not a valid URL, return it as-is
            return frame.iframe_url;
        }
    }, [frame.iframe_url, urlParams]);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-secondary_alt bg-primary">
            <iframe
                title={frame.name}
                src={iframeSrc}
                className="h-full w-full border-0"
                allow="clipboard-read; clipboard-write; fullscreen;"
            />
        </div>
    );
};
