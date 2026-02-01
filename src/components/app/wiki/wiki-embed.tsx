"use client";

import { useState } from "react";
import { ZoomIn, XClose } from "@untitledui/icons";
import { Modal, ModalOverlay, Dialog, DialogTrigger } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";

type WikiEmbedProps = {
    src?: string;
    title?: string;
};

export const WikiEmbed = ({ src, title }: WikiEmbedProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!src) return null;

    return (
        <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-secondary_alt bg-primary">
                <div className="aspect-video w-full">
                    <iframe
                        src={src}
                        title={title || "Embedded content"}
                        className="h-full w-full"
                        allow="fullscreen; clipboard-read; clipboard-write"
                    />
                </div>
            </div>
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
                                <div className="flex items-center justify-end">
                                    <Button
                                        size="sm"
                                        color="tertiary"
                                        iconLeading={<XClose className="size-4" />}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                                <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-secondary_alt bg-primary">
                                    <iframe
                                        src={src}
                                        title={title || "Embedded content"}
                                        className="h-full w-full"
                                        allow="fullscreen; clipboard-read; clipboard-write"
                                    />
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>
        </div>
    );
};
