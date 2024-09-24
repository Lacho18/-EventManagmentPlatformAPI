const express = require('express');
const app = express();
const path = require('path');
const client = require('./connection.js');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const dailyUpdate = require('./functions/dailyEventsUpdate.js');
const cors = require('cors');

//Set upping the socket.io server
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require('./controllers/sockets.js');

const PORT = 4000;

app.use(cors({
    origin: ["http://localhost:3000"],
}));

app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",  // Your React frontend origin
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    return res.json({ message: "Some result" });
});

//Calls the function that handles the socket events
//socketHandler(io);

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
