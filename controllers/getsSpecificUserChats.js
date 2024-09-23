const asyncHandler = require('express-async-handler');
const client = require('../connection');
const { query } = require('express');

const getSpecificUserChats = asyncHandler(async (req, res) => {
    const { userId } = JSON.parse(req.query.data);

    const query = `
        SELECT "id", "firstName", "lastName", "userImage"
        FROM "users"
        WHERE id != ${userId} 
    `;

    const result = await client.query(query);

    if (result.rowCount === 0) {
        return res.status(400).json({ message: "No users in the database!" });
    }

    return res.status(200).json({ message: "Successful request!", allUsers: result.rows });
});

module.exports = { getSpecificUserChats };