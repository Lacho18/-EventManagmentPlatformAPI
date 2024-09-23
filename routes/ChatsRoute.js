const express = require("express");
const router = express.Router();
const chatFunctions = require("../controllers/chatsController");

router.route('/*')
    .get(chatFunctions.getMessages)
    .post(chatFunctions.postMessage)
    .put()
    .delete()

module.exports = router;