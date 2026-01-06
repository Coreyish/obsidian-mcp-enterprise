import { VaultOperations } from './dist/vault/operations.js';
import { discoverVault } from './dist/vault/discovery.js';

async function searchProjectsDirectly() {
    try {
        console.log('🔍 Searching your Obsidian vault for notes about projects...\n');
        
        // Try to discover the vault
        const vaultPath = process.env.OBSIDIAN_VAULT_PATH || discoverVault();
        
        if (!vaultPath) {
            console.log('❌ No Obsidian vault found. Please set OBSIDIAN_VAULT_PATH environment variable.');
            console.log('💡 Common vault locations:');
            console.log('   - ~/Documents/YourVaultName');
            console.log('   - ~/Obsidian/YourVaultName');
            return;
        }

        console.log(`📁 Using vault: ${vaultPath}\n`);
        
        // Initialize vault operations
        const vault = new VaultOperations(vaultPath);
        await vault.initialize();
        
        // Search for notes about projects
        const searchResult = await vault.searchNotes('projects', 20);
        
        if (searchResult.results.length === 0) {
            console.log('❌ No notes found about projects in your vault.');
            return;
        }

        console.log(`✅ Found ${searchResult.totalResults} notes about projects:\n`);

        searchResult.results.forEach((result, index) => {
            console.log(`${index + 1}. 📄 ${result.title}`);
            console.log(`   📁 Path: ${result.path}`);
            console.log(`   🎯 Match Type: ${result.matchType}`);
            console.log(`   📊 Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`);
            
            if (result.excerpt) {
                console.log(`   📝 Excerpt: ${result.excerpt.trim()}`);
            }
            console.log('');
        });

        // Get vault statistics
        try {
            const allNotes = await vault.listNotes();
            const totalSize = allNotes.reduce((sum, note) => sum + note.size, 0);
            
            console.log(`📊 Vault Statistics:`);
            console.log(`   Total Notes: ${allNotes.length}`);
            console.log(`   Total Size: ${(totalSize / 1024).toFixed(1)} KB`);
            console.log('');
            
            // Show recent notes
            const recentNotes = allNotes
                .sort((a, b) => b.modified.getTime() - a.modified.getTime())
                .slice(0, 5);
            
            console.log(`📅 Recent Notes:`);
            recentNotes.forEach((note, index) => {
                console.log(`   ${index + 1}. ${note.title} (${note.path})`);
            });
            
        } catch (err) {
            console.log('Note: Could not retrieve vault statistics');
        }

    } catch (error) {
        console.error('❌ Error searching vault:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Your Obsidian vault is properly configured');
        console.log('   2. The OBSIDIAN_VAULT_PATH environment variable is set');
        console.log('   3. The server is properly built (run: npm run build)');
    }
}

// Run the search
searchProjectsDirectly();

