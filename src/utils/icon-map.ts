import type { FC } from "react";
import * as Icons from "@untitledui/icons";

// Create a map of icon names to icon components
const iconMap: Record<string, FC<{ className?: string }>> = Icons as unknown as Record<string, FC<{ className?: string }>>;

/**
 * Get an icon component by name from @untitledui/icons
 * @param name The icon name (e.g., "Stars02", "Compass01")
 * @param fallback Optional fallback icon to use if not found
 * @returns The icon component or the fallback
 */
export const getIconByName = (
    name: string | undefined | null,
    fallback: FC<{ className?: string }> = Icons.FolderClosed
): FC<{ className?: string }> => {
    if (!name) return fallback;
    return iconMap[name] ?? fallback;
};
