const asyncHandler = require('express-async-handler');
const client = require('../connection');

const buyTicket = asyncHandler(async (req, res) => {
    console.log(req.body);
    const { eventId, userId, ticketsAmount } = req.body;

    //Finds the event and event data validations
    const event = await client.query(`SELECT * FROM "upcomingEvents" WHERE id=${eventId}`);

    if (event.rowCount !== 1) {
        return res.status(400).json({ message: "No such event exists in the database" });
    }

    if (event.rows[0].places < ticketsAmount) {
        return res.status(400).json({ message: "There aren't these amount of places for the events!" });
    }

    //Update user
    const userQuery = `
        UPDATE "users"
        SET "moneySpent" = "moneySpent" + ${event.rows[0].price * ticketsAmount}, "willParticipate" = 
                CASE WHEN array_position("willParticipate", ${eventId}::text) IS NULL THEN array_append("willParticipate", ${eventId}::text)
                ELSE "willParticipate"
        END
        WHERE id = ${userId}
        RETURNING *
    `;

    const updatedUser = await client.query(userQuery);

    if (updatedUser.rowCount === 0) {
        return res.status(400).json({ message: "Error while updating your data. Please try again!" });
    }

    //Update event 
    const eventQuery = `
        UPDATE "upcomingEvents"
        SET "places"="places"-${ticketsAmount}, "participants" = 
                CASE WHEN array_position("participants", ${userId}::text) IS NULL THEN array_append("participants", ${userId}::text)
                ELSE "participants"
        END
        WHERE id=${eventId}
        RETURNING *
    `;

    const updatedEvent = await client.query(eventQuery);

    console.log(updatedEvent.rows[0]);

    if (updatedEvent.rowCount === 0) {
        return res.status(400).json({ message: "Error while updating event data. Please try again!" });
    }

    return res.status(200).json({ message: "Purchase completed successfully!" });
});

module.exports = { buyTicket };