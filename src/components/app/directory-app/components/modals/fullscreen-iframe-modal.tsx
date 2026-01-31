"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "@untitledui/icons";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { useUrlParams } from "@/hooks/use-url-params";
import { useAuth } from "@/providers/auth-provider";
import type { Frame } from "@/utils/supabase/types";
import { cx } from "@/utils/cx";

const FRAME_VALIDATION_KEY = process.env.NEXT_PUBLIC_FRAME_VALIDATION_KEY;

type FullscreenIframeModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    frame: Frame | null;
    pathSegments?: string[];
};

export const FullscreenIframeModal = ({
    isOpen,
    onOpenChange,
    frame,
    pathSegments = [],
}: FullscreenIframeModalProps) => {
    const urlParams = useUrlParams();
    const { worker, userEmail } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const iframeSrc = useMemo(() => {
        if (!frame?.iframe_url) return "";

        // Ensure URL has a protocol
        let urlString = frame.iframe_url;
        if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
            urlString = `https://${urlString}`;
        }

        try {
            const url = new URL(urlString);

            // Append any additional path segments to the iframe URL
            if (pathSegments.length > 0) {
                const basePath = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
                url.pathname = `${basePath}/${pathSegments.join("/")}`;
            }

            // Merge parent URL params into iframe URL
            urlParams.forEach((value, key) => {
                url.searchParams.set(key, value);
            });

            // Automatically inject worker/user information as URL parameters
            if (worker) {
                if (worker.id && !url.searchParams.has('user_id')) {
                    url.searchParams.set('user_id', worker.id);
                }

                const email = worker.work_email || worker.personal_email || userEmail;
                if (email && !url.searchParams.has('email')) {
                    url.searchParams.set('email', email);
                }

                const name = worker.display_name ||
                    [worker.preferred_given_name || worker.given_name, worker.preferred_family_name || worker.family_name]
                        .filter(Boolean)
                        .join(' ');
                if (name && !url.searchParams.has('name')) {
                    url.searchParams.set('name', name);
                }

                if (worker.department_id && !url.searchParams.has('department_id')) {
                    url.searchParams.set('department_id', worker.department_id);
                }

                if (worker.title && !url.searchParams.has('title')) {
                    url.searchParams.set('title', worker.title);
                }
            }

            return url.toString();
        } catch {
            return urlString;
        }
    }, [frame?.iframe_url, urlParams, pathSegments, worker, userEmail]);

    // Reset loading state when frame changes or modal opens
    useEffect(() => {
        if (isOpen && frame) {
            setIsLoading(true);
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, frame?.id]);

    // Handle frame validation key postMessage communication
    useEffect(() => {
        if (!isOpen) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data === FRAME_VALIDATION_KEY && FRAME_VALIDATION_KEY) {
                if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(FRAME_VALIDATION_KEY, "*");
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [isOpen]);

    if (!frame) return null;

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button id="fullscreen-iframe-modal-trigger" className="hidden" />
            <ModalOverlay className="!p-0">
                <Modal className="!h-full !max-h-none !w-full !max-w-none !rounded-none">
                    <Dialog className="!h-full !w-full">
                        <div className="relative h-dvh w-full bg-primary">
                            {/* Close button - overlaid */}
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="absolute top-3 right-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-lg bg-primary/80 text-fg-quaternary shadow-sm ring-1 ring-secondary backdrop-blur-sm transition hover:bg-primary hover:text-fg-secondary"
                                title="Close fullscreen"
                            >
                                <X className="size-4" />
                            </button>

                            {/* Iframe - full height */}
                            <iframe
                                ref={iframeRef}
                                title={frame.name}
                                src={iframeSrc}
                                className={cx(
                                    "h-full w-full border-0 transition-[filter] duration-300",
                                    isLoading && "blur-sm"
                                )}
                                allow="clipboard-read; clipboard-write; fullscreen;"
                            />
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/50">
                                    <LoadingIndicator type="line-simple" size="md" />
                                </div>
                            )}
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
