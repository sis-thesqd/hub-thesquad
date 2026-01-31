"use client";

import { ChevronUp, ChevronDown, X, Plus, Save01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { NavigationPage } from "@/utils/supabase/types";

interface DivisionOrderSectionProps {
    editedDivisionOrder: string[];
    editedPages: NavigationPage[];
    hasDivisionOrderChanges: boolean;
    isSaving: boolean;
    onSaveDivisionOrder: () => void;
    onMoveDivision: (index: number, direction: "up" | "down") => void;
    onOpenDeleteDivision: (division: string) => void;
    onOpenAddDivisionModal: () => void;
}

export const DivisionOrderSection = ({
    editedDivisionOrder,
    editedPages,
    hasDivisionOrderChanges,
    isSaving,
    onSaveDivisionOrder,
    onMoveDivision,
    onOpenDeleteDivision,
    onOpenAddDivisionModal,
}: DivisionOrderSectionProps) => {
    return (
        <>
            <div>
                <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch pb-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-primary">Division Order</h2>
                        {hasDivisionOrderChanges && (
                            <Button
                                color="primary"
                                size="sm"
                                iconLeading={Save01}
                                onClick={onSaveDivisionOrder}
                                isDisabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Order"}
                            </Button>
                        )}
                    </div>
                    <p className="text-sm text-tertiary">
                        Manage divisions and their display order in the navigation sidebar.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                {editedDivisionOrder.map((division, index) => {
                    const pagesInDivision = editedPages.filter(p => p.division === division);
                    return (
                        <div
                            key={division}
                            className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                    <span className="text-sm font-semibold text-fg-quaternary">{index + 1}</span>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-primary">{division}</p>
                                    <p className="text-xs text-tertiary">{pagesInDivision.length} page{pagesInDivision.length !== 1 ? "s" : ""}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onMoveDivision(index, "up")}
                                    disabled={index === 0}
                                    className="rounded p-1.5 text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg-quaternary"
                                    title="Move up"
                                >
                                    <ChevronUp className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onMoveDivision(index, "down")}
                                    disabled={index === editedDivisionOrder.length - 1}
                                    className="rounded p-1.5 text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg-quaternary"
                                    title="Move down"
                                >
                                    <ChevronDown className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onOpenDeleteDivision(division)}
                                    className="rounded p-1.5 text-fg-quaternary transition hover:bg-error-secondary hover:text-error-primary"
                                    title="Remove"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-16">
                    <Button
                        color="secondary"
                        size="sm"
                        iconLeading={Plus}
                        onClick={onOpenAddDivisionModal}
                    >
                        Add Division
                    </Button>
                </div>
            </div>
        </>
    );
};
