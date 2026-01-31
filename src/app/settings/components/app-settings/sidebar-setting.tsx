"use client";

import * as RadioGroups from "@/components/base/radio-groups/radio-groups";
import { sidebarItems } from "./sidebar-items";

interface SidebarSettingProps {
    sidebarDefaultExpanded: boolean;
    onSidebarDefaultChange: (value: string) => void;
    mounted: boolean;
}

export const SidebarSetting = ({ sidebarDefaultExpanded, onSidebarDefaultChange, mounted }: SidebarSettingProps) => {
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-primary">Sidebar</p>
                <p className="text-sm text-tertiary">Choose the default sidebar state.</p>
            </div>

            {mounted ? (
                <RadioGroups.RadioButton
                    aria-label="Sidebar default state"
                    orientation="horizontal"
                    value={sidebarDefaultExpanded ? "expanded" : "collapsed"}
                    onChange={onSidebarDefaultChange}
                    items={sidebarItems}
                    className="flex-nowrap overflow-x-auto"
                />
            ) : (
                <div className="h-[88px]" />
            )}
        </div>
    );
};
