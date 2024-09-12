const asyncHandler = require('express-async-handler');
const client = require('../connection');
const { getRequestsHandler, getRequestsHandlerWithJoin } = require('../functions/getRequestHandler');

//Function that get events by request
const getEvents2 = asyncHandler(async (req, res) => {
    const data = JSON.parse(req.query.data);

    //On loading on the side getting the event with max price, min price and total count of events, used for filters and calculating the number of pages
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

    //If there is join requests
    let newField;
    if (data.join) {
        //Concatenating all required fields from the other table in field named [joiningTable]_data
        //newField = data.join.fieldsToGet.map((field) => `|| "${data.join.joiningWith}"."${field}" ||`).join(" ' ' ");
        newField = data.join.fieldsToGet.map((field) => `"${data.join.joiningWith}"."${field}" AS "${field}"`).join(", ");

        //removing the first and last three letters from 'newField' variable
        //newField = newField.slice(3, -3);
    }

    //Describes the conditions if given
    let conditions;
    if (data.conditions) {
        let conditionsKeys = Object.keys(data.conditions);
        conditions = conditionsKeys.map(key => {
            const value = data.conditions[key];
            return Array.isArray(value)
                ? `"upcomingEvents"."${key}" IN (${value.join(', ')})`
                : `"upcomingEvents"."${key}" = '${value}'`;
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
        SELECT "upcomingEvents".*, 
        ${newField ? "" + newField : ""}    
        FROM "upcomingEvents"
        ${newField ? `JOIN "${data.join.joiningWith}" ON "upcomingEvents"."organizer_ID" = "${data.join.joiningWith}".id` : ""}
        ${conditions ? "WHERE " + conditions : ""}
        ${orderBy ? "ORDER BY " + orderBy : ""}
        ${offset ? "OFFSET " + offset : ""}
        ${limit ? "LIMIT " + limit : ""}
    `

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
const postEvent = asyncHandler(async (req, res) => {
    const data = req.body;
    const keys = Object.keys(data);

    //Checks for empty fields
    let emptyFields = false;
    keys.forEach(key => {
        const value = data[key];

        console.log(value);

        if (value === null || value === 0 || value === '' || value === undefined) {
            emptyFields = true;
        }

        if (typeof value === 'object' && !Array.isArray(value) && Object.keys.length === 0) {
            emptyFields = true;
        }

        if (Array.isArray(value) && value.length === 0) {
            emptyFields = true;
        }
    });

    if (emptyFields) {
        return res.status(400).json({ message: "All fields are required! Please field all of them!" });
    }

    //Sets the date to date format
    data.event_date = new Date(data.event_date);

    //Checks if the given date is correct
    if (isNaN(data.event_date.getTime())) {
        return res.status(400).json({ message: "Invalid date was given! Please give a valid one!" });
    }

    //Checks if the given date is in the feature
    let today = new Date();
    if (data.event_date < today) {
        return res.status(400).json({ message: "The provided date has passed. The event should be in future days and not passed!" });
    }

    //Checks if the organizer id is valid user
    let validUser = await client.query("SELECT id FROM users WHERE id=" + data.organizer_ID);
    if (validUser.rowCount !== 1) {
        return res.status(400).json({ message: "The provided organizer data is invalid! Please re log in or create organizer account!" });
    }

    //Checks if the given id is on organizer
    if (validUser.role === "participant") {
        return res.status(400).json({ message: "You must be an organizer to create event! Please update your account or create new as organizer!" });
    }

    //Formats the location field for a way to be inserted
    const location = [];
    Object.keys(data.location).forEach(key => location.push(data.location[key]));
    data.location = location;

    const query = `
        INSERT INTO "upcomingEvents" (name, description, location, duration, price, "organizer_ID", image, event_date, places)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    `;

    const values = [data.name, data.description, data.location, data.duration, data.price, data.organizer_ID, data.image, data.event_date, data.places];

    const result = await client.query(query, values);

    return res.status(200).json({ message: "Successfully posted event!", id: result.rows[0].id });

});

//Function that update a specific event from its organizer
const updateEvent = asyncHandler((req, res) => {

});

//Function that either deletes the event from 'upcomingEvents' table and send it to passedEvents or just delete it in case the organizer decided to remove it
const deleteEvent = asyncHandler((req, res) => {

});

module.exports = { getEvents2, postEvent, updateEvent, deleteEvent };