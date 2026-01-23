import { Folder } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import type { DirectoryEntry } from "@/utils/supabase/types";

type EmptyFolderStateProps = {
    activeEntry: DirectoryEntry | null;
};

export const EmptyFolderState = ({ activeEntry }: EmptyFolderStateProps) => {
    return (
        <div className="flex h-full min-h-[400px] items-center justify-center">
            <EmptyState size="md">
                <EmptyState.Header>
                    <EmptyState.FeaturedIcon color="gray" icon={Folder} />
                </EmptyState.Header>

                <EmptyState.Content>
                    <EmptyState.Title>
                        {activeEntry ? "This folder is empty" : "Nothing here yet"}
                    </EmptyState.Title>
                    <EmptyState.Description>
                        {activeEntry
                            ? "Add folders or pages to organize content inside this folder."
                            : "Create a new folder or page to get started."}
                    </EmptyState.Description>
                </EmptyState.Content>
            </EmptyState>
        </div>
    );
};
