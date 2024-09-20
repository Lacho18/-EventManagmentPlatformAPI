const express = require("express");
const router = express.Router();
const client = require('../connection');

router.route('/*')
    .get(async (req, res) => {
        const { conditions } = JSON.parse(req.query.data);
        const keys = Object.keys(conditions ? conditions : {});

        let hasConditions = keys.length > 0 ? true : false;

        let conditionsQuery = "";

        if (hasConditions) {
            conditionsQuery = keys.map(key => `"${key}" = '${conditions[key]}'`).join(',');
        }
        const allUsers = await client.query("SELECT * FROM users " + (hasConditions ? "WHERE " + conditionsQuery : ""));

        if (allUsers.rowCount > 0) {
            return res.status(200).json({ message: "All users data", allUsers: allUsers.rows });
        }
        else {
            return res.status(400).json({ message: "Bad request!" });
        }
    })

module.exports = router;