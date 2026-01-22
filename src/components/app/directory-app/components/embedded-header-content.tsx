import { ArrowUpRight, Copy01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";

type EmbeddedHeaderContentProps = {
    activeEntry: DirectoryEntry;
    activeFrame: Frame;
    onEdit: () => void;
    onCopyUrl: () => void;
};

export const EmbeddedHeaderContent = ({
    activeEntry,
    activeFrame,
    onEdit,
    onCopyUrl,
}: EmbeddedHeaderContentProps) => {
    const handleOpenInNewTab = () => {
        window.open(activeFrame.iframe_url, "_blank", "noopener,noreferrer");
    };

    return (
        <>
            <h1 className="text-xl font-semibold text-primary lg:text-display-xs">
                {activeEntry.name ?? "Directory"}
            </h1>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    color="tertiary"
                    onClick={onEdit}
                >
                    Edit
                </Button>
                <Dropdown.Root>
                    <Button
                        size="sm"
                        color="primary"
                    >
                        Share
                    </Button>
                    <Dropdown.Popover>
                        <Dropdown.Menu>
                            <Dropdown.Item
                                icon={ArrowUpRight}
                                onAction={handleOpenInNewTab}
                            >
                                Open in new tab
                            </Dropdown.Item>
                            <Dropdown.Item
                                icon={Copy01}
                                onAction={onCopyUrl}
                            >
                                Copy URL
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </div>
        </>
    );
};
