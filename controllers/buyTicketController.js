const asyncHandler = require('express-async-handler');
const client = require('../connection');

const buyTicket = asyncHandler(async (req, res) => {
    console.log(req.body);
});

module.exports = { buyTicket };