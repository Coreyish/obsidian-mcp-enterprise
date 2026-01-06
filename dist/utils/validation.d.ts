import { z } from 'zod';
export declare const ReadNoteSchema: z.ZodObject<{
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export declare const WriteNoteSchema: z.ZodObject<{
    path: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    content: string;
}, {
    path: string;
    content: string;
}>;
export declare const ListNotesSchema: z.ZodObject<{
    directory: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    directory?: string | undefined;
}, {
    directory?: string | undefined;
}>;
export declare const SearchNotesSchema: z.ZodObject<{
    query: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    tags?: string[] | undefined;
    limit?: number | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    query: string;
    tags?: string[] | undefined;
    limit?: number | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
export declare const GetMetadataSchema: z.ZodObject<{
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export type ReadNoteInput = z.infer<typeof ReadNoteSchema>;
export type WriteNoteInput = z.infer<typeof WriteNoteSchema>;
export type ListNotesInput = z.infer<typeof ListNotesSchema>;
export type SearchNotesInput = z.infer<typeof SearchNotesSchema>;
export type GetMetadataInput = z.infer<typeof GetMetadataSchema>;
