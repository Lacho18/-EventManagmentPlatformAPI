const asyncHandler = require('express-async-handler');
const client = require('../connection');

//Function that get events by request
const getEvents2 = asyncHandler(async (req, res) => {
    const data = JSON.parse(req.query.data);

    if (data.tableName === undefined) {
        data.tableName = "upcomingEvents";
    }

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
        newField = data.join.fieldsToGet.map((field) => `"${data.join.joiningWith}"."${field}" AS "${field}"`).join(", ");
    }

    //Describes the conditions if given
    let conditions;
    if (data.conditions) {
        let conditionsKeys = Object.keys(data.conditions);
        conditions = conditionsKeys.map(key => {
            const value = data.conditions[key];
            return Array.isArray(value)
                ? `"${data.tableName}"."${key}" IN (${value.join(', ')})`
                : `"${data.tableName}"."${key}" = '${value}'`;
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
    }

    //Sets the order type of the objects if given
    let orderBy;
    if (data.orderBy) {
        orderBy = data.orderBy;
    }


    //On the select line, the condition is to remove the ',' if there is conditions and it includes "IN"
    let query = `                   
        SELECT "${data.tableName}".*${newField ? "," : ""} 
        ${newField ? "" + newField : ""}    
        FROM "${data.tableName}"
        ${newField ? `JOIN "${data.join.joiningWith}" ON "${data.tableName}"."organizer_ID" = "${data.join.joiningWith}".id` : ""}
        ${conditions ? "WHERE " + conditions : ""}
        ${orderBy ? "ORDER BY " + orderBy : ""}
        ${offset ? "OFFSET " + offset : ""}
        ${limit ? "LIMIT " + limit : ""}
    `

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
        INSERT INTO "upcomingEvents" (name, description, location, duration, price, "organizer_ID", image, event_date, places, participants)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
    `;

    const values = [data.name, data.description, data.location, data.duration, data.price, data.organizer_ID, data.image, data.event_date, data.places, []];

    const result = await client.query(query, values);

    return res.status(200).json({ message: "Successfully posted event!", id: result.rows[0].id });

});

//Function that update a specific event from its organizer
const updateEvent = asyncHandler(async (req, res) => {
    const data = req.body;

    data.location = Object.keys(data.location).map((key) => data.location[key]);

    const updateQuery = `
    UPDATE "upcomingEvents"
    SET
        name = $1,
        description = $2,
        location = $3,
        duration = $4,
        price = $5,
        "organizer_ID" = $6,
        image = $7,
        event_date = $8,
        places = $9,
        participants = $10
    WHERE id = $11
    RETURNING id
`;

    const values = [
        data.name,
        data.description,
        data.location,
        data.duration,
        data.price,
        data.organizer_ID,
        data.image,
        data.event_date,
        data.places,
        data.participants || [],
        data.id
    ];


    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
        return res.status(404).json({ message: "event not found!" });
    }

    return res.status(200).json({ message: "Event was updated successfully!", eventId: result.rows[0].id });
});

//Function that either deletes the event from 'upcomingEvents' table and send it to passedEvents or just delete it in case the organizer decided to remove it
const deleteEvent = asyncHandler(async (req, res) => {
    /*
        Tasks on the function
        1. Removes the event from the database
        2. By event field participants, finds all users which have bought tickets, returning their money and removing the events from willParticipate array field on the user
    */
    const { eventData } = JSON.parse(req.query.data);

    let usersWithTickets = eventData.participants;

    let errorMessage = {};

    //Updating all users that have purchased tickets for the deleted event\
    if (usersWithTickets !== null) {
        const updatedUsers = await Promise.all(usersWithTickets.map(async (userId) => {
            const updateUserQuery = `
                UPDATE "users"
                SET "moneySpent" = "moneySpent" - ${eventData.price}, "willParticipate" = array_remove("willParticipate", ${eventData.id}::text)
                WHERE id=${userId}
                RETURNING *
            `;

            const user = await client.query(updateUserQuery);

            if (user.rowCount > 1) {
                errorMessage = { message: "Something went wrong while updating users data. Please try again!", status: 400 };
                return;
            }
            else {
                errorMessage = { message: `User ${user.rows[0].firstName} ${user.rows[0].lastName}, was updated successfully!`, status: 200 };
            }

            console.log(errorMessage.message);
        }))

        if (errorMessage?.status === 400) {
            return res.status(errorMessage.status).json({ message: errorMessage.message });
        }
    }

    //Deleting the event
    const deleteQuery = `
        DELETE FROM "upcomingEvents"
        WHERE id=${eventData.id}
    `;

    const result = await client.query(deleteQuery);

    if (result.rowCount === 0) {
        return res.status(400).json({ message: "Event was not deleted. Please try again!" });
    }

    return res.status(200).json({ message: "Event deleted successfully!" });
});

module.exports = { getEvents2, postEvent, updateEvent, deleteEvent };