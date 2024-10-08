const asyncHandler = require('express-async-handler');
const client = require('../connection');

const getMessages = asyncHandler(async (req, res) => {
    const { senderId, receiverId } = JSON.parse(req.query.data);

    const query = `
    SELECT 
        "chats".*,
        "sender"."id" AS "senderID",
        "sender"."firstName" AS "senderFirstName", 
        "sender"."lastName" AS "senderLastName", 
        "sender"."userImage" AS "senderImage",
        "receiver"."firstName" AS "receiverFirstName", 
        "receiver"."lastName" AS "receiverLastName", 
        "receiver"."userImage" AS "receiverImage"
    FROM "chats"
    JOIN "users" AS "sender" ON "chats"."senderId" = "sender"."id"
    JOIN "users" AS "receiver" ON "chats"."receiverId" = "receiver"."id"
    WHERE ("chats"."senderId" = $1 OR "chats"."receiverId" = $1) AND ("chats"."senderId" = $2 OR "chats"."receiverId" = $2)
`;

    const value = [senderId, receiverId];

    const result = await client.query(query, value);

    if (result.rowCount === 0) {
        //Gets the receiver of messages user in order to visualize his image and name even without chats
        const user = await client.query(`SELECT "firstName", "lastName", "userImage" FROM "users" WHERE id=${receiverId}`);
        return res.status(400).json({
            message: "You have no messages. Send Hello.", receiverName: user.rows[0].firstName + " " + user.rows[0].lastName,
            receiverImage: user.rows[0].userImage
        });
    }

    let receiverName = result.rows.find((singleResult) => Number(singleResult.senderId) === Number(senderId));

    const senderName = result.rows.find((singleResult) => Number(singleResult.receiverId) === Number(senderId));

    if (!receiverName) {
        return res.status(200).json({
            message: "Successful request!", messages: result.rows,
            receiverName: senderName.senderFirstName + " " + senderName.senderLastName,
            receiverImage: senderName.senderImage
        });
    }
    return res.status(200).json({
        message: "Successful request!", messages: result.rows,
        receiverName: receiverName.receiverFirstName + " " + receiverName.receiverLastName,
        receiverImage: receiverName.receiverImage
    });
});


const postMessage = asyncHandler(async (req, res) => {
    const data = req.body;

    //Updating the chats array of the users
    const updateUsersQuery = `
        UPDATE "users"
            SET "chats" = CASE
                WHEN id = ${data.senderId} THEN
                CASE 
                    WHEN array_position("chats", ${data.receiverId}) IS NOT NULL THEN
                    array_prepend(${data.receiverId}, array_remove("chats", ${data.receiverId}))
                ELSE
                    array_append("chats", ${data.receiverId})
            END
                WHEN id = ${data.receiverId} THEN
                CASE 
                    WHEN array_position("chats", ${data.senderId}) IS NOT NULL THEN
                    array_prepend(${data.senderId}, array_remove("chats", ${data.senderId}))
                ELSE
                    array_append("chats", ${data.senderId})
            END
            ELSE "chats"
        END
        WHERE id IN (${data.senderId}, ${data.receiverId})
        RETURNING *
    `;

    const updateUsers = await client.query(updateUsersQuery);

    if (updateUsers.rowCount === 0) {
        return res.status(400).json({ message: "Invalid message data send. Please try again!" });
    }

    //Post the message in the chats table
    const query = `
        INSERT INTO "chats" ("senderId", "receiverId", "message", "time_of_send")
        VALUES ($1, $2, $3, $4)
    `;

    const values = [data.senderId, data.receiverId, data.message, new Date()];

    const result = await client.query(query, values);

    if (result.rowCount > 0) {
        let currentUserChats = await client.query("SELECT chats FROM users WHERE id=" + data.senderId)
        return res.status(200).json({ message: "Message posted!", userChats: currentUserChats.rows[0].chats });
    }
    else {
        return res.status(400).json({ message: "Error while posting the message appeared." });
    }
});

module.exports = { getMessages, postMessage };