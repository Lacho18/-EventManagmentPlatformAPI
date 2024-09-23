const asyncHandler = require('express-async-handler');
const client = require('../connection');

const getMessages = asyncHandler(async (req, res) => {
    const { senderId } = JSON.parse(req.query.data);

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
    WHERE "chats"."senderId" = $1 OR "chats"."receiverId" = $1
`;

    const value = [senderId];

    const result = await client.query(query, value);

    const receiverName = result.rows.find((singleResult) => singleResult.senderID === senderId);

    return res.status(200).json({
        message: "Successful request!", messages: result.rows,
        receiverName: receiverName.receiverFirstName + " " + receiverName.receiverLastName,
        receiverImage: receiverName.receiverImage
    });
});


const postMessage = asyncHandler(async (req, res) => {
    const data = req.body;

    const query = `
        INSERT INTO "chats" ("senderId", "receiverId", "message", "time_of_send")
        VALUES ($1, $2, $3, $4)
    `;

    const values = [data.senderId, data.receiverId.data.message, new Date()];

    const result = await client.query(query, values);
});

module.exports = { getMessages, postMessage };