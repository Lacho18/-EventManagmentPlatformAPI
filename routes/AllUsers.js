const express = require("express");
const router = express.Router();
const client = require('../connection');

router.route('/*')
    .get(async (req, res) => {
        const allUsers = await client.query("SELECT * FROM users RETURNING *");

        if (allUsers.rowCount > 0) {
            return res.status(200).json({ message: "All users data", allUsers: allUsers.rows });
        }
        else {
            return res.status(400).json({ message: "Bad request!" });
        }
    })

module.exports = router;