import { NoteMetadata, SearchResponse } from '../types/index.js';
export declare class SearchEngine {
    private fuzzySearch;
    private notesIndex;
    private vaultPath;
    constructor(vaultPath: string, notes: NoteMetadata[]);
    updateIndex(notes: NoteMetadata[]): void;
    search(query: string, limit?: number): Promise<SearchResponse>;
    private searchContent;
    private buildExcerpt;
    private mergeAndRankResults;
}
