import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger.js';
import { loadConfig } from './config/settings.js';
import { VaultOperations } from './vault/operations.js';
import { discoverVault } from './vault/discovery.js';
import { z } from 'zod';
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

export async function startServerStdio(): Promise<void> {
    const config = loadConfig();
    const vaultPath = config.vaultPath || discoverVault();
    if (!vaultPath) {
        logger.error('No Obsidian vault found. Set OBSIDIAN_VAULT_PATH or ensure a vault exists.');
        throw new Error('Vault discovery failed');
    }

    const vault = new VaultOperations(vaultPath);
    await vault.initialize();

    const mcpServer = new McpServer({
        name: 'obsidian-mcp-enterprise',
        version: '0.1.0'
    }, {
        capabilities: { tools: {} }
    });

    // Schemas for tool outputs
    const FileStatsShape = {
        size: z.number(),
        created: z.string(),
        modified: z.string()
    } as const;
    const NoteMetadataShape = {
        path: z.string(),
        filename: z.string(),
        title: z.string(),
        tags: z.array(z.string()),
        size: z.number(),
        modified: z.string()
    } as const;
    const NoteContentShape = {
        content: z.string(),
        frontmatter: z.record(z.unknown()),
        tags: z.array(z.string()),
        path: z.string(),
        stats: z.object(FileStatsShape)
    } as const;
    const SearchResultItemShape = {
        path: z.string(),
        title: z.string(),
        excerpt: z.string(),
        relevanceScore: z.number(),
        matchType: z.enum(['filename', 'content', 'tag'])
    } as const;
    const SearchResponseShape = {
        results: z.array(z.object(SearchResultItemShape)),
        totalResults: z.number(),
        searchTime: z.number()
    } as const;

    // Tools
    mcpServer.registerTool(
        'read_note',
        {
            description: 'Read the content of an Obsidian note including frontmatter',
            inputSchema: { path: z.string().describe('Relative path to the note from vault root') },
            outputSchema: NoteContentShape
        },
        async ({ path }) => {
            const note = await vault.readNote(path);
            return {
                content: [],
                structuredContent: ({
                    ...note,
                    stats: {
                        size: note.stats.size,
                        created: note.stats.created.toISOString(),
                        modified: note.stats.modified.toISOString()
                    }
                }) as unknown as Record<string, unknown>
            };
        }
    );

    mcpServer.registerTool(
        'write_note',
        {
            description: 'Create or update a note. Auto-creates directories.',
            inputSchema: { path: z.string(), content: z.string() },
            outputSchema: { path: z.string() }
        },
        async ({ path, content }) => {
            const result = await vault.writeNote(path, content);
            return { content: [], structuredContent: (result as unknown as Record<string, unknown>) };
        }
    );

    mcpServer.registerTool(
        'list_notes',
        {
            description: 'List notes in the vault (optionally within a directory).',
            inputSchema: { directory: z.string().optional() },
            outputSchema: { notes: z.array(z.object(NoteMetadataShape)) }
        },
        async ({ directory }) => {
            const notes = await vault.listNotes(directory);
            return { content: [], structuredContent: ({ notes: notes.map(n => ({ ...n, modified: n.modified.toISOString() })) } as unknown) as Record<string, unknown> };
        }
    );

    mcpServer.registerTool(
        'search_notes',
        {
            description: 'Search notes by filename, content, and tags.',
            inputSchema: { query: z.string(), limit: z.number().int().positive().optional() },
            outputSchema: SearchResponseShape
        },
        async ({ query, limit }) => {
            const res = await vault.searchNotes(query, limit);
            return { content: [], structuredContent: (res as unknown as Record<string, unknown>) };
        }
    );

    mcpServer.registerTool(
        'get_note_metadata',
        {
            description: 'Get metadata and tags for a note.',
            inputSchema: { path: z.string() },
            outputSchema: NoteMetadataShape
        },
        async ({ path }) => {
            const meta = await vault.getNoteMetadata(path);
            return { content: [], structuredContent: ({ ...meta, modified: meta.modified.toISOString() } as unknown) as Record<string, unknown> };
        }
    );

    // Additional tools for better note management
    mcpServer.registerTool(
        'update_note',
        {
            description: 'Update an existing note with new content, preserving frontmatter if present.',
            inputSchema: { 
                path: z.string().describe('Path to the note to update'),
                content: z.string().describe('New content for the note'),
                preserveFrontmatter: z.boolean().optional().describe('Whether to preserve existing frontmatter')
            },
            outputSchema: { path: z.string(), updated: z.boolean() }
        },
        async ({ path, content, preserveFrontmatter = true }) => {
            try {
                if (preserveFrontmatter) {
                    // Read existing note to preserve frontmatter
                    const existing = await vault.readNote(path);
                    const { data } = matter(content);
                    const newContent = matter.stringify(content, existing.frontmatter);
                    const result = await vault.writeNote(path, newContent);
                    return { content: [], structuredContent: { path: result.path, updated: true } as unknown as Record<string, unknown> };
                } else {
                    const result = await vault.writeNote(path, content);
                    return { content: [], structuredContent: { path: result.path, updated: true } as unknown as Record<string, unknown> };
                }
            } catch (err) {
                // If note doesn't exist, create it
                const result = await vault.writeNote(path, content);
                return { content: [], structuredContent: { path: result.path, updated: false } as unknown as Record<string, unknown> };
            }
        }
    );

    mcpServer.registerTool(
        'append_to_note',
        {
            description: 'Append content to the end of an existing note.',
            inputSchema: { 
                path: z.string().describe('Path to the note to append to'),
                content: z.string().describe('Content to append')
            },
            outputSchema: { path: z.string(), appended: z.boolean() }
        },
        async ({ path, content }) => {
            try {
                const existing = await vault.readNote(path);
                const newContent = existing.content + '\n\n' + content;
                const result = await vault.writeNote(path, matter.stringify(newContent, existing.frontmatter));
                return { content: [], structuredContent: { path: result.path, appended: true } as unknown as Record<string, unknown> };
            } catch (err) {
                // If note doesn't exist, create it
                const result = await vault.writeNote(path, content);
                return { content: [], structuredContent: { path: result.path, appended: false } as unknown as Record<string, unknown> };
            }
        }
    );

    mcpServer.registerTool(
        'delete_note',
        {
            description: 'Delete a note from the vault.',
            inputSchema: { path: z.string().describe('Path to the note to delete') },
            outputSchema: { deleted: z.boolean(), path: z.string() }
        },
        async ({ path: notePath }) => {
            try {
                const fullPath = path.join(vaultPath, notePath);
                await fs.unlink(fullPath);
                return { content: [], structuredContent: { deleted: true, path: notePath } as unknown as Record<string, unknown> };
            } catch (err) {
                return { content: [], structuredContent: { deleted: false, path: notePath, error: 'Note not found or could not be deleted' } as unknown as Record<string, unknown> };
            }
        }
    );

    mcpServer.registerTool(
        'get_vault_stats',
        {
            description: 'Get statistics about the vault including note count, total size, and recent activity.',
            inputSchema: {},
            outputSchema: {
                totalNotes: z.number(),
                totalSize: z.number(),
                recentActivity: z.array(z.object({
                    path: z.string(),
                    title: z.string(),
                    modified: z.string(),
                    size: z.number()
                }))
            }
        },
        async () => {
            const allNotes = await vault.listNotes();
            const recentNotes = allNotes
                .sort((a, b) => b.modified.getTime() - a.modified.getTime())
                .slice(0, 10);
            
            const totalSize = allNotes.reduce((sum, note) => sum + note.size, 0);
            
            return { 
                content: [], 
                structuredContent: {
                    totalNotes: allNotes.length,
                    totalSize,
                    recentActivity: recentNotes.map(n => ({
                        path: n.path,
                        title: n.title,
                        modified: n.modified.toISOString(),
                        size: n.size
                    }))
                } as unknown as Record<string, unknown>
            };
        }
    );

    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
}


