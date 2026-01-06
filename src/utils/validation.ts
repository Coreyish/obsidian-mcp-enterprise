import { z } from 'zod';

export const ReadNoteSchema = z.object({
    path: z.string().min(1)
});

export const WriteNoteSchema = z.object({
    path: z.string().min(1),
    content: z.string()
});

export const ListNotesSchema = z.object({
    directory: z.string().optional()
});

export const SearchNotesSchema = z.object({
    query: z.string().min(1),
    tags: z.array(z.string()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    limit: z.number().int().positive().optional()
});

export const GetMetadataSchema = z.object({
    path: z.string().min(1)
});

export type ReadNoteInput = z.infer<typeof ReadNoteSchema>;
export type WriteNoteInput = z.infer<typeof WriteNoteSchema>;
export type ListNotesInput = z.infer<typeof ListNotesSchema>;
export type SearchNotesInput = z.infer<typeof SearchNotesSchema>;
export type GetMetadataInput = z.infer<typeof GetMetadataSchema>;


