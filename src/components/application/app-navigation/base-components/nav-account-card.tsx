"use client";

import type { FC, HTMLAttributes } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Placement } from "@react-types/overlays";
import { ChevronSelectorVertical, LogOut01, Monitor01, Moon01, Sun } from "@untitledui/icons";
import { useTheme } from "next-themes";
import { useFocusManager } from "react-aria";
import type { DialogProps as AriaDialogProps } from "react-aria-components";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover, OverlayTriggerStateContext } from "react-aria-components";
import { useContext } from "react";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useAuth } from "@/providers/auth-provider";
import { cx } from "@/utils/cx";

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "?";
};

export const NavAccountMenu = ({
    className,
    onClose,
    ...dialogProps
}: AriaDialogProps & { className?: string; onClose?: () => void }) => {
    const focusManager = useFocusManager();
    const dialogRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { signOut, worker } = useAuth();
    const { theme, setTheme } = useTheme();

    const fullName = [worker?.given_name, worker?.family_name].filter(Boolean).join(" ") || "User";

    const handleSignOut = useCallback(async () => {
        await signOut();
        router.push("/login");
    }, [signOut, router]);

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    focusManager?.focusNext({ tabbable: true, wrap: true });
                    break;
                case "ArrowUp":
                    focusManager?.focusPrevious({ tabbable: true, wrap: true });
                    break;
            }
        },
        [focusManager],
    );

    useEffect(() => {
        const element = dialogRef.current;
        if (element) {
            element.addEventListener("keydown", onKeyDown);
        }

        return () => {
            if (element) {
                element.removeEventListener("keydown", onKeyDown);
            }
        };
    }, [onKeyDown]);

    return (
        <AriaDialog
            {...dialogProps}
            ref={dialogRef}
            className={cx("w-66 rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden", className)}
        >
            <div className="rounded-xl bg-primary ring-1 ring-secondary">
                <div className="flex flex-col gap-0.5 py-1.5">
                    <div className="px-3 py-2">
                        <p className="text-xs font-medium text-tertiary">Theme</p>
                    </div>
                    <NavAccountCardMenuItem
                        label="System"
                        icon={Monitor01}
                        onClick={() => setTheme("system")}
                        isSelected={theme === "system"}
                    />
                    <NavAccountCardMenuItem
                        label="Light"
                        icon={Sun}
                        onClick={() => setTheme("light")}
                        isSelected={theme === "light"}
                    />
                    <NavAccountCardMenuItem
                        label="Dark"
                        icon={Moon01}
                        onClick={() => setTheme("dark")}
                        isSelected={theme === "dark"}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-0.5 pt-1 pb-1.5">
                <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-primary">{fullName}</p>
                </div>
                <NavAccountCardMenuItem label="Sign out" icon={LogOut01} shortcut="⌥⇧Q" onClick={handleSignOut} />
            </div>
        </AriaDialog>
    );
};

const NavAccountCardMenuItem = ({
    icon: Icon,
    label,
    shortcut,
    isSelected,
    ...buttonProps
}: {
    icon?: FC<{ className?: string }>;
    label: string;
    shortcut?: string;
    isSelected?: boolean;
} & HTMLAttributes<HTMLButtonElement>) => {
    return (
        <button {...buttonProps} className={cx("group/item w-full cursor-pointer px-1.5 focus:outline-hidden", buttonProps.className)}>
            <div
                className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-md p-2 group-hover/item:bg-primary_hover",
                    // Focus styles.
                    "outline-focus-ring group-focus-visible/item:outline-2 group-focus-visible/item:outline-offset-2",
                    isSelected && "bg-primary_hover",
                )}
            >
                <div className={cx(
                    "flex gap-2 text-sm font-semibold group-hover/item:text-secondary_hover",
                    isSelected ? "text-secondary_hover" : "text-secondary",
                )}>
                    {Icon && <Icon className={cx("size-5", isSelected ? "text-fg-quaternary_hover" : "text-fg-quaternary")} />} {label}
                </div>

                {shortcut && (
                    <kbd className="flex rounded px-1 py-px font-body text-xs font-medium text-tertiary ring-1 ring-secondary ring-inset">{shortcut}</kbd>
                )}
            </div>
        </button>
    );
};

const NavAccountMenuWrapper = () => {
    const state = useContext(OverlayTriggerStateContext);
    return <NavAccountMenu onClose={() => state?.close()} />;
};

export const NavAccountCard = ({
    popoverPlacement,
}: {
    popoverPlacement?: Placement;
}) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const isDesktop = useBreakpoint("lg");
    const { worker, userEmail } = useAuth();

    const displayName = worker?.display_name || worker?.given_name || "User";
    const initials = getInitials(worker?.given_name, worker?.family_name);

    return (
        <div ref={triggerRef} className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <AvatarLabelGroup
                size="md"
                initials={initials}
                title={displayName}
                subtitle={userEmail || ""}
                status="online"
            />

            <div className="absolute top-1.5 right-1.5">
                <AriaDialogTrigger>
                    <AriaButton className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 pressed:bg-primary_hover pressed:text-fg-quaternary_hover">
                        <ChevronSelectorVertical className="size-4 shrink-0" />
                    </AriaButton>
                    <AriaPopover
                        placement={popoverPlacement ?? (isDesktop ? "right bottom" : "top right")}
                        triggerRef={triggerRef}
                        offset={8}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "origin-(--trigger-anchor-point) will-change-transform",
                                isEntering &&
                                    "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                                isExiting &&
                                    "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                            )
                        }
                    >
                        <NavAccountMenuWrapper />
                    </AriaPopover>
                </AriaDialogTrigger>
            </div>
        </div>
    );
};
