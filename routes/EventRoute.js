const express = require("express");
const router = express.Router();
const eventsFunctions = require('../controllers/eventsController');

router.route('/*')
    .get(eventsFunctions.getEvents)
    .post(eventsFunctions.postEvent)
    .put(eventsFunctions.updateEvent)
    .delete(eventsFunctions.deleteEvent);

module.exports = router;