const express = require("express");
const router = express.Router();
const { buyTicket } = require("../controllers/buyTicketController");

router.route('/*')
    .post(buyTicket)

module.exports = router;