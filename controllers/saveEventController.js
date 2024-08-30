const asyncHandler = require('express-async-handler');
const client = require('../connection');

const addToSavedEvents = asyncHandler(async (req, res) => {
    const { userId, eventId } = JSON.parse(req.query.data);

    const query = `
        UPDATE users
        SET "savedEvents" = 
            CASE
                WHEN array_position("savedEvents", '${eventId}') IS NULL THEN "savedEvents" || '{${eventId}}'  
                ELSE "savedEvents"
            END
        WHERE id=${userId}
        RETURNING id, "savedEvents"
    `;

    const result = await client.query(query);

    if (result.rowCount === 1) {
        return res.status(200).json({ message: "Saved", data: result.rows[0] });
    }
    else {
        return res.status(400).json({ message: "Bad request!" });
    }
});

const removeFromSavedEvents = asyncHandler(async (req, res) => {
    const { userId, eventId } = JSON.parse(req.query.data);

    const query = `
        UPDATE users
        SET "savedEvents" = array_remove("savedEvents", CAST(${eventId} AS text))
        WHERE id=${userId}
        RETURNING id, "savedEvents"
    `;

    const result = await client.query(query);

    if (result.rowCount === 1) {
        return res.status(200).json({ message: "Removed", data: result.rows[0] });
    }
    else {
        return res.status(400).json({ message: "Bad request!" });
    }
});

module.exports = { addToSavedEvents, removeFromSavedEvents };