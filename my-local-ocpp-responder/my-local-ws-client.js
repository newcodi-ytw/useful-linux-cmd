const WebSocket = require('ws');

const ws = new WebSocket('wss://localhost:8080', {
    rejectUnauthorized: false, // Ignore self-signed cert
    // secureProtocol: 'TLSv1_2_method' // Force TLS 1.2
    // secureProtocol: 'TLSv1_3_method' // Force TLS 1.2
});

ws.on('open', () => {
    console.log('Connected');
    ws.send('Hello from TLS 1.2 client!');
});

ws.on('message', (data) => {
    console.log('Received:', data);
});

ws.on('close', () => {
    console.log('Disconnected');
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
});