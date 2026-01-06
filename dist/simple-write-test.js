#!/usr/bin/env node
import { VaultOperations } from './vault/operations.js';
import { discoverVault } from './vault/discovery.js';
async function testWrite() {
    console.log('🧪 Testing write functionality...\n');
    const vaultPath = discoverVault();
    if (!vaultPath) {
        console.error('❌ No vault found!');
        return;
    }
    console.log(`📁 Vault path: ${vaultPath}`);
    const vault = new VaultOperations(vaultPath);
    await vault.initialize();
    try {
        // Test simple write
        const testContent = `---
title: "Simple Write Test"
created: ${new Date().toISOString()}
---

# Simple Write Test

This is a simple test to verify write functionality.

- Test point 1
- Test point 2
- Test point 3

Generated at: ${new Date().toLocaleString()}
`;
        console.log('📝 Attempting to write test note...');
        const result = await vault.writeNote('simple-write-test.md', testContent);
        console.log(`✅ Write successful: ${result.path}`);
        // Verify we can read it back
        console.log('📖 Reading back the note...');
        const readBack = await vault.readNote(result.path);
        console.log(`✅ Read successful: ${readBack.content.length} characters`);
        console.log(`📊 Note title: ${readBack.path}`);
        console.log('\n🎉 Write functionality is working correctly!');
    }
    catch (error) {
        console.error('❌ Write test failed:', error);
    }
}
testWrite().catch(console.error);
//# sourceMappingURL=simple-write-test.js.map