"use client";

import * as RadioGroups from "@/components/base/radio-groups/radio-groups";
import { themeItems } from "./theme-items";

interface ThemeSettingProps {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    mounted: boolean;
}

export const ThemeSetting = ({ theme, setTheme, mounted }: ThemeSettingProps) => {
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-primary">Theme</p>
                <p className="text-sm text-tertiary">Select your preferred theme.</p>
            </div>

            {mounted ? (
                <RadioGroups.RadioButton
                    aria-label="Theme"
                    orientation="horizontal"
                    value={theme}
                    onChange={(value) => setTheme(value)}
                    items={themeItems}
                    className="flex-nowrap overflow-x-auto"
                />
            ) : (
                <div className="h-[88px]" />
            )}
        </div>
    );
};
