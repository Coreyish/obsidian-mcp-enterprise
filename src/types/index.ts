export interface FileStats {
    size: number;
    created: Date;
    modified: Date;
}

export interface NoteContent {
    content: string;
    frontmatter: Record<string, unknown>;
    tags: string[];
    path: string;
    stats: FileStats;
}

export interface NoteMetadata {
    path: string;
    filename: string;
    title: string;
    tags: string[];
    size: number;
    modified: Date;
}

export interface SearchResultItem {
    path: string;
    title: string;
    excerpt: string;
    relevanceScore: number;
    matchType: 'filename' | 'content' | 'tag';
}

export interface SearchResponse {
    results: SearchResultItem[];
    totalResults: number;
    searchTime: number;
}


