"use client";

import { useCallback, useState } from "react";

type UseRandomEmojiReturn = {
    fetchRandomEmoji: () => Promise<string>;
    isLoading: boolean;
};

export const useRandomEmoji = (): UseRandomEmojiReturn => {
    const [isLoading, setIsLoading] = useState(false);

    const fetchRandomEmoji = useCallback(async (): Promise<string> => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/emoji/random");
            if (!response.ok) {
                throw new Error("Failed to fetch emoji");
            }
            const data = await response.json();
            return data.emojis?.[0] ?? "📄";
        } catch (error) {
            console.error("Error fetching random emoji:", error);
            // Fallback to a default emoji on error
            return "📄";
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { fetchRandomEmoji, isLoading };
};
