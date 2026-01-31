import * as AllIcons from "@untitledui/icons";
import type { SelectItemType } from "@/components/base/select/select";

export const ALL_ICON_NAMES = Object.keys(AllIcons).filter(
    key => typeof (AllIcons as Record<string, unknown>)[key] === 'function'
).sort();

export const ICON_OPTIONS: SelectItemType[] = ALL_ICON_NAMES.map(iconName => ({
    id: iconName,
    label: iconName,
}));
