import { Edit01, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

type EmbeddedFolderHeaderProps = {
    folderName: string;
    showEditButton: boolean;
    onEditFolder: () => void;
    onNewFolder: () => void;
    onNewPage: () => void;
};

export const EmbeddedFolderHeader = ({
    folderName,
    showEditButton,
    onEditFolder,
    onNewFolder,
    onNewPage,
}: EmbeddedFolderHeaderProps) => {
    return (
        <>
            <h1 className="text-xl font-semibold text-primary lg:text-display-xs">
                {folderName}
            </h1>
            <div className="flex items-center gap-2">
                {showEditButton && (
                    <Button
                        size="sm"
                        color="tertiary"
                        onClick={onEditFolder}
                    >
                        Edit
                    </Button>
                )}
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
            </div>
        </>
    );
};
