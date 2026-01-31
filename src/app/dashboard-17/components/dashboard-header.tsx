"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderClosed, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { AnimatedGroup } from "@/components/base/animated-group/animated-group";
import { getIconByName } from "@/utils/icon-map";
import type { ActiveEntryInfo } from "@/components/app/directory-app/types";

interface DashboardHeaderProps {
    isHomePage: boolean;
    isFavoritesPage: boolean;
    firstName: string | undefined;
    hasLoadedName: boolean;
    activeEntryInfo: ActiveEntryInfo;
    headerContent: React.ReactNode;
    hasDepartments: boolean;
    onNewFolder: () => void;
    onNewPage: () => void;
}

export const DashboardHeader = ({
    isHomePage,
    isFavoritesPage,
    firstName,
    hasLoadedName,
    activeEntryInfo,
    headerContent,
    hasDepartments,
    onNewFolder,
    onNewPage,
}: DashboardHeaderProps) => {
    const router = useRouter();

    return (
        <div className="flex flex-col justify-between gap-4 px-4 lg:flex-row lg:items-center">
            {isHomePage && hasLoadedName ? (
                <p className="text-xl font-semibold text-primary lg:text-display-xs">
                    <AnimatedGroup staggerDelay={0.09} distance={4}>
                        <span>Hello,</span>
                        <span className="inline-block w-2" aria-hidden="true"></span>
                        <span>{firstName}</span>
                    </AnimatedGroup>
                </p>
            ) : isFavoritesPage ? (
                <p className="text-xl font-semibold text-primary lg:text-display-xs">Favorites</p>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex size-8 items-center justify-center rounded-md text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary"
                        title="Go back"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    {activeEntryInfo && !activeEntryInfo.isPage && (
                        <p className="flex items-center text-lg font-semibold text-primary">
                            {activeEntryInfo.emoji && <span className="mr-2">{activeEntryInfo.emoji}</span>}
                            {activeEntryInfo.icon && (() => {
                                const Icon = getIconByName(activeEntryInfo.icon, FolderClosed);
                                return <Icon className="mr-2 size-5 text-fg-quaternary" />;
                            })()}
                            {activeEntryInfo.name}
                        </p>
                    )}
                    <div className="ml-auto">{headerContent}</div>
                </>
            )}
            {!isFavoritesPage && isHomePage && hasDepartments && (
                <div className="flex gap-2">
                    <Button color="secondary" size="sm" iconLeading={Plus} onClick={onNewFolder}>
                        New folder
                    </Button>
                    <Button color="primary" size="sm" iconLeading={Plus} onClick={onNewPage}>
                        New page
                    </Button>
                </div>
            )}
        </div>
    );
};
