const fs = require("fs");
const path = require('path');
const filePath = path.join(__dirname, '../data/activeSockets.json');

function readFile() {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent || '{}');
}

function writeFile(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log('A user connected: ' + socket.id);

        // When a user joins, store their userId with their socket.id
        io.on('join', (userId) => {
            const activeSockets = readFile();

            activeSockets[userId] = socket.id;

            writeFile(activeSockets);

            console.log(`User ${userId} with socket ID ${socket.id} joined.`);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected: ' + socket.id);

            const activeSockets = readFile();
            const userId = Object.keys(activeSockets).find(key => activeSockets[userId] === socket.id);

            if (userId) {
                delete activeSockets[userId];

                writeFile(activeSockets);
                console.log(`User ${userId} with socket ID ${socket.id} disconnected.`);
            }

            fs.writeFile("../data/activeSockets.json", { [userId]: socket });
        });
    })
}

module.exports = socketHandler;