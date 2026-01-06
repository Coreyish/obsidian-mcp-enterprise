import matter from 'gray-matter';

export function parseFrontmatter(content: string): { content: string; data: Record<string, unknown> } {
    const parsed = matter(content);
    return { content: parsed.content, data: parsed.data as Record<string, unknown> };
}

export function extractTagsFromContent(content: string): string[] {
    const tagRegex = /(^|\s)#([\w\-/]+)/g;
    const tags = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(content)) !== null) {
        tags.add(match[2]);
    }
    return Array.from(tags);
}

export function mergeTags(frontmatter: Record<string, unknown>, contentTags: string[]): string[] {
    const fmTags = Array.isArray((frontmatter as any).tags)
        ? (frontmatter as any).tags.map((t: unknown) => String(t))
        : typeof (frontmatter as any).tags === 'string'
            ? String((frontmatter as any).tags).split(',').map(s => s.trim()).filter(Boolean)
            : [];
    return Array.from(new Set<string>([...fmTags, ...contentTags]));
}


