const asyncHandler = require('express-async-handler');
const client = require('../connection');
const { getRequestsHandler } = require('../functions/getRequestHandler');

//Function that get events by request
const getEvents = asyncHandler(async (req, res) => {
    if (req.query.data) {
        const data = JSON.parse(req.query.data);
        const keys = Object.keys(data);
        const values = Object.values(data);

        const result = await getRequestsHandler('upcomingEvents', keys, values);
        console.log(result);

        if (result.rows.length === 1) {
            return res.status(200).json({ message: "Successful request", eventData: result.rows[0] });
        }
        else {
            return res.status(200).json({ message: "Bad request" });
        }
    }
    //In case there aren't any specific request for the data
    else {
        const query = `SELECT * FROM "upcomingEvents"
                    ORDER BY event_date
                    OFFSET 0
                    LIMIT 10`;

        const result = await client.query(query);

        return res.status(200).json({ message: "Successful request", events: result.rows });
    }
});

//Function that inserts event
const postEvent = asyncHandler((req, res) => {

});

//Function that update a specific event from its organizer
const updateEvent = asyncHandler((req, res) => {

});

//Function that either deletes the event from 'upcomingEvents' table and send it to passedEvents or just delete it in case the organizer decided to remove it
const deleteEvent = asyncHandler((req, res) => {

});

module.exports = { getEvents, postEvent, updateEvent, deleteEvent };