"use client";

import { Children, type ReactNode } from "react";
import { motion } from "motion/react";

type AnimatedGroupProps = {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    duration?: number;
    distance?: number;
};

export const AnimatedGroup = ({
    children,
    className,
    staggerDelay = 0.05,
    duration = 0.4,
    distance = 12,
}: AnimatedGroupProps) => {
    const childArray = Children.toArray(children);

    return (
        <span className={className}>
            {childArray.map((child, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: distance }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration,
                        delay: index * staggerDelay,
                        ease: [0.25, 0.1, 0.25, 1],
                    }}
                    style={{ display: "inline-block" }}
                >
                    {child}
                </motion.span>
            ))}
        </span>
    );
};
