import { useCallback } from "react";
import type { SelectItemType } from "@/components/base/select/select";
import { useListData } from "react-stately";

export const useListDataHelpers = () => {
    const pageDepartments = useListData<SelectItemType>({
        initialItems: [],
    });

    const pagePlacements = useListData<SelectItemType>({
        initialItems: [],
    });

    const clearSelectedItems = useCallback((list: ReturnType<typeof useListData<SelectItemType>>) => {
        list.items.forEach((item) => list.remove(item.id));
    }, []);

    const replaceSelectedItems = useCallback((
        list: ReturnType<typeof useListData<SelectItemType>>,
        items: SelectItemType[]
    ) => {
        clearSelectedItems(list);
        items.forEach((item) => list.append(item));
    }, [clearSelectedItems]);

    return {
        pageDepartments,
        pagePlacements,
        clearSelectedItems,
        replaceSelectedItems,
    };
};
