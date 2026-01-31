import { useMemo } from "react";
import { ArrowUpRight, Copy01, Edit05, Expand06, Star01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";
import type { Frame } from "@/utils/supabase/types";
import { UrlParamsInfoSlideout } from "./url-params-info-slideout";
import { useUrlParams } from "@/hooks/use-url-params";
import { useClipboard } from "@/hooks/use-clipboard";
import { useAuth } from "@/providers/auth-provider";

type EmbeddedHeaderContentProps = {
    activeFrame: Frame;
    onEdit: () => void;
    onFullscreen?: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    pathSegments?: string[];
};

export const EmbeddedHeaderContent = ({
    activeFrame,
    onEdit,
    onFullscreen,
    isFavorite = false,
    onToggleFavorite,
    pathSegments = [],
}: EmbeddedHeaderContentProps) => {
    const urlParams = useUrlParams();
    const clipboard = useClipboard();
    const { worker, userEmail } = useAuth();

    // Build URL with merged params and path segments (same logic as IframeView)
    const iframeUrlWithParams = useMemo(() => {
        if (!activeFrame.iframe_url) return "";

        // Ensure URL has a protocol
        let urlString = activeFrame.iframe_url;
        if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
            urlString = `https://${urlString}`;
        }

        try {
            const url = new URL(urlString);

            // Append any additional path segments to the URL
            if (pathSegments.length > 0) {
                const basePath = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
                url.pathname = `${basePath}/${pathSegments.join("/")}`;
            }

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
            return urlString;
        }
    }, [activeFrame.iframe_url, urlParams, pathSegments, worker, userEmail]);

    const handleOpenInNewTab = () => {
        window.open(iframeUrlWithParams, "_blank", "noopener,noreferrer");
    };

    const handleCopyUrl = async () => {
        await clipboard.copy(iframeUrlWithParams);
    };

    return (
        <div className="flex items-center gap-2">
            {onToggleFavorite && (
                <button
                    type="button"
                    onClick={onToggleFavorite}
                    className={cx(
                        "flex size-8 cursor-pointer items-center justify-center rounded-md transition hover:bg-secondary",
                        isFavorite ? "text-warning-primary" : "text-fg-quaternary"
                    )}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <Star01 className={cx("size-5", isFavorite && "fill-warning-primary")} />
                </button>
            )}
            <UrlParamsInfoSlideout iframeUrl={activeFrame.iframe_url} />
            <Dropdown.Root>
                <Button
                    size="sm"
                    color="primary"
                >
                    Actions
                </Button>
                <Dropdown.Popover>
                    <Dropdown.Menu>
                        <Dropdown.Item
                            icon={Edit05}
                            onAction={onEdit}
                        >
                            Edit
                        </Dropdown.Item>
                        {onFullscreen && (
                            <Dropdown.Item
                                icon={Expand06}
                                onAction={onFullscreen}
                            >
                                Open fullscreen
                            </Dropdown.Item>
                        )}
                        <Dropdown.Item
                            icon={ArrowUpRight}
                            onAction={handleOpenInNewTab}
                        >
                            Open app new tab
                        </Dropdown.Item>
                        <Dropdown.Item
                            icon={Copy01}
                            onAction={handleCopyUrl}
                        >
                            Copy app link
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown.Root>
        </div>
    );
};
