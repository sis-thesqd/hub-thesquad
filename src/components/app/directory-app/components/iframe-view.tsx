"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUrlParams } from "@/hooks/use-url-params";
import { useAuth } from "@/providers/auth-provider";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import type { Frame } from "@/utils/supabase/types";
import { cx } from "@/utils/cx";

const FRAME_VALIDATION_KEY = process.env.NEXT_PUBLIC_FRAME_VALIDATION_KEY;

type IframeViewProps = {
    frame: Frame;
    pathSegments?: string[];
};

export const IframeView = ({ frame, pathSegments = [] }: IframeViewProps) => {
    const urlParams = useUrlParams();
    const { worker, userEmail } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const iframeSrc = useMemo(() => {
        if (!frame.iframe_url) return "";

        // Ensure URL has a protocol
        let urlString = frame.iframe_url;
        if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
            urlString = `https://${urlString}`;
        }

        try {
            const url = new URL(urlString);

            // Append any additional path segments to the iframe URL
            if (pathSegments.length > 0) {
                // Ensure pathname ends with / before appending, or join properly
                const basePath = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
                url.pathname = `${basePath}/${pathSegments.join("/")}`;
            }

            // Merge parent URL params into iframe URL
            // Parent params take precedence over existing iframe params
            urlParams.forEach((value, key) => {
                url.searchParams.set(key, value);
            });

            // Automatically inject worker/user information as URL parameters
            if (worker) {
                // Add user ID
                if (worker.id && !url.searchParams.has('user_id')) {
                    url.searchParams.set('user_id', worker.id);
                }
                
                // Add email (prefer work email, fallback to personal or auth email)
                const email = worker.work_email || worker.personal_email || userEmail;
                if (email && !url.searchParams.has('email')) {
                    url.searchParams.set('email', email);
                }
                
                // Add name (prefer display name, fallback to combined given/family names)
                const name = worker.display_name || 
                    [worker.preferred_given_name || worker.given_name, worker.preferred_family_name || worker.family_name]
                        .filter(Boolean)
                        .join(' ');
                if (name && !url.searchParams.has('name')) {
                    url.searchParams.set('name', name);
                }
                
                // Add department ID
                if (worker.department_id && !url.searchParams.has('department_id')) {
                    url.searchParams.set('department_id', worker.department_id);
                }
                
                // Add title
                if (worker.title && !url.searchParams.has('title')) {
                    url.searchParams.set('title', worker.title);
                }
            }

            return url.toString();
        } catch {
            // If iframe_url is not a valid URL, return it as-is
            return urlString;
        }
    }, [frame.iframe_url, urlParams, pathSegments, worker, userEmail]);

    // Reset loading state when frame changes
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [frame.id]);

    // Handle frame validation key postMessage communication
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Check if the message contains the frame validation key
            if (event.data === FRAME_VALIDATION_KEY && FRAME_VALIDATION_KEY) {
                console.log("[IframeView] Frame validation key received:", true);

                // Respond back with the same key
                if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(FRAME_VALIDATION_KEY, "*");
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    return (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-2xl border-x border-t border-secondary_alt bg-primary">
            <iframe
                ref={iframeRef}
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
