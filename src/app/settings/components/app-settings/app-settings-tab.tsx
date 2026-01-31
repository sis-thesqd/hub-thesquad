"use client";

import { ThemeSetting } from "./theme-setting";
import { SidebarSetting } from "./sidebar-setting";
import { FullscreenSetting } from "./fullscreen-setting";

interface AppSettingsTabProps {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    sidebarDefaultExpanded: boolean;
    onSidebarDefaultChange: (value: string) => void;
    fullscreenDefault: boolean;
    onFullscreenDefaultChange: (value: string) => void;
    mounted: boolean;
}

export const AppSettingsTab = ({
    theme,
    setTheme,
    sidebarDefaultExpanded,
    onSidebarDefaultChange,
    fullscreenDefault,
    onFullscreenDefaultChange,
    mounted,
}: AppSettingsTabProps) => {
    return (
        <>
            {/* Appearance Section */}
            <div>
                <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch pb-5">
                    <h2 className="text-lg font-semibold text-primary">Appearance</h2>
                    <p className="text-sm text-tertiary">
                        Customize how Squad Hub looks on your device.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                <ThemeSetting theme={theme} setTheme={setTheme} mounted={mounted} />
                <SidebarSetting
                    sidebarDefaultExpanded={sidebarDefaultExpanded}
                    onSidebarDefaultChange={onSidebarDefaultChange}
                    mounted={mounted}
                />
                <FullscreenSetting
                    fullscreenDefault={fullscreenDefault}
                    onFullscreenDefaultChange={onFullscreenDefaultChange}
                    mounted={mounted}
                />
            </div>
        </>
    );
};
