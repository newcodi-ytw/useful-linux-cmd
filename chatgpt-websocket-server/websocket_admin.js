const express = require('express');
const app = express();
const http = require('http');

app.use(express.static('public'));

const httpServer = http.createServer(app);
httpServer.listen(3000, () => {
    console.log('Admin UI available at http://localhost:3000');
});

app.get('/sendCommand', (req, res) => {
    const cmd = req.query.cmd;
    rl.emit('line', cmd);
    res.send('Command sent: ' + cmd);
});
