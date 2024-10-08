const client = require('../connection');

const dailyUpdate = async () => {
    const currentDate = new Date();
    const currentDateStart = new Date(currentDate.setHours(0, 0, 0, 0));
    const today = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

    //Gets every event from upcomingEvents table
    const allUpcomingEvents = await client.query("SELECT * FROM \"upcomingEvents\"");

    const passedEvents = [];

    if (allUpcomingEvents.rowCount === 0) {
        return;
    }

    //Stores inside array every id of passed event
    allUpcomingEvents.rows.forEach(event => {
        const eventDate = new Date(event.event_date);
        if (eventDate < currentDateStart) {
            passedEvents.push(event.id);
        }
    });

    console.log("Passed events!");
    console.log(passedEvents);

    //No events are passed for the current day
    if (passedEvents.length === 0) {
        console.log("No changed events on date - " + today);
        return;
    }

    //Query for deleting all passed events
    const deleteQuery = `
            DELETE FROM "upcomingEvents"
            WHERE id = ANY($1::int[])
            RETURNING *
        `;

    console.log("DELETE QUERY!")
    console.log(deleteQuery);

    const deletedEvents = await client.query(deleteQuery, [passedEvents]);

    console.log("Deleted events");
    console.log(deletedEvents.rows);

    //No events were deleted
    if (deletedEvents.rowCount === 0) {
        console.log("No changed events on date - " + today);
        return;
    }

    //Inserts every deleted event in the passed events database
    const insertOperations = await Promise.all(deletedEvents.rows.map(async (event) => {
        const insertQuery = `
            INSERT INTO "passedEvents" (name, description, location, duration, price, "organizer_ID", image, event_date, places, participants)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        console.log("           ");
        console.log("Inserting event");
        console.log(event)
        console.log(insertQuery);

        const values = [
            event.name,
            event.description,
            event.location,
            event.duration,
            event.price,
            event.organizer_ID,
            event.image,
            event.event_date,
            event.places,
            event.participants
        ];

        const result = await client.query(insertQuery, values);
        console.log(result.rowCount);
        console.log("                   ");

        if (result.rowCount === 1) {
            return "Success";
        }
        else {
            return "Error while inserting";
        }
    }));

    insertOperations.forEach(operation => console.log(operation));

    console.log("Daily operation complete. Today date - " + today);

    return;
}

module.exports = dailyUpdate;