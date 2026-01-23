import { useMemo } from "react";
import { ArrowUpRight, Copy01, Edit05, Star01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";
import type { Frame } from "@/utils/supabase/types";
import { UrlParamsInfoSlideout } from "./url-params-info-slideout";
import { useUrlParams } from "@/hooks/use-url-params";
import { useClipboard } from "@/hooks/use-clipboard";

type EmbeddedHeaderContentProps = {
    activeFrame: Frame;
    onEdit: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
};

export const EmbeddedHeaderContent = ({
    activeFrame,
    onEdit,
    isFavorite = false,
    onToggleFavorite,
}: EmbeddedHeaderContentProps) => {
    const urlParams = useUrlParams();
    const clipboard = useClipboard();

    // Build URL with merged params (same logic as IframeView)
    const iframeUrlWithParams = useMemo(() => {
        if (!activeFrame.iframe_url) return "";

        // Ensure URL has a protocol
        let urlString = activeFrame.iframe_url;
        if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
            urlString = `https://${urlString}`;
        }

        try {
            const url = new URL(urlString);
            urlParams.forEach((value, key) => {
                url.searchParams.set(key, value);
            });
            return url.toString();
        } catch {
            return urlString;
        }
    }, [activeFrame.iframe_url, urlParams]);

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
