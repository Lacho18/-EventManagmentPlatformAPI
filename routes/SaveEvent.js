const express = require("express");
const router = express.Router();
const saveEvents = require("../controllers/saveEventController");

router.route('/*')
    .get(saveEvents.addToSavedEvents)
    .delete(saveEvents.removeFromSavedEvents);      

module.exports = router;
