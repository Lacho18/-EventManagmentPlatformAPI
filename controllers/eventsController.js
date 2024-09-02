const asyncHandler = require('express-async-handler');
const client = require('../connection');
const { getRequestsHandler, getRequestsHandlerWithJoin } = require('../functions/getRequestHandler');

//Function that get events by request
const getEvents2 = asyncHandler(async (req, res) => {
    console.log(req.query.data);
    const data = JSON.parse(req.query.data);


    //On loading of the side getting the event with max price, min price and total count of events, used for filters and calculating the number of pages
    if (data.conditions) {
        if (data.conditions.minAndMaxPrice) {
            const query = `
                SELECT MIN(price) AS "lowestPrice", MAX(price) AS "highestPrice", COUNT(*) AS "totalEvents" FROM "upcomingEvents"
            `;
            const result = await client.query(query);

            if (result.rowCount === 1) {
                return res.status(200).json({ message: "Data of min and max prices!", data: result.rows[0] });
            }
            else {
                return res.status(400).json({ message: "Bad request!" });
            }
        }
    }

    //Describes the conditions if given
    let conditions;
    if (data.conditions) {
        let conditionsKeys = Object.keys(data.conditions);
        conditions = conditionsKeys.map(key => {
            const value = data.conditions[key];
            return Array.isArray(value)
                ? `"${key}" IN (${value.join(', ')})`
                : `"${key}" = '${value}'`;
        }).join(' AND ');
    }

    //Sets the limit of returned objects if given
    let limit;
    if (data.limit) {
        limit = data.limit;
    }

    //Sets the number of skipped results if given
    let offset;
    if (data.currentPage) {
        offset = (data.currentPage - 1) * data.limit;
        console.log(offset && "OFFSET " + offset);
    }

    //Sets the order type of the objects if given
    let orderBy;
    if (data.orderBy) {
        orderBy = data.orderBy;
    }

    let query = `
        SELECT * FROM "upcomingEvents"
        ${conditions ? "WHERE " + conditions : ""}
        ${orderBy ? "ORDER BY " + orderBy : ""}
        ${offset ? "OFFSET " + offset : ""}
        ${limit ? "LIMIT " + limit : ""}
    `;

    console.log(query);

    const result = await client.query(query);

    if (result.rowCount > 0) {
        return res.status(200).json({ message: "Successful request", data: result.rows });
    }
    else {
        return res.status(400).json({ message: "Bad request!" });
    }
})

//Function that inserts event
const postEvent = asyncHandler((req, res) => {

});

//Function that update a specific event from its organizer
const updateEvent = asyncHandler((req, res) => {

});

//Function that either deletes the event from 'upcomingEvents' table and send it to passedEvents or just delete it in case the organizer decided to remove it
const deleteEvent = asyncHandler((req, res) => {

});

module.exports = { getEvents2, postEvent, updateEvent, deleteEvent };