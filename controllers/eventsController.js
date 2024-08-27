const asyncHandler = require('express-async-handler');
const client = require('../connection');

//Function that get events by request
const getEvents = asyncHandler(async (req, res) => {
    const query = `SELECT * FROM "upcomingEvents"
                    ORDER BY event_date
                    OFFSET 0
                    LIMIT 10`;

    const result = await client.query(query);

    return res.status(200).json({ message: "Successful request", events: result.rows });
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