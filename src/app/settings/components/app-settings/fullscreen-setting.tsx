"use client";

import * as RadioGroups from "@/components/base/radio-groups/radio-groups";
import { fullscreenItems } from "./fullscreen-items";

interface FullscreenSettingProps {
    fullscreenDefault: boolean;
    onFullscreenDefaultChange: (value: string) => void;
    mounted: boolean;
}

export const FullscreenSetting = ({ fullscreenDefault, onFullscreenDefaultChange, mounted }: FullscreenSettingProps) => {
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-primary">Fullscreen Apps</p>
                <p className="text-sm text-tertiary">Open apps in fullscreen by default.</p>
            </div>

            {mounted ? (
                <RadioGroups.RadioButton
                    aria-label="Fullscreen default"
                    orientation="horizontal"
                    value={fullscreenDefault ? "on" : "off"}
                    onChange={onFullscreenDefaultChange}
                    items={fullscreenItems}
                    className="flex-nowrap overflow-x-auto"
                />
            ) : (
                <div className="h-[88px]" />
            )}
        </div>
    );
};
