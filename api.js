const client = require('./connection.js')
const express = require('express');
const app = express();

app.listen(3300, () => {
    console.log("Sever is now listening at port 3000");
})

client.connect();

app.get('/users', (req, res) => {
    client.query(`Select * from users`, (err, result) => {
        if (!err) {
            //console.log(result.rows);
            res.send(result.rows);
        }
    });
    client.end;
});