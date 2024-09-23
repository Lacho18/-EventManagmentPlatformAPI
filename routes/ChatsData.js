const express = require("express");
const router = express.Router();
const { getSpecificUserChats } = require("../controllers/getsSpecificUserChats");

router.get(getSpecificUserChats);

module.exports = router;