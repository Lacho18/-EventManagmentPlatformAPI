const express = require('express');
const app = express();
const client = require('./connection.js');
const bodyParser = require('body-parser');
const cors = require('cors');

const PORT = 3000;

app.use(cors());

app.use(bodyParser.json());

//client.connect();

app.get('/test', (req, res) => {
    console.log("It worked :O.");
});

app.use('/user', require('./routes/UserRoute'));
app.use('/events', require('./routes/EventRoute'));
app.use('/saveEvent', require('./routes/SaveEvent.js'));

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});