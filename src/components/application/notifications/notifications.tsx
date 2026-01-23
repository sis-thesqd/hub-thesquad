"use client";

import type { FC, ComponentType } from "react";
import { X } from "@untitledui/icons";
import { cx } from "@/utils/cx";

type NotificationColor = "default" | "success" | "warning" | "error";

interface IconNotificationProps {
    title: string;
    description?: string;
    confirmLabel?: string;
    dismissLabel?: string;
    color?: NotificationColor;
    icon?: ComponentType<{ className?: string }>;
    onClose?: () => void;
    onConfirm?: () => void;
    onDismiss?: () => void;
}

const colorStyles: Record<NotificationColor, { container: string; icon: string }> = {
    default: {
        container: "bg-primary border-secondary",
        icon: "bg-secondary text-fg-secondary",
    },
    success: {
        container: "bg-primary border-success_subtle",
        icon: "bg-success_secondary text-success_primary",
    },
    warning: {
        container: "bg-primary border-warning_subtle",
        icon: "bg-warning_secondary text-warning_primary",
    },
    error: {
        container: "bg-primary border-error_subtle",
        icon: "bg-error_secondary text-error_primary",
    },
};

export const IconNotification: FC<IconNotificationProps> = ({
    title,
    description,
    confirmLabel,
    dismissLabel,
    color = "default",
    icon: Icon,
    onClose,
    onConfirm,
    onDismiss,
}) => {
    const styles = colorStyles[color];

    return (
        <div
            className={cx(
                "flex w-full max-w-sm gap-4 rounded-xl border p-4 shadow-lg",
                styles.container
            )}
        >
            {Icon && (
                <div
                    className={cx(
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        styles.icon
                    )}
                >
                    <Icon className="size-5" />
                </div>
            )}
            <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-primary">{title}</p>
                    {description && (
                        <p className="text-sm text-tertiary">{description}</p>
                    )}
                </div>
                {(confirmLabel || dismissLabel) && (
                    <div className="flex gap-3">
                        {dismissLabel && (
                            <button
                                type="button"
                                onClick={onDismiss ?? onClose}
                                className="text-sm font-semibold text-tertiary hover:text-secondary"
                            >
                                {dismissLabel}
                            </button>
                        )}
                        {confirmLabel && (
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="text-sm font-semibold text-brand_primary hover:text-brand_secondary"
                            >
                                {confirmLabel}
                            </button>
                        )}
                    </div>
                )}
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="flex size-5 shrink-0 items-center justify-center text-fg-quaternary hover:text-fg-secondary"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
};
