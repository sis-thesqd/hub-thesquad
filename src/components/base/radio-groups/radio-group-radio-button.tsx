"use client";

import type { FC } from "react";
import type { RadioGroupProps } from "react-aria-components";
import { Label as AriaLabel, Radio as AriaRadio, RadioGroup as AriaRadioGroup, Text as AriaText } from "react-aria-components";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

type RadioGroupItemType = {
    value: string;
    title: string;
    disabled?: boolean;
    description: string;
    secondaryTitle: string;
    icon: FC<{ className?: string }>;
};

interface RadioGroupRadioButtonProps extends RadioGroupProps {
    size?: "sm" | "md";
    items: RadioGroupItemType[];
    orientation?: "vertical" | "horizontal";
}

export const RadioGroupRadioButton = ({ items, size = "sm", orientation = "vertical", className, ...props }: RadioGroupRadioButtonProps) => {
    return (
        <AriaRadioGroup {...props} className={(state) => cx("flex gap-3", orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col", typeof className === "function" ? className(state) : className)}>
            {items.map((plan) => (
                <AriaRadio
                    isDisabled={plan.disabled}
                    key={plan.value}
                    value={plan.value}
                    className={({ isDisabled, isSelected, isFocusVisible }) =>
                        cx(
                            "relative flex cursor-pointer items-start rounded-xl bg-primary p-4 outline-focus-ring ring-inset w-72",
                            size === "md" ? "gap-3" : "gap-3",
                            isSelected ? "ring-2 ring-brand" : "ring-1 ring-secondary",
                            isDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled_subtle",
                            isFocusVisible && "outline-2 outline-offset-2",
                        )
                    }
                >
                    {({ isSelected, isDisabled, isFocusVisible }) => (
                        <>
                            <div className="flex flex-1 gap-3">
                                <FeaturedIcon
                                    icon={plan.icon}
                                    size={size === "md" ? "md" : "sm"}
                                    color="gray"
                                    theme="modern"
                                    className={cx(isDisabled && "bg-disabled text-fg-disabled")}
                                />

                                <div className={cx("flex flex-col", size === "md" ? "gap-0.5" : "")}>
                                    <AriaLabel className={cx("pointer-events-none flex", size === "md" ? "gap-1.5" : "gap-1")}>
                                        <span className={cx("text-secondary", size === "md" ? "text-md font-medium" : "text-sm font-medium")}>
                                            {plan.title}
                                        </span>
                                        <span className={cx("text-tertiary", size === "md" ? "text-md" : "text-sm")}>{plan.secondaryTitle}</span>
                                    </AriaLabel>
                                    <AriaText slot="description" className={cx("text-tertiary", size === "md" ? "text-md" : "text-sm")}>
                                        {plan.description}
                                    </AriaText>
                                </div>
                            </div>

                            <div
                                className={cx(
                                    "relative inline-flex shrink-0 items-center justify-center rounded-full ring-inset",
                                    size === "md" ? "size-5" : "size-4",
                                    isSelected ? "bg-brand-solid" : "ring-1 ring-primary",
                                    isDisabled && "bg-disabled_subtle ring-1 ring-disabled",
                                    isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                                )}
                            >
                                <div
                                    className={cx(
                                        "absolute rounded-full bg-fg-white opacity-0",
                                        size === "md" ? "size-2" : "size-1.5",
                                        isSelected ? "opacity-100" : "opacity-0",
                                        isDisabled && "bg-fg-disabled_subtle",
                                    )}
                                />
                            </div>
                        </>
                    )}
                </AriaRadio>
            ))}
        </AriaRadioGroup>
    );
};
