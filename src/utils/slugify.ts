/**
 * Converts a string to a URL-friendly slug.
 * - Converts to lowercase
 * - Trims whitespace
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 *
 * @example
 * slugify("Systems Integration Squad") // "systems-integration-squad"
 * slugify("  Hello World!  ") // "hello-world"
 */
export const slugify = (text: string | null | undefined): string => {
    if (!text) return "";
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
};
