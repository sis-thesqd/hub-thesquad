"use client";

import type { FC, MouseEventHandler } from "react";
import { useState, useEffect, useRef } from "react";
import { Pressable } from "react-aria-components";
import { FileCode01, Folder } from "@untitledui/icons";
import Link from "next/link";
import { cx } from "@/utils/cx";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";
import { supabaseFetch } from "@/utils/supabase/rest";

const styles = {
    md: {
        root: "size-10",
        icon: "size-5",
    },
    lg: {
        root: "size-12",
        icon: "size-6",
    },
};

interface NavItemButtonProps {
    /** Whether the collapsible nav item is open. */
    open?: boolean;
    /** URL to navigate to when the button is clicked. */
    href?: string;
    /** Label text for the button. */
    label: string;
    /** Icon component to display. */
    icon: FC<{ className?: string }>;
    /** Whether the button is currently active. */
    current?: boolean;
    /** Size of the button. */
    size?: "md" | "lg";
    /** Handler for click events. */
    onClick?: MouseEventHandler;
    /** Additional CSS classes to apply to the button. */
    className?: string;
    /** Placement of the tooltip. */
    tooltipPlacement?: "top" | "right" | "bottom" | "left";
    /** Department ID to fetch children for. If provided, shows dropdown with children on hover. */
    departmentId?: string;
}

