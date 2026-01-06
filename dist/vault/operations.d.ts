import { NoteContent, NoteMetadata, SearchResponse } from '../types/index.js';
export declare class VaultOperations {
    private vaultPath;
    private searchEngine;
    constructor(vaultPath: string);
    initialize(): Promise<void>;
    private validateVaultPath;
    private indexNotes;
    readNote(notePath: string): Promise<NoteContent>;
    writeNote(notePath: string, content: string): Promise<{
        path: string;
    }>;
    listNotes(directory?: string): Promise<NoteMetadata[]>;
    getNoteMetadata(notePath: string): Promise<NoteMetadata>;
    searchNotes(query: string, limit?: number): Promise<SearchResponse>;
}
