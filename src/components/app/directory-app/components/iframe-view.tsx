"use client";

import { useEffect, useMemo, useState } from "react";
import { useUrlParams } from "@/hooks/use-url-params";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import type { Frame } from "@/utils/supabase/types";
import { cx } from "@/utils/cx";

type IframeViewProps = {
    frame: Frame;
};

export const IframeView = ({ frame }: IframeViewProps) => {
    const urlParams = useUrlParams();
    const [isLoading, setIsLoading] = useState(true);

    const iframeSrc = useMemo(() => {
        if (!frame.iframe_url) return "";

        // Ensure URL has a protocol
        let urlString = frame.iframe_url;
        if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
            urlString = `https://${urlString}`;
        }

        try {
            const url = new URL(urlString);

            // Merge parent URL params into iframe URL
            // Parent params take precedence over existing iframe params
            urlParams.forEach((value, key) => {
                url.searchParams.set(key, value);
            });

            return url.toString();
        } catch {
            // If iframe_url is not a valid URL, return it as-is
            return urlString;
        }
    }, [frame.iframe_url, urlParams]);

    // Reset loading state when frame changes
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [frame.id]);

    return (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-2xl border-x border-t border-secondary_alt bg-primary">
            <iframe
                title={frame.name}
                src={iframeSrc}
                className={cx(
                    "h-full w-full border-0 transition-[filter] duration-300",
                    isLoading && "blur-sm"
                )}
                allow="clipboard-read; clipboard-write; fullscreen;"
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/50">
                    <LoadingIndicator type="line-simple" size="md" />
                </div>
            )}
        </div>
    );
};
