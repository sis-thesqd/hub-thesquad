"use client";

import type { FC } from "react";
import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, LogOut01, SearchLg, Star01 } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button as AriaButton, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { Link as AriaLink } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useAuth } from "@/providers/auth-provider";
import { cx } from "@/utils/cx";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { favoritesKeys, fetchFavorites } from "@/hooks/use-favorites";
import { usePrefetchDirectory } from "@/hooks/use-directory-queries";
import { MobileNavigationHeader } from "../base-components/mobile-header";
import { NavAccountMenu } from "../base-components/nav-account-card";
import { NavItemBase } from "../base-components/nav-item";
import { NavList } from "../base-components/nav-list";
import type { NavItemType } from "../config";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "?";
};

interface SidebarNavigationSlimProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** List of items to display. */
    items: (NavItemType & { icon: FC<{ className?: string }> })[];
    /** List of footer items to display. */
    footerItems?: (NavItemType & { icon: FC<{ className?: string }> })[];
    /** Whether to hide the border. */
    hideBorder?: boolean;
    /** Whether to hide the right side border. */
    hideRightBorder?: boolean;
    /** Handler for search button click. */
    onSearchClick?: () => void;
}

export const SidebarNavigationSlim = ({ activeUrl, items, footerItems = [], hideBorder, hideRightBorder, onSearchClick }: SidebarNavigationSlimProps) => {
    const { worker, userEmail } = useAuth();
    const appendUrlParams = useAppendUrlParams();
    const queryClient = useQueryClient();
    const { prefetchAll: prefetchDirectory } = usePrefetchDirectory();
    const activeItem = [...items, ...footerItems].find((item) => item.href === activeUrl || item.items?.some((subItem) => subItem.href === activeUrl));
    const fallbackItem = items[0] || footerItems[0] || { label: "", href: "", icon: Star01 };
    const [currentItem, setCurrentItem] = useState(activeItem || fallbackItem);
    const [isHovering, setIsHovering] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        if (stored !== null) {
            setIsCollapsed(stored === "true");
        }
    }, []);

    const toggleCollapsed = useCallback(() => {
        setIsCollapsed((prev) => {
            const newValue = !prev;
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
            return newValue;
        });
    }, []);

    const displayName = worker?.display_name || worker?.given_name || "User";
    const initials = getInitials(worker?.given_name, worker?.family_name);

    const isSecondarySidebarVisible = isHovering && Boolean(currentItem.items?.length);

    // Prefetch favorites data when hovering over favorites link
    const handleFavoritesHover = useCallback(() => {
        if (!worker?.id) return;

        const queryKey = favoritesKeys.user(worker.id);

        // Use ensureQueryData which waits for data to be available
        // This ensures data is ready before navigation happens
        queryClient.ensureQueryData({
            queryKey,
            queryFn: () => fetchFavorites(worker.id!),
            staleTime: 1 * 60 * 1000, // 1 minute
        });

        // Prefetch directory data (needed for favorites view)
        prefetchDirectory();
    }, [worker?.id, queryClient, prefetchDirectory]);

    const EXPANDED_WIDTH = 250;
    const COLLAPSED_WIDTH = 64;
    const MAIN_SIDEBAR_WIDTH = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
    const SECONDARY_SIDEBAR_WIDTH = 268;

    const mainSidebar = (
        <motion.aside
            initial={false}
            animate={{ width: MAIN_SIDEBAR_WIDTH }}
            transition={{ type: "spring", damping: 26, stiffness: 220, bounce: 0 }}
            className={cx(
                "group flex h-full max-h-full overflow-y-auto overflow-x-hidden py-1 pl-1",
                isSecondarySidebarVisible && "bg-primary",
            )}
        >
            <div
                className={cx(
                    "flex w-full flex-col justify-between rounded-xl bg-primary pt-4 ring-1 ring-secondary transition duration-300 ring-inset",
                    hideBorder && !isSecondarySidebarVisible && "ring-transparent",
                )}
            >
                <div className={cx("flex items-center", isCollapsed ? "px-2.5" : "gap-2 px-2")}>
                    <a href="/" className="cursor-pointer flex items-center gap-2">
                        <img src="/sqd-badge.png" alt="Squad Logo" className="w-7" />
                        {!isCollapsed && <span className="text-md font-semibold text-primary whitespace-nowrap">Squad Hub</span>}
                    </a>
                </div>

                <ul className={cx("mt-4 flex flex-col gap-0.5", isCollapsed ? "px-2" : "px-2")}>
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = currentItem?.href === item.href;
                        const hrefWithParams = item.href ? appendUrlParams(item.href) : item.href;

                        if (isCollapsed) {
                            return (
                                <li key={item.label} title={item.label}>
                                    <AriaLink
                                        href={hrefWithParams!}
                                        className={cx(
                                            "flex size-8 items-center justify-center rounded-md transition hover:bg-primary_hover",
                                            isCurrent && "bg-active"
                                        )}
                                        onClick={() => setCurrentItem(item)}
                                    >
                                        <Icon className={cx("size-5", isCurrent ? "text-fg-secondary" : "text-fg-quaternary")} />
                                    </AriaLink>
                                </li>
                            );
                        }

                        return (
                            <li key={item.label}>
                                <AriaLink
                                    href={hrefWithParams!}
                                    className={cx(
                                        "flex items-center gap-2 rounded-md px-1 py-1.5 transition hover:bg-primary_hover",
                                        isCurrent && "bg-active"
                                    )}
                                    onClick={() => setCurrentItem(item)}
                                >
                                    <Icon className={cx("size-5 shrink-0", isCurrent ? "text-fg-secondary" : "text-fg-quaternary")} />
                                    <span className={cx("text-sm font-medium truncate", isCurrent ? "text-secondary_hover" : "text-secondary")}>{item.label}</span>
                                </AriaLink>
                            </li>
                        );
                    })}
                </ul>
                <div className={cx("mt-auto flex flex-col gap-0.5 py-4", isCollapsed ? "px-2" : "px-2")}>
                    {footerItems.length > 0 && (
                        <ul className="flex flex-col gap-0.5 mb-1">
                            {footerItems.map((item) => {
                                const Icon = item.icon;
                                const isCurrent = currentItem?.href === item.href;
                                const hrefWithParams = item.href ? appendUrlParams(item.href) : item.href;

                                if (isCollapsed) {
                                    return (
                                        <li key={item.label}>
                                            <AriaLink
                                                href={hrefWithParams!}
                                                className={cx(
                                                    "flex size-8 items-center justify-center rounded-md transition hover:bg-primary_hover",
                                                    isCurrent && "bg-active"
                                                )}
                                                onClick={() => setCurrentItem(item)}
                                                title={item.label}
                                            >
                                                <Icon className={cx("size-5", isCurrent ? "text-fg-secondary" : "text-fg-quaternary")} />
                                            </AriaLink>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={item.label}>
                                        <AriaLink
                                            href={hrefWithParams!}
                                            className={cx(
                                                "flex items-center gap-2 rounded-md px-2.5 py-1.5 transition hover:bg-primary_hover",
                                                isCurrent && "bg-active"
                                            )}
                                            onClick={() => setCurrentItem(item)}
                                        >
                                            <Icon className={cx("size-5 shrink-0", isCurrent ? "text-fg-secondary" : "text-fg-quaternary")} />
                                            <span className={cx("text-sm font-medium truncate", isCurrent ? "text-secondary_hover" : "text-secondary")}>{item.label}</span>
                                        </AriaLink>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div onMouseEnter={handleFavoritesHover}>
                        {isCollapsed ? (
                            <AriaLink
                                href={appendUrlParams("/favorites")}
                                className={cx(
                                    "flex size-8 items-center justify-center rounded-md transition hover:bg-primary_hover",
                                    activeUrl === "/favorites" && "bg-active"
                                )}
                                title="Favorites"
                            >
                                <Star01 className={cx("size-5", activeUrl === "/favorites" ? "text-fg-secondary" : "text-fg-quaternary")} />
                            </AriaLink>
                        ) : (
                            <AriaLink
                                href={appendUrlParams("/favorites")}
                                className={cx(
                                    "flex items-center gap-2 rounded-md px-2.5 py-1.5 transition hover:bg-primary_hover",
                                    activeUrl === "/favorites" && "bg-active"
                                )}
                            >
                                <Star01 className={cx("size-5 shrink-0", activeUrl === "/favorites" ? "text-fg-secondary" : "text-fg-quaternary")} />
                                <span className={cx("text-sm font-medium", activeUrl === "/favorites" ? "text-secondary_hover" : "text-secondary")}>Favorites</span>
                            </AriaLink>
                        )}
                    </div>

                    {onSearchClick && (
                        isCollapsed ? (
                            <button
                                type="button"
                                onClick={onSearchClick}
                                className="flex size-8 items-center justify-center rounded-md text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary"
                                title="Search (⌘K)"
                            >
                                <SearchLg className="size-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onSearchClick}
                                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary"
                                title="Search (⌘K)"
                            >
                                <SearchLg className="size-5 shrink-0" />
                                <span className="text-sm font-medium text-secondary">Search</span>
                            </button>
                        )
                    )}

                    <div className={cx("mt-2 pt-2 border-secondary", isCollapsed ? "flex flex-col items-center gap-1" : "")}>
                        <AriaDialogTrigger>
                            <AriaButton
                                className={({ isPressed, isFocused }) =>
                                    cx(
                                        "group relative flex cursor-pointer items-center rounded-md transition hover:bg-primary_hover",
                                        isCollapsed ? "size-8 justify-center" : "w-full gap-2.5 px-2 py-1.5",
                                        (isPressed || isFocused) && "outline-2 outline-offset-2 outline-focus-ring"
                                    )
                                }
                            >
                                <Avatar initials={initials} size="sm" alt={displayName} />
                                {!isCollapsed && (
                                    <div className="flex flex-col items-start text-left min-w-0">
                                        <span className="text-sm font-medium text-primary truncate w-full">{displayName}</span>
                                    </div>
                                )}
                            </AriaButton>
                            <AriaPopover
                                placement="right bottom"
                                offset={8}
                                crossOffset={6}
                                className={({ isEntering, isExiting }) =>
                                    cx(
                                        "will-change-transform",
                                        isEntering &&
                                            "duration-300 ease-out animate-in fade-in placement-right:slide-in-from-left-2 placement-top:slide-in-from-bottom-2 placement-bottom:slide-in-from-top-2",
                                        isExiting &&
                                            "duration-150 ease-in animate-out fade-out placement-right:slide-out-to-left-2 placement-top:slide-out-to-bottom-2 placement-bottom:slide-out-to-top-2",
                                    )
                                }
                            >
                                <NavAccountMenu />
                            </AriaPopover>
                        </AriaDialogTrigger>

                        <button
                            type="button"
                            onClick={toggleCollapsed}
                            className={cx(
                                "flex items-center rounded-md text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary",
                                isCollapsed ? "size-8 justify-center" : "gap-2 px-1 py-1.5 w-full"
                            )}
                            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {isCollapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5 shrink-0" />}
                            {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
                        </button>
                    </div>
                </div>
            </div>
        </motion.aside>
    );

    const secondarySidebar = (
        <AnimatePresence initial={false}>
            {isSecondarySidebarVisible && (
                <motion.div
                    initial={{ width: 0, borderColor: "var(--color-border-secondary)" }}
                    animate={{ width: SECONDARY_SIDEBAR_WIDTH, borderColor: "var(--color-border-secondary)" }}
                    exit={{ width: 0, borderColor: "rgba(0,0,0,0)", transition: { borderColor: { type: "tween", delay: 0.05 } } }}
                    transition={{ type: "spring", damping: 26, stiffness: 220, bounce: 0 }}
                    className={cx(
                        "relative h-full overflow-x-hidden overflow-y-auto bg-primary",
                        !(hideBorder || hideRightBorder) && "box-content border-r-[1.5px]",
                    )}
                >
                    <div style={{ width: SECONDARY_SIDEBAR_WIDTH }} className="flex h-full flex-col px-4 pt-6">
                        <h3 className="text-sm font-semibold text-brand-secondary">{currentItem.label}</h3>
                        <ul className="py-2">
                            {currentItem.items?.map((item) => (
                                <li key={item.label} className="py-0.5">
                                    <NavItemBase current={activeUrl === item.href} href={item.href} icon={item.icon} badge={item.badge} type="link">
                                        {item.label}
                                    </NavItemBase>
                                </li>
                            ))}
                        </ul>
                        <div className="sticky bottom-0 mt-auto flex justify-between border-secondary bg-primary px-2 py-5">
                            <div>
                                <p className="text-sm font-semibold text-primary">{displayName}</p>
                                <p className="text-sm text-tertiary">{userEmail || ""}</p>
                            </div>
                            <div className="absolute top-2.5 right-0">
                                <ButtonUtility size="sm" color="tertiary" tooltip="Log out" icon={LogOut01} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {/* Desktop sidebar navigation */}
            <div
                className="z-50 hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex"
                onPointerEnter={() => setIsHovering(true)}
                onPointerLeave={() => setIsHovering(false)}
            >
                {mainSidebar}
                {secondarySidebar}
            </div>

            {/* Placeholder to take up physical space because the real sidebar has `fixed` position. */}
            <motion.div
                initial={false}
                animate={{ paddingLeft: MAIN_SIDEBAR_WIDTH }}
                transition={{ type: "spring", damping: 26, stiffness: 220, bounce: 0 }}
                className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"
            />

            {/* Mobile header navigation */}
            <MobileNavigationHeader>
                <aside className="group flex h-full max-h-full w-full max-w-full flex-col justify-between overflow-y-auto bg-primary pt-4">
                    <div className="flex items-center gap-2.5">
                        <a href="/" className="cursor-pointer flex items-center gap-2.5">
                            <img src="/sqd-badge.png" alt="Squad Logo" className="w-8" />
                            <span className="text-lg font-semibold text-primary">Squad Hub</span>
                        </a>
                    </div>

                    <NavList items={items} />

                    <div className="mt-auto flex flex-col gap-5 px-2 py-4">
                        <div className="flex flex-col gap-2">
                            <NavItemBase current={activeUrl === "/favorites"} type="link" href={appendUrlParams("/favorites")} icon={Star01}>
                                Favorites
                            </NavItemBase>
                        </div>

                        <div className="relative flex items-center gap-3 border-secondary pt-6 pr-8 pl-2">
                            <AvatarLabelGroup
                                size="md"
                                initials={initials}
                                title={displayName}
                                subtitle={userEmail || ""}
                            />

                            <div className="absolute top-1/2 right-0 -translate-y-1/2">
                                <Button
                                    size="sm"
                                    color="tertiary"
                                    iconLeading={<LogOut01 className="size-5 text-fg-quaternary transition-inherit-all group-hover:text-fg-quaternary_hover" />}
                                    className="p-1.5!"
                                />
                            </div>
                        </div>
                    </div>
                </aside>
            </MobileNavigationHeader>
        </>
    );
};
