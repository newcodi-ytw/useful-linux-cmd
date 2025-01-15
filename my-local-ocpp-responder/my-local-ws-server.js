// Import necessary modules
const WebSocket = require('ws');
const readline = require('readline');
const os = require('os');
const { randomInt } = require('crypto');

// Function to get local WiFi IP address
function getLocalWiFiIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

function dummyLoad(delay = 5) {
    console.log(`mimic loading ${delay} second`);
    var now = new Date();
    var desiredTime = new Date().setSeconds(now.getSeconds() + delay);

    while (now < desiredTime) {
        now = new Date(); // update the current time
    }
}

function createBasicOcppReply(clientMessage) {
    try {
        const message = JSON.parse(clientMessage);
        if (Array.isArray(message) && message.length >= 2) {
            const [messageType, messageId, action] = message;
            if (messageType === 2 && typeof messageId === 'string') {
                switch (action) {
                    case "Heartbeat":
                        {
                            dummyLoad(randomInt(5));
                            return JSON.stringify([
                                3,
                                messageId,
                                {
                                    currentTime: new Date().toISOString()
                                }
                            ]);
                        }
                    case "BootNotification":
                        {
                            return JSON.stringify([
                                3,
                                messageId,
                                {
                                    currentTime: new Date().toISOString(),
                                    interval: 30,
                                    status: "Accepted"
                                }
                            ]);
                        }
                    default:
                        {
                            return JSON.stringify([
                                3,
                                messageId,
                                {

                                }
                            ]);
                        }
                }
            }
        }
    } catch (err) {
        console.error('Error parsing client message:', err);
    }
    return null;
}

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 }, () => {
    const localIP = getLocalWiFiIP();
    console.log(`WebSocket server is running at ws://${localIP}:8080`);
});

// Store connected clients
const clients = new Map();

// Handle new client connections
wss.on('connection', (ws) => {
    const clientId = Date.now();
    clients.set(clientId, ws);
    console.log(`Client connected: ${clientId}`);

    // Handle incoming messages from the client
    ws.on('message', (message) => {
        console.log(`Message from client ${clientId}: ${message}`);
        let reply = createBasicOcppReply(message);
        if (reply) {
            ws.send(reply);
            console.log(`Reply sent to client ${clientId}: ${reply}`);
        } else {
            console.log(`No valid reply generated for client ${clientId}`);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        clients.delete(clientId);
    });
});

// Create a readline interface for server control
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Listen for user input
rl.on('line', (input) => {
    const [command, arg] = input.split(' ');

    switch (command) {
        case 'd': {
            const clientId = arg ? parseInt(arg, 10) : Array.from(clients.keys()).pop();
            if (clients.has(clientId)) {
                clients.get(clientId).close();
                clients.delete(clientId);
                console.log(`Client ${clientId} disconnected.`);
            } else {
                console.log(`Client ${clientId} not found.`);
            }
            break;
        }
        case 'e': {
            const clientId = arg ? parseInt(arg, 10) : Array.from(clients.keys()).pop();
            if (clients.has(clientId)) {
                clients.get(clientId).send('ERROR: Triggered by server');
                console.log(`Error triggered for client ${clientId}.`);
            } else {
                console.log(`Client ${clientId} not found.`);
            }
            break;
        }
        case 'sd': {
            console.log('Shutting down the server...');
            wss.close(() => {
                console.log('Server shut down.');
                rl.close();
                process.exit(0);
            });

            // Force close all client connections
            clients.forEach((ws, clientId) => {
                ws.terminate();
                console.log(`Client ${clientId} forcibly disconnected.`);
            });

            break;
        }
        default:
            console.log('Unknown command. Available commands: d <clientId>, sd');
    }
});
