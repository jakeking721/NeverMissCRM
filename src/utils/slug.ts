export function toKeySlug(label: string): string {
    return label
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
}