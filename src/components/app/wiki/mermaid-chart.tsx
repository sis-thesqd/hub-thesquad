"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Minus, Plus, RefreshCw01, XClose, ZoomIn } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalOverlay, Dialog, DialogTrigger } from "@/components/application/modals/modal";
import { cx } from "@/utils/cx";

type MermaidChartProps = {
    code: string;
};

const getMermaidConfig = () => ({
    startOnLoad: false,
    securityLevel: "strict" as const,
    theme: "base" as const,
    themeVariables: {
        background: "transparent",
        primaryColor: "#F5F5FF",
        primaryTextColor: "#1A1A1A",
        primaryBorderColor: "#C7C9FF",
        lineColor: "#7D7D7D",
        textColor: "#1A1A1A",
        fontFamily: "var(--font-body)",
    },
});

export const MermaidChart = ({ code }: MermaidChartProps) => {
    const id = useId().replace(/:/g, "");
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [svg, setSvg] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        let isMounted = true;

        const renderMermaid = async () => {
            try {
                const mermaid = (await import("mermaid")).default;
                mermaid.initialize(getMermaidConfig());
                const { svg } = await mermaid.render(`mermaid-${id}`, code);
                if (isMounted) {
                    setSvg(svg);
                }
            } catch (error) {
                console.error("Failed to render mermaid chart:", error);
                if (isMounted) {
                    setSvg("");
                }
            }
        };

        renderMermaid();

        return () => {
            isMounted = false;
        };
    }, [code, id]);

    useEffect(() => {
        if (!isOpen) {
            setScale(1);
            setOffset({ x: 0, y: 0 });
        }
    }, [isOpen]);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStart.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || !dragStart.current) return;
        setOffset({
            x: event.clientX - dragStart.current.x,
            y: event.clientY - dragStart.current.y,
        });
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        dragStart.current = null;
    };

    const controls = useMemo(() => (
        <div className="flex items-center gap-2 rounded-full bg-primary px-2 py-1 shadow-sm ring-1 ring-secondary_alt">
            <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.4, +(s - 0.1).toFixed(2)))}
                className="flex size-7 items-center justify-center rounded-full text-fg-quaternary transition hover:bg-secondary"
                title="Zoom out"
            >
                <Minus className="size-4" />
            </button>
            <span className="text-xs font-medium text-tertiary">{Math.round(scale * 100)}%</span>
            <button
                type="button"
                onClick={() => setScale((s) => Math.min(2.5, +(s + 0.1).toFixed(2)))}
                className="flex size-7 items-center justify-center rounded-full text-fg-quaternary transition hover:bg-secondary"
                title="Zoom in"
            >
                <Plus className="size-4" />
            </button>
            <button
                type="button"
                onClick={() => {
                    setScale(1);
                    setOffset({ x: 0, y: 0 });
                }}
                className="flex size-7 items-center justify-center rounded-full text-fg-quaternary transition hover:bg-secondary"
                title="Reset"
            >
                <RefreshCw01 className="size-4" />
            </button>
        </div>
    ), [scale]);

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="relative rounded-2xl border border-secondary_alt bg-primary p-4"
                dangerouslySetInnerHTML={{ __html: svg || "<div class='text-sm text-tertiary'>Unable to render diagram.</div>" }}
            />
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full border border-secondary_alt bg-primary px-4 py-2 text-sm font-medium text-secondary shadow-sm transition hover:bg-primary_hover"
            >
                <ZoomIn className="size-4" />
                Expand
            </button>

            <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
                <button type="button" className="hidden" />
                <ModalOverlay>
                    <Modal className="w-[min(1200px,95vw)]">
                        <Dialog className="w-full">
                            <div className="relative flex h-[80vh] w-full flex-col rounded-2xl bg-primary p-4 shadow-xl ring-1 ring-secondary_alt">
                                <div className="flex items-center justify-end gap-2">
                                    {controls}
                                    <Button
                                        size="sm"
                                        color="tertiary"
                                        iconLeading={<XClose className="size-4" />}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                                <div
                                    className="mt-4 flex-1 overflow-hidden rounded-2xl border border-secondary_alt bg-primary"
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerLeave={handlePointerUp}
                                >
                                    <div
                                        className={cx("h-full w-full cursor-grab", isDragging && "cursor-grabbing")}
                                        style={{
                                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                            transformOrigin: "center",
                                        }}
                                        dangerouslySetInnerHTML={{ __html: svg || "" }}
                                    />
                                </div>
                                <p className="mt-3 text-center text-xs text-tertiary">Drag to pan • Scroll to zoom</p>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>
        </div>
    );
};
