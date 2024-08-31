const asyncHandler = require('express-async-handler');
const client = require('../connection');
const { getRequestsHandler, getRequestsHandlerWithJoin } = require('../functions/getRequestHandler');

//Function that get events by request
const getEvents = asyncHandler(async (req, res) => {
    if (req.query.data) {
        const data = JSON.parse(req.query.data);
        const keys = Object.keys(data.conditions);
        const values = Object.values(data.conditions);

        //The case when home page is loaded in order to get the highest and lowest price
        if (data.conditions.minAndMaxPrice) {
            const query = `
                SELECT MIN(price) AS "lowestPrice", MAX(price) AS "highestPrice" FROM "upcomingEvents"
            `;
            const result = await client.query(query);

            if (result.rowCount === 1) {
                return res.status(200).json({ message: "Data of min and max prices!", data: result.rows[0] });
            }
            else {
                return res.status(400).json({ message: "Bad request!" });
            }
        }

        const result = await getRequestsHandler('upcomingEvents', keys, values, data.join && data.join, "*", data.query && data.query);

        if (result.rows.length === 1) {
            return res.status(200).json({ message: "Successful request", eventData: result.rows[0] });
        }
        else if (result.rows.length > 1 && result.rows.length <= 10) {
            return res.status(200).json({ message: "Sorted data", events: result.rows });
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