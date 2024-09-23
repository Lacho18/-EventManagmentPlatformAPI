const express = require('express');
const app = express();
const path = require('path');
const client = require('./connection.js');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const dailyUpdate = require('./functions/dailyEventsUpdate.js');
const cors = require('cors');

const PORT = 3000;

app.use(cors());

app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/uploadImage', require('./routes/UploadImageRoute.js'));
app.use('/buyTicket', require('./routes/BuyTicket.js'));
app.use('/allUsers', require('./routes/AllUsers.js'));

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
