export const toSnakeCaseNoAccent = (str) => {
    return str
        // Normalize unicode (separate accents)
        .normalize("NFD")
        // Remove accents
        .replace(/[\u0300-\u036f]/g, "")
        // Convert đ → d
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        // Lowercase
        .toLowerCase()
        // Replace non-alphanumeric with underscore
        .replace(/[^a-z0-9]+/g, "_")
        // Remove leading/trailing underscores
        .replace(/^_+|_+$/g, "")
        // Remove duplicate underscores
        .replace(/_+/g, "_");
}