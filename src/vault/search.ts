import Fuse from 'fuse.js';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { NoteMetadata, SearchResponse, SearchResultItem } from '../types/index.js';

export class SearchEngine {
    private fuzzySearch: Fuse<NoteMetadata>;
    private notesIndex: Map<string, NoteMetadata> = new Map();
    private vaultPath: string;

    constructor(vaultPath: string, notes: NoteMetadata[]) {
        this.vaultPath = vaultPath;
        this.fuzzySearch = new Fuse(notes, {
            keys: ['filename', 'title', 'tags'],
            threshold: 0.3,
            includeScore: true,
            ignoreLocation: true,
            shouldSort: true,
        });
        for (const n of notes) this.notesIndex.set(n.path, n);
    }

    public updateIndex(notes: NoteMetadata[]): void {
        this.fuzzySearch.setCollection(notes);
        this.notesIndex.clear();
        for (const n of notes) this.notesIndex.set(n.path, n);
    }

    public async search(query: string, limit = 50): Promise<SearchResponse> {
        const startedAt = Date.now();

        const filenameResults = this.fuzzySearch.search(query, { limit }).map(r => ({
            path: r.item.path,
            title: r.item.title || r.item.filename,
            excerpt: '',
            relevanceScore: 1 - (r.score ?? 0),
            matchType: 'filename' as const
        }));

        const contentResults = await this.searchContent(query, limit);
        const combined = this.mergeAndRankResults(filenameResults, contentResults, limit);

        const duration = Date.now() - startedAt;
        logger.info('Search completed', { query, resultCount: combined.length, duration });
        return { results: combined, totalResults: combined.length, searchTime: duration };
    }

    private async searchContent(query: string, limit: number): Promise<SearchResultItem[]> {
        const lower = query.toLowerCase();
        const results: SearchResultItem[] = [];
        for (const meta of this.notesIndex.values()) {
            if (results.length >= limit) break;
            try {
                const fullPath = path.join(this.vaultPath, meta.path);
                const data = await fs.readFile(fullPath, 'utf8');
                const idx = data.toLowerCase().indexOf(lower);
                if (idx !== -1) {
                    const excerpt = this.buildExcerpt(data, idx, lower.length);
                    results.push({
                        path: meta.path,
                        title: meta.title || meta.filename,
                        excerpt,
                        relevanceScore: 0.75,
                        matchType: 'content'
                    });
                }
            } catch {
                // ignore read errors
            }
        }
        return results;
    }

    private buildExcerpt(content: string, index: number, matchLen: number): string {
        const start = Math.max(0, index - 60);
        const end = Math.min(content.length, index + matchLen + 60);
        const prefix = start > 0 ? '…' : '';
        const suffix = end < content.length ? '…' : '';
        const snippet = content.slice(start, end).replace(/\n/g, ' ');
        return `${prefix}${snippet}${suffix}`;
    }

    private mergeAndRankResults(a: SearchResultItem[], b: SearchResultItem[], limit: number): SearchResultItem[] {
        const map = new Map<string, SearchResultItem>();
        for (const r of [...a, ...b]) {
            const existing = map.get(r.path);
            if (!existing || r.relevanceScore > existing.relevanceScore) {
                map.set(r.path, r);
            }
        }
        return Array.from(map.values()).sort((x, y) => y.relevanceScore - x.relevanceScore).slice(0, limit);
    }
}


