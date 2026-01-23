"use client";

import { useState, useRef, useEffect } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { FaceSmile } from "@untitledui/icons";

type EmojiPickerFieldProps = {
    value: string;
    onChange: (emoji: string) => void;
    label?: string;
};

export const EmojiPickerField = ({ value, onChange, label = "Icon" }: EmojiPickerFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onChange(emojiData.emoji);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange("");
    };

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-secondary">{label}</label>
            <div className="flex items-center gap-2">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex size-12 items-center justify-center rounded-lg border border-secondary_alt bg-primary text-2xl transition hover:bg-primary_hover"
                >
                    {value ? (
                        <span>{value}</span>
                    ) : (
                        <FaceSmile className="size-6 text-fg-quaternary" />
                    )}
                </button>
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-sm text-tertiary transition hover:text-secondary"
                    >
                        Remove
                    </button>
                )}
                {!value && (
                    <span className="text-sm text-quaternary">Click to select an icon</span>
                )}
            </div>
            {isOpen && (
                <div ref={pickerRef} className="absolute left-0 top-full z-50 mt-2">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.AUTO}
                        width={350}
                        height={400}
                        searchPlaceholder="Search emoji..."
                        previewConfig={{ showPreview: false }}
                    />
                </div>
            )}
        </div>
    );
};