export const NavItemButton = ({
    current: current,
    label,
    href,
    icon: Icon,
    size = "md",
    className,
    tooltipPlacement = "right",
    onClick,
    departmentId,
}: NavItemButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [children, setChildren] = useState<DirectoryEntry[]>([]);
    const [frames, setFrames] = useState<Frame[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const buttonRef = useRef<HTMLAnchorElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isHovered || !departmentId) {
            setChildren([]);
            return;
        }

        let isMounted = true;

        const loadChildren = async () => {
            setIsLoading(true);
            try {
                // Load ALL entries for this department (not just top-level)
                const filter = `department_id=eq.${encodeURIComponent(departmentId)}`;
                const entriesData = await supabaseFetch<DirectoryEntry[]>(
                    `sh_directory?select=id,department_id,parent_id,frame_id,name,slug,sort_order,emoji&${filter}&order=sort_order.asc.nullslast,name.asc`,
                );
                
                // Load frames for reference
                const framesData = await supabaseFetch<Frame[]>("sh_frames?select=id,name,iframe_url,description,department_ids&order=name.asc");
                
                if (isMounted) {
                    setChildren(entriesData);
                    setFrames(framesData);
                }
            } catch (err) {
                console.error("Failed to load children:", err);
                if (isMounted) {
                    setChildren([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadChildren();

        return () => {
            isMounted = false;
        };
    }, [isHovered, departmentId]);

    // Handle hover with delay to prevent closing when moving cursor
    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        // Add a small delay before closing to allow cursor movement
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 100);
    };

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    // Position popover on hover
    useEffect(() => {
        if (!isHovered || !buttonRef.current || !popoverRef.current) return;

        const updatePosition = () => {
            if (!buttonRef.current || !popoverRef.current) return;
            
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const popover = popoverRef.current;
            
            // Position to the right of the button, overlapping slightly to prevent gap
            popover.style.left = `${buttonRect.right + 4}px`;
            popover.style.top = `${buttonRect.top}px`;
        };

        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isHovered, children]);

    // Organize entries hierarchically
    const topLevelFolders = children.filter((entry) => !entry.frame_id && !entry.parent_id);
    
    // Group pages by their parent folder ID (only pages that have a parent folder)
    const pagesByParent = new Map<string, DirectoryEntry[]>();
    const pagesWithParent = new Set<string>(); // Track frame_ids that have a parent
    
    children.forEach((entry) => {
        if (entry.frame_id && entry.parent_id) {
            // Only include pages that have a parent folder (not null)
            if (!pagesByParent.has(entry.parent_id)) {
                pagesByParent.set(entry.parent_id, []);
            }
            pagesByParent.get(entry.parent_id)!.push(entry);
            // Track that this frame_id has a parent
            if (entry.frame_id) {
                pagesWithParent.add(entry.frame_id);
            }
        }
    });
    
    // Only show pages at top level if they have no parent AND are not already shown under a folder
    const topLevelPages = children.filter((entry) => 
        entry.frame_id && 
        !entry.parent_id && 
        !pagesWithParent.has(entry.frame_id)
    );

    const hasChildren = topLevelFolders.length > 0 || topLevelPages.length > 0;
    const showPopover = departmentId && isHovered && !isLoading && hasChildren;
    const showTooltip = departmentId && isHovered && !isLoading && !hasChildren;

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Pressable>
                <a
                    ref={buttonRef}
                    href={href}
                    aria-label={label}
                    onClick={onClick}
                    className={cx(
                        "relative flex w-full cursor-pointer items-center justify-center rounded-md bg-primary p-2 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear select-none hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                        current && "bg-active text-fg-quaternary_hover hover:bg-secondary_hover",
                        styles[size].root,
                        className,
                    )}
                >
                    <Icon aria-hidden="true" className={cx("shrink-0 transition-inherit-all", styles[size].icon)} />
                </a>
            </Pressable>

            {/* Tooltip for departments with no children */}
            {showTooltip && (
                <div
                    ref={popoverRef}
                    className="fixed z-50 origin-left rounded-lg bg-primary px-3 py-2 shadow-lg ring-1 ring-secondary_alt animate-in fade-in slide-in-from-left-0.5 duration-150"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <span className="whitespace-nowrap text-sm font-semibold text-secondary">
                        {label}
                    </span>
                </div>
            )}

            {showPopover && (
                <div
                    ref={popoverRef}
                    className="fixed z-50 w-64 max-h-96 origin-left overflow-auto rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt py-1 animate-in fade-in slide-in-from-left-0.5 duration-150"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Top-level pages (no parent folder) */}
                    {topLevelPages.length > 0 && (
                        <>
                            {topLevelPages.map((page) => {
                                const pageHref = `/${page.department_id}/${page.slug}`;
                                return (
                                    <Link
                                        key={page.id}
                                        href={pageHref}
                                        className="block px-1.5 py-px outline-hidden"
                                    >
                                        <div className="flex items-center rounded-md px-2.5 py-2 transition duration-100 ease-linear hover:bg-primary_hover">
                                            {page.emoji ? (
                                                <span className="mr-2 text-base">{page.emoji}</span>
                                            ) : (
                                                <FileCode01
                                                    aria-hidden="true"
                                                    className="mr-2 size-4 shrink-0 stroke-[2.25px] text-fg-quaternary"
                                                />
                                            )}
                                            <span className="grow truncate text-sm font-semibold text-secondary">
                                                {page.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                            {topLevelFolders.length > 0 && <div className="my-1 h-px w-full bg-border-secondary" />}
                        </>
                    )}
                    
                    {/* Folders with their child pages nested underneath */}
                    {topLevelFolders.map((folder) => {
                        const folderHref = `/${folder.department_id}/${folder.slug}`;
                        const folderPages = pagesByParent.get(folder.id) || [];

                        return (
                            <div key={folder.id}>
                                <Link
                                    href={folderHref}
                                    className="block px-1.5 py-px outline-hidden"
                                >
                                    <div className="flex items-center rounded-md px-2.5 py-2 transition duration-100 ease-linear hover:bg-primary_hover">
                                        {folder.emoji ? (
                                            <span className="mr-2 text-base">{folder.emoji}</span>
                                        ) : (
                                            <Folder
                                                aria-hidden="true"
                                                className="mr-2 size-4 shrink-0 stroke-[2.25px] text-fg-quaternary"
                                            />
                                        )}
                                        <span className="grow truncate text-sm font-semibold text-secondary">
                                            {folder.name}
                                        </span>
                                    </div>
                                </Link>

                                {/* Child pages nested under the folder */}
                                {folderPages.length > 0 && (
                                    <div className="ml-6 pl-1">
                                        {folderPages.map((page) => {
                                            const pageHref = `/${page.department_id}/${page.slug}`;
                                            return (
                                                <Link
                                                    key={page.id}
                                                    href={pageHref}
                                                    className="block px-1.5 py-px outline-hidden"
                                                >
                                                    <div className="flex items-center rounded-md px-2.5 py-2 transition duration-100 ease-linear hover:bg-primary_hover">
                                                        {page.emoji ? (
                                                            <span className="mr-2 text-base">{page.emoji}</span>
                                                        ) : (
                                                            <FileCode01
                                                                aria-hidden="true"
                                                                className="mr-2 size-4 shrink-0 stroke-[2.25px] text-fg-quaternary"
                                                            />
                                                        )}
                                                        <span className="grow truncate text-sm font-semibold text-secondary">
                                                            {page.name}
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
