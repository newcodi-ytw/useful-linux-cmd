// Import necessary modules
const https = require('https');
const fs = require('fs');

const WebSocket = require('ws');
const readline = require('readline');
const os = require('os');
const { randomInt } = require('crypto');
const crypto = require('crypto');

// Function to generate a GUID similar to the C version
function generateGUID() {
    const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    return template.replace(/[xy]/g, function (c) {
        const r = crypto.randomInt(0, 16);
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

// Function to send a message and handle response
function sendMessageToClient(clientId, action, details) {
    if (!clients.has(clientId)) {
        console.log(`Client ${clientId} not found.`);
        return;
    }

    const messageId = generateGUID();
    const message = [2, messageId, action, details];
    console.log(`Sending to client ${clientId}:`, JSON.stringify(message));

    clients.get(clientId).send(JSON.stringify(message));

    clients.get(clientId).on('message', (response) => {
        try {
            const parsedResponse = JSON.parse(response);
            if (Array.isArray(parsedResponse) && parsedResponse.length >= 2) {
                const [responseType, responseId, responseData] = parsedResponse;
                if (responseType === 3 && responseId === messageId) {
                    console.log(`Received response for message ${messageId}:`, responseData);
                }
            }
        } catch (err) {
            console.error('Error processing response:', err);
        }
    });
}

// Function to get the local Wi-Fi IP address
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

function calculateConnectionSpeed(clientId, messageSize, startTime) {
    const endTime = Date.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    const speed = (messageSize / durationInSeconds) / 1024; // Speed in KB/s
    console.log(`Connection speed for client ${clientId}: ${speed.toFixed(2)} KB/s`);
    return speed;
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

const server = https.createServer({
    cert: fs.readFileSync('./cert.pem'),
    key: fs.readFileSync('./key.pem'),
    // passphrase: 'sspw!.3', // Replace with the password you set
    // minVersion: 'TLSv1.2',    // Enforce TLS 1.3
    maxVersion: 'TLSv1.3',
});

const wss = new WebSocket.Server({ server });

// Start the server and log the IP
server.listen(8080, () => {
    const localIP = getLocalWiFiIP();
    console.log(`WebSocket server is running at wss://${localIP}:8080`);
});

// const wss = new WebSocket.Server({ port: 8080 }, () => {
//     const localIP = getLocalWiFiIP();
//     console.log(`WebSocket server is running at ws://${localIP}:8080`);
// });

// Store connected clients
const clients = new Map();

// Handle new client connections
wss.on('connection', (ws) => {
    const clientId = Date.now();
    clients.set(clientId, ws);
    console.log(`Client connected: ${clientId}`);

    // Access the underlying TLS socket
    const socket = ws._socket; // WebSocket's underlying socket
    if (socket instanceof require('tls').TLSSocket) {
        console.log(`TLS Version: ${socket.getProtocol()}`); // Should be "TLSv1.3"
    } else {
        console.log('Not a TLS connection');
    }

    // Handle incoming messages from the client
    ws.on('message', (message) => {
        console.log(`Message from client ${clientId}: ${message}`);
        const startTime = Date.now();
        let reply = createBasicOcppReply(message);
        if (reply) {
            ws.send(reply, () => {
                calculateConnectionSpeed(clientId, Buffer.byteLength(reply), startTime);
            });
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
    const clientId = arg ? parseInt(arg, 10) : Array.from(clients.keys()).pop();

    switch (command) {
        case 'sendReset':
            sendMessageToClient(clientId, "Reset", { type: "Soft" });
            break;
        case 'sendUpdateFirmware':
            sendMessageToClient(clientId, "UpdateFirmware", {
                location: "http://example.com/firmware.bin",
                retries: 3,
                retrieveDate: new Date().toISOString(),
                retryInterval: 600
            });
            break;
        case 'sendRemoteStartTransaction':
            sendMessageToClient(clientId, "RemoteStartTransaction", {
                idTag: "ABC123",
                connectorId: 1,
                chargingProfile: {
                    chargingProfileId: 123,
                    stackLevel: 0,
                    chargingProfilePurpose: "TxProfile",
                    chargingProfileKind: "Recurring",
                    recurrencyKind: "Daily",
                    chargingSchedule: {
                        duration: 3600,
                        startSchedule: new Date().toISOString(),
                        chargingRateUnit: "W",
                        chargingSchedulePeriod: [
                            { startPeriod: 0, limit: 22000 }
                        ]
                    }
                }
            });
            break;
        case 'sendRemoteStopTransaction':
            sendMessageToClient(clientId, "RemoteStopTransaction", { transactionId: 1001 });
            break;
        case 'sendGetConfiguration':
            sendMessageToClient(clientId, "GetConfiguration", { key: ["HeartbeatInterval", "MeterValuesSampledData"] });
            break;

        case 'd': {
            if (clients.has(clientId)) {
                clients.get(clientId).close();
                clients.delete(clientId);
                console.log(`Client ${clientId} disconnected.`);
            } else {
                console.log(`No connected Client.`);
            }
            break;
        }
        case 'e': {
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
            console.log('Unknown command. Available commands: sendReset <clientId>, sendUpdateFirmware <clientId>, sendRemoteStartTransaction <clientId>, sendRemoteStopTransaction <clientId>, sendGetConfiguration <clientId>');
    }
});
