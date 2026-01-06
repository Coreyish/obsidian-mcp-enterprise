export declare function parseFrontmatter(content: string): {
    content: string;
    data: Record<string, unknown>;
};
export declare function extractTagsFromContent(content: string): string[];
export declare function mergeTags(frontmatter: Record<string, unknown>, contentTags: string[]): string[];
