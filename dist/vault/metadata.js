import matter from 'gray-matter';
export function parseFrontmatter(content) {
    const parsed = matter(content);
    return { content: parsed.content, data: parsed.data };
}
export function extractTagsFromContent(content) {
    const tagRegex = /(^|\s)#([\w\-/]+)/g;
    const tags = new Set();
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
        tags.add(match[2]);
    }
    return Array.from(tags);
}
export function mergeTags(frontmatter, contentTags) {
    const fmTags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags.map((t) => String(t))
        : typeof frontmatter.tags === 'string'
            ? String(frontmatter.tags).split(',').map(s => s.trim()).filter(Boolean)
            : [];
    return Array.from(new Set([...fmTags, ...contentTags]));
}
//# sourceMappingURL=metadata.js.map