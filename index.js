const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const dailyUpdate = require('./functions/dailyEventsUpdate.js');
const cors = require('cors');
const WebSocket = require('ws');

const PORT = 3000;

const WEB_SOCKET_PORT = 8080;
const wss = new WebSocket.Server({ port: WEB_SOCKET_PORT });
const webSocketEvents = require('./controllers/webSocketController.js');

app.use(cors());

app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

webSocketEvents(wss, WebSocket);

app.get('/', (req, res) => {
    return res.json({ message: "Some result" });
});


//Daily update of the events
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily database update...');
    await dailyUpdate();
});

//Called also on the start of the server in order to transfer events after the server has started
dailyUpdate();

app.use('/user', require('./routes/UserRoute'));
app.use('/events', require('./routes/EventRoute'));
app.use('/saveEvent', require('./routes/SaveEvent.js'));
app.use('/chats', require('./routes/ChatsRoute.js'));
app.use('/specUsers', require('./routes/ChatsData.js'));
app.use('/uploadImage', require('./routes/UploadImageRoute.js'));
app.use('/buyTicket', require('./routes/BuyTicket.js'));
app.use('/allUsers', require('./routes/AllUsers.js'));

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
