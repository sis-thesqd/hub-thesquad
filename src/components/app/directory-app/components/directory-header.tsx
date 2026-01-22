import { Edit01, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { DirectoryEntry } from "@/utils/supabase/types";

type DirectoryHeaderProps = {
    activeEntry: DirectoryEntry | null;
    onEditFolder: () => void;
    onNewFolder: () => void;
    onNewPage: () => void;
};

export const DirectoryHeader = ({
    activeEntry,
    onEditFolder,
    onNewFolder,
    onNewPage,
}: DirectoryHeaderProps) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
                <h1 className="text-xl font-semibold text-primary">
                    {activeEntry?.name ?? "Directory"}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                {activeEntry && !activeEntry.frame_id && (
                    <Button
                        size="sm"
                        color="tertiary"
                        iconLeading={Edit01}
                        onClick={onEditFolder}
                    >
                        Edit
                    </Button>
                )}
                <>
                    <Button
                        size="sm"
                        color="secondary"
                        iconLeading={Plus}
                        onClick={onNewFolder}
                    >
                        New folder
                    </Button>
                    <Button
                        size="sm"
                        color="primary"
                        iconLeading={Plus}
                        onClick={onNewPage}
                    >
                        New page
                    </Button>
                </>
            </div>
        </header>
    );
};
