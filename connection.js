const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: process.env.DATABASE_PASSWORD,
    database: "postgres"
});

client.connect()
    .then(() => console.log("Connection complete"))
    .catch(err => console.log("Connection error: " + err.stack));

module.exports = client;