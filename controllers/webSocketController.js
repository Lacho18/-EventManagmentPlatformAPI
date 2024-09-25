const client = require("../connection.js");

const activeSockets = new Map();

function webSocketEvents(wss, WebSocket) {

    wss.on('connection', (ws) => {
        console.log("AREVE EIIIIII");

        console.log(activeSockets);

        ws.on('message', async (data) => {
            const parsedData = JSON.parse(data);
            //In case this is the first time message is send
            if (parsedData.userId) {
                activeSockets.set(parsedData.userId, ws);
                return;
            }

            console.log("Message data here");
            console.log(parsedData);

            const senderImage = await client.query("SELECT \"userImage\" FROM \"users\" WHERE id = " + parsedData.senderId);
            parsedData['senderImage'] = senderImage.rows[0].userImage;

            //Sends back the message to the sender and the receiver
            const senderSocket = activeSockets.get(parsedData.senderId);
            const receiverSocket = activeSockets.get(parsedData.receiverId);

            if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
                senderSocket.send(JSON.stringify(parsedData));
            }

            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
                receiverSocket.send(JSON.stringify(parsedData));
            }
        })

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}

module.exports = webSocketEvents;