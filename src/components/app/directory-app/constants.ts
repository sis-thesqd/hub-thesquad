import type { FormState } from "./types";

export const emptyForm: FormState = {
    name: "",
    slug: "",
    iframeUrl: "",
    description: "",
    emoji: "",
};

// Common emojis for random selection
export const randomEmojis = [
    "📁", "📂", "📄", "📊", "📈", "📋", "📌", "📎", "📝", "📑",
    "🗂️", "🗃️", "🗄️", "💼", "🎯", "🚀", "⭐", "✨", "💡", "🔧",
    "⚙️", "🛠️", "📦", "🎨", "🎬", "📸", "🎵", "🎮", "🌟", "💎",
    "🔮", "🎪", "🎭", "🎪", "🏆", "🎖️", "🏅", "🥇", "📍", "🔗",
    "🧩", "🎲", "♟️", "🧮", "📐", "📏", "🔬", "🔭", "💻", "🖥️",
    "📱", "⌨️", "🖱️", "💾", "💿", "📀", "🎛️", "🔊", "📡", "🔋",
];

export const getRandomEmoji = (): string => {
    return randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
};
