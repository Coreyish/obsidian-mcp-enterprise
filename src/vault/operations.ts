import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import { parseFrontmatter, extractTagsFromContent, mergeTags } from './metadata.js';
import { logger } from '../utils/logger.js';
import { VaultError } from '../utils/errors.js';
import { NoteContent, NoteMetadata, SearchResponse } from '../types/index.js';
import { SearchEngine } from './search.js';

export class VaultOperations {
    private vaultPath: string;
    private searchEngine: SearchEngine | null = null;

    constructor(vaultPath: string) {
        if (!vaultPath) {
            throw new VaultError('Vault path is required. Set OBSIDIAN_VAULT_PATH or provide a path argument.', 'VAULT_PATH_MISSING');
        }
        this.vaultPath = vaultPath;
    }

    public async initialize(): Promise<void> {
        await this.validateVaultPath();
        const notes = await this.indexNotes();
        this.searchEngine = new SearchEngine(this.vaultPath, notes);
    }

    private async validateVaultPath(): Promise<void> {
        try {
            const stat = await fs.stat(this.vaultPath);
            if (!stat.isDirectory()) {
                throw new VaultError('Provided vault path is not a directory', 'INVALID_VAULT_PATH', { vaultPath: this.vaultPath });
            }
        } catch (err: unknown) {
            throw new VaultError('Vault path does not exist or is inaccessible', 'VAULT_NOT_FOUND', { vaultPath: this.vaultPath, err });
        }
    }

    private async indexNotes(): Promise<NoteMetadata[]> {
        const started = Date.now();
        const files = await fg('**/*.md', { cwd: this.vaultPath, dot: false, absolute: false });
        const metas: NoteMetadata[] = [];
        for (const rel of files) {
            const full = path.join(this.vaultPath, rel);
            try {
                const stat = await fs.stat(full);
                const filename = path.basename(rel);
                const title = filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ').trim();
                metas.push({
                    path: rel,
                    filename,
                    title,
                    tags: [],
                    size: stat.size,
                    modified: stat.mtime
                });
            } catch {
                // ignore
            }
        }
        const duration = Date.now() - started;
        logger.info('Indexing completed', { count: metas.length, duration });
        return metas;
    }

    public async readNote(notePath: string): Promise<NoteContent> {
        try {
            const full = path.join(this.vaultPath, notePath);
            const raw = await fs.readFile(full, 'utf8');
            const { content, data } = parseFrontmatter(raw);
            const tags = mergeTags(data, extractTagsFromContent(raw));
            const stat = await fs.stat(full);

            return {
                content,
                frontmatter: data,
                tags,
                path: notePath,
                stats: {
                    size: stat.size,
                    created: stat.birthtime,
                    modified: stat.mtime
                }
            };
        } catch (err: unknown) {
            throw new VaultError('Note not found. Check the file path and ensure it ends with .md', 'NOTE_NOT_FOUND', { requestedPath: notePath, vaultPath: this.vaultPath, err });
        }
    }

    public async writeNote(notePath: string, content: string): Promise<{ path: string }>
    {
        const full = path.join(this.vaultPath, notePath);
        try {
            await fs.mkdir(path.dirname(full), { recursive: true });
            await fs.writeFile(full, content, 'utf8');
            return { path: notePath };
        } catch (err: unknown) {
            throw new VaultError('Failed to write note', 'WRITE_FAILED', { requestedPath: notePath, err });
        }
    }

    public async listNotes(directory?: string): Promise<NoteMetadata[]> {
        const pattern = directory && directory.length > 0 ? path.posix.join(directory, '**/*.md') : '**/*.md';
        const files = await fg(pattern, { cwd: this.vaultPath, dot: false, absolute: false });
        const notes: NoteMetadata[] = [];
        for (const rel of files) {
            const full = path.join(this.vaultPath, rel);
            try {
                const stat = await fs.stat(full);
                notes.push({
                    path: rel,
                    filename: path.basename(rel),
                    title: path.basename(rel, '.md').replace(/[-_]/g, ' '),
                    tags: [],
                    size: stat.size,
                    modified: stat.mtime
                });
            } catch {
                // ignore
            }
        }
        return notes;
    }

    public async getNoteMetadata(notePath: string): Promise<NoteMetadata> {
        const full = path.join(this.vaultPath, notePath);
        try {
            const stat = await fs.stat(full);
            const raw = await fs.readFile(full, 'utf8');
            const { data } = parseFrontmatter(raw);
            const tags = mergeTags(data, extractTagsFromContent(raw));
            return {
                path: notePath,
                filename: path.basename(notePath),
                title: path.basename(notePath, '.md').replace(/[-_]/g, ' '),
                tags,
                size: stat.size,
                modified: stat.mtime
            };
        } catch (err: unknown) {
            throw new VaultError('Failed to read note metadata', 'METADATA_FAILED', { requestedPath: notePath, err });
        }
    }

    public async searchNotes(query: string, limit = 50): Promise<SearchResponse> {
        if (!this.searchEngine) {
            await this.initialize();
        }
        return this.searchEngine!.search(query, limit);
    }
}


