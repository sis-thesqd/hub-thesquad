import { randomEmojis } from "./random-emojis";

export const getRandomEmoji = (): string => {
    return randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
};
