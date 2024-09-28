const client = require("../connection.js");

const activeSockets = new Map();

function webSocketEvents(wss, WebSocket) {

    wss.on('connection', (ws) => {
        ws.on('message', async (data) => {
            const parsedData = JSON.parse(data);
            //In case this is the first time message is send
            if (parsedData.userId) {
                activeSockets.set(parsedData.userId, ws);
                return;
            }

            const senderImage = await client.query("SELECT \"userImage\", chats FROM \"users\" WHERE id = " + parsedData.senderId);
            parsedData['senderImage'] = senderImage.rows[0].userImage;
            const receiverChats = await client.query("SELECT chats FROM \"users\" WHERE id = " + parsedData.receiverId);

            //Sends back the message to the sender and the receiver
            const senderSocket = activeSockets.get(parsedData.senderId);
            const receiverSocket = activeSockets.get(parsedData.receiverId);

            if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
                parsedData['chats'] = senderImage.rows[0].chats;
                senderSocket.send(JSON.stringify(parsedData));
            }

            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
                parsedData['chats'] = receiverChats.rows[0].chats;
                receiverSocket.send(JSON.stringify(parsedData));
            }
        })

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}

module.exports = webSocketEvents;