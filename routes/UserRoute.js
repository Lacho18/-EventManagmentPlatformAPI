const express = require("express");
const router = express.Router();
const userFunctions = require('../controllers/userController');
//const userFunctions = require('../controlers/UserController.js');

router.route('/*')
    .get(userFunctions.getUser)
    .post(userFunctions.createUser)
    .put(userFunctions.updateUser)
    .delete(userFunctions.removeUser);

module.exports = router;