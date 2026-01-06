import { spawn } from 'child_process';

async function testServer() {
    const child = spawn('node', ['dist/server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
        output += data.toString();
        console.log('STDOUT:', data.toString());
    });

    child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('STDERR:', data.toString());
    });

    child.on('close', (code) => {
        console.log('Process exited with code:', code);
        console.log('Full output:', output);
        console.log('Full error:', errorOutput);
    });

    // Send initialization
    const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'test-client', version: '1.0.0' }
        }
    };

    console.log('Sending init:', JSON.stringify(initRequest));
    child.stdin.write(JSON.stringify(initRequest) + '\n');

    // Wait a bit then send search request
    setTimeout(() => {
        const searchRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'search_notes',
                arguments: { query: 'projects', limit: 10 }
            }
        };

        console.log('Sending search:', JSON.stringify(searchRequest));
        child.stdin.write(JSON.stringify(searchRequest) + '\n');
        child.stdin.end();
    }, 1000);
}

testServer();

