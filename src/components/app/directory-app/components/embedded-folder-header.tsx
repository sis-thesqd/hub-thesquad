import { Plus, Star01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

type EmbeddedFolderHeaderProps = {
    showEditButton: boolean;
    onEditFolder: () => void;
    onNewFolder: () => void;
    onNewPage: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
};

export const EmbeddedFolderHeader = ({
    showEditButton,
    onEditFolder,
    onNewFolder,
    onNewPage,
    isFavorite = false,
    onToggleFavorite,
}: EmbeddedFolderHeaderProps) => {
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
    );
};
