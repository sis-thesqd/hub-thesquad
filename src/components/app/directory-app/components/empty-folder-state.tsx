import { Folder, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { DirectoryEntry } from "@/utils/supabase/types";

type EmptyFolderStateProps = {
    activeEntry: DirectoryEntry | null;
    onNewFolder: () => void;
    onNewPage: () => void;
};

export const EmptyFolderState = ({ activeEntry, onNewFolder, onNewPage }: EmptyFolderStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary_alt bg-primary px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                <Folder className="size-7 text-fg-quaternary" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-primary">
                {activeEntry ? "This folder is empty" : "No items yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-tertiary">
                {activeEntry
                    ? "Add folders or pages to organize content inside this folder."
                    : "Create your first folder or page to get started."}
            </p>
            <div className="mt-6 flex items-center gap-3">
                <Button
                    size="md"
                    color="secondary"
                    iconLeading={Plus}
                    onClick={onNewFolder}
                >
                    New folder
                </Button>
                <Button
                    size="md"
                    color="primary"
                    iconLeading={Plus}
                    onClick={onNewPage}
                >
                    New page
                </Button>
            </div>
        </div>
    );
};
