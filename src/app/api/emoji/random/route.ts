import { NextRequest, NextResponse } from "next/server";

const EMOJI_API_BASE = "https://emojihub.yurace.pro/api";

// Categories that work well for folder/page icons
const ICON_FRIENDLY_CATEGORIES = [
    "smileys-and-people",
    "animals-and-nature",
    "food-and-drink",
    "activities",
    "travel-and-places",
    "objects",
];

type EmojiHubResponse = {
    name: string;
    category: string;
    group: string;
    htmlCode: string[];
    unicode: string[];
};

// Convert unicode like "U+1F4A9" to actual emoji character
const unicodeToEmoji = (unicode: string): string => {
    const codePoint = parseInt(unicode.replace("U+", ""), 16);
    return String.fromCodePoint(codePoint);
};

// GET /api/emoji/random?n=1&category=smileys-and-people - Fetch random emoji(s)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const count = Math.min(parseInt(searchParams.get("n") ?? "1", 10), 10); // Max 10
        const category = searchParams.get("category");

        const emojis: string[] = [];

        // Fetch multiple emojis if requested
        for (let i = 0; i < count; i++) {
            // Use specified category, or pick a random icon-friendly one
            const selectedCategory = category ?? ICON_FRIENDLY_CATEGORIES[
                Math.floor(Math.random() * ICON_FRIENDLY_CATEGORIES.length)
            ];

            const apiUrl = `${EMOJI_API_BASE}/random/category/${selectedCategory}`;

            const response = await fetch(apiUrl, {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`Emoji API responded with status ${response.status}`);
            }

            const data: EmojiHubResponse = await response.json();

            // Convert first unicode value to emoji
            if (data.unicode && data.unicode.length > 0) {
                const emoji = unicodeToEmoji(data.unicode[0]);
                emojis.push(emoji);
            }
        }

        return NextResponse.json({ emojis });
    } catch (error) {
        console.error("Emoji API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch random emoji" },
            { status: 500 }
        );
    }
}
