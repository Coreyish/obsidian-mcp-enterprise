#!/usr/bin/env node
import { VaultOperations } from './vault/operations.js';
import { discoverVault } from './vault/discovery.js';
async function testVaultFeatures() {
    console.log('🔍 Testing Obsidian MCP Enterprise Features\n');
    // Discover and initialize vault
    const vaultPath = discoverVault();
    if (!vaultPath) {
        console.error('❌ No vault found!');
        return;
    }
    console.log(`📁 Vault path: ${vaultPath}\n`);
    const vault = new VaultOperations(vaultPath);
    await vault.initialize();
    try {
        // Test 1: List all notes
        console.log('📋 TEST 1: Listing all notes...');
        const allNotes = await vault.listNotes();
        console.log(`Found ${allNotes.length} notes in your vault`);
        // Show some interesting notes
        const recentNotes = allNotes
            .sort((a, b) => b.modified.getTime() - a.modified.getTime())
            .slice(0, 5);
        console.log('\n📝 Recent notes:');
        recentNotes.forEach(note => {
            console.log(`  • ${note.title} (${note.path}) - ${note.size} bytes`);
        });
        // Test 2: Search for interesting patterns
        console.log('\n🔍 TEST 2: Searching for patterns...');
        const searchQueries = [
            'project',
            'todo',
            'idea',
            'meeting',
            'goal',
            'learning',
            'work',
            'personal'
        ];
        for (const query of searchQueries) {
            const results = await vault.searchNotes(query, 3);
            if (results.results.length > 0) {
                console.log(`\n"${query}":`);
                results.results.forEach(result => {
                    console.log(`  • ${result.title} (${result.matchType})`);
                    if (result.excerpt) {
                        console.log(`    "${result.excerpt.substring(0, 80)}..."`);
                    }
                });
            }
        }
        // Test 3: Analyze tags and frontmatter
        console.log('\n🏷️ TEST 3: Analyzing tags and metadata...');
        const notesWithTags = [];
        for (const note of allNotes.slice(0, 10)) { // Sample first 10 notes
            try {
                const metadata = await vault.getNoteMetadata(note.path);
                if (metadata.tags.length > 0) {
                    notesWithTags.push(metadata);
                }
            }
            catch (err) {
                // Skip notes that can't be read
            }
        }
        if (notesWithTags.length > 0) {
            console.log('\nNotes with tags:');
            notesWithTags.forEach(note => {
                console.log(`  • ${note.title}: ${note.tags.join(', ')}`);
            });
        }
        // Test 4: Read a sample note
        console.log('\n📖 TEST 4: Reading a sample note...');
        if (allNotes.length > 0) {
            const sampleNote = allNotes[0];
            try {
                const noteContent = await vault.readNote(sampleNote.path);
                console.log(`\nSample note: ${sampleNote.title}`);
                console.log(`Path: ${sampleNote.path}`);
                console.log(`Tags: ${noteContent.tags.join(', ')}`);
                console.log(`Size: ${noteContent.stats.size} bytes`);
                console.log(`Created: ${noteContent.stats.created.toLocaleDateString()}`);
                console.log(`Modified: ${noteContent.stats.modified.toLocaleDateString()}`);
                if (Object.keys(noteContent.frontmatter).length > 0) {
                    console.log('\nFrontmatter:');
                    console.log(JSON.stringify(noteContent.frontmatter, null, 2));
                }
                console.log('\nContent preview:');
                const preview = noteContent.content.substring(0, 200).replace(/\n/g, ' ');
                console.log(`"${preview}..."`);
            }
            catch (err) {
                console.log(`Could not read ${sampleNote.path}: ${err}`);
            }
        }
        // Test 5: Performance test
        console.log('\n⚡ TEST 5: Performance test...');
        const startTime = Date.now();
        const searchResults = await vault.searchNotes('test', 50);
        const duration = Date.now() - startTime;
        console.log(`Search completed in ${duration}ms`);
        console.log(`Found ${searchResults.totalResults} results`);
        // Test 6: Write a test note
        console.log('\n✍️ TEST 6: Writing a test note...');
        const testContent = `---
title: MCP Test Note
tags: [test, mcp, obsidian]
created: ${new Date().toISOString()}
---

# MCP Test Note

This is a test note created by the Obsidian MCP Enterprise server to verify write functionality.

## Features Tested

- ✅ Note creation
- ✅ Frontmatter parsing
- ✅ Tag extraction
- ✅ Directory auto-creation

## Timestamp

Created at: ${new Date().toLocaleString()}

This note can be safely deleted after testing.
`;
        try {
            const result = await vault.writeNote('mcp-test/test-note.md', testContent);
            console.log(`✅ Test note created: ${result.path}`);
            // Verify we can read it back
            const readBack = await vault.readNote(result.path);
            console.log(`✅ Test note verified: ${readBack.content.length} characters`);
        }
        catch (err) {
            console.log(`❌ Could not create test note: ${err}`);
        }
    }
    catch (error) {
        console.error('❌ Error during testing:', error);
    }
}
// Run the test
testVaultFeatures().catch(console.error);
//# sourceMappingURL=test-vault.js.map