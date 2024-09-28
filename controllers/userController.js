const asyncHandler = require('express-async-handler');
const client = require('../connection');
const { getRequestsHandler } = require("../functions/getRequestHandler");
const { adminAccountCheck } = require("../functions/adminAccountCheck");

const getUser = asyncHandler(async (req, res) => {
    const { email, password } = JSON.parse(req.query.data);
    let result = await getRequestsHandler("users", ['email', 'password'], [email, password], undefined, ['id', 'email', 'firstName', 'lastName', 'role', 'savedEvents', 'userImage', 'chats', 'willParticipate']);

    if (result.rows.length === 1) {
        res.status(200).json({ message: "Successfully logged in!", user: result.rows[0] });
    }
    else {
        res.status(400).json({ message: "Invalid email or password!" });
    }
});

const createUser = asyncHandler(async (req, res) => {
    const data = req.body;
    const keys = Object.keys(data);

    //Checks if all fields are fulfilled
    keys.forEach(key => {
        if (data[key] === "") {
            return res.status(400).json({ message: "All fields are required!" });
        }
    });

    //Checks if the given email is unique
    let sameEmail = await getRequestsHandler('users', ['email'], [data.email]);

    if (sameEmail.rows.length !== 0) {
        return res.status(400).json({ message: "User with this email already exists!" });
    }

    //Checks for correct email
    if (!data.email.includes('@')) {
        return res.status(400).json({ message: "Incorrect email!" });
    }

    //Checks if the password is confirmed correct
    if (data.password !== data.confirmPassword) {
        return res.status(400).json({ message: "You should confirm your password correct!" });
    }

    //Checks if the password is at least 8 symbols
    if (data.password.length < 8) {
        return res.status(400).json({ message: "Password should be at least 8 symbols!" });
    }

    //Checks if the password contains only numbers
    if (/^[0-9]+$/.test(data.password)) {
        return res.status(400).json({ message: "Password should not include only numbers!" });
    }

    let currentTime = new Date();
    let givenDate = new Date(data.dateOfBirth);

    //Checks if the given date is next to the current date
    if (givenDate > currentTime) {
        return res.status(400).json({ message: "Invalid date!" });
    }

    let sixteenYearsAgo = new Date();
    sixteenYearsAgo.setFullYear(currentTime.getFullYear() - 16);

    //Checks if the user is at least 16 years old
    if (givenDate > sixteenYearsAgo) {
        return res.status(400).json({ message: "You should be at least 16 years old!" });
    }

    let isAdmin = adminAccountCheck(data.email, data.password, data.lastName);
    let role;

    if (isAdmin) {
        role = 'admin';
        data.lastName = data.lastName.replace("_admin", "");
    }
    else {
        role = data.role;
        if (!role) {
            role = "participant";
        }
    }

    //After successful data, request to insert the user
    try {
        let query = `
            INSERT INTO users (email, password, "firstName", "lastName", gender, "dateOfBirth", chats, role, "moneySpent", "willParticipate", "eventParticipate")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;

        let values = [
            data.email,
            data.password,
            data.firstName,
            data.lastName,
            data.gender,
            data.dateOfBirth,
            [],
            role,
            0,
            [],
            []
        ];

        let result = await client.query(query, values);
        console.log('User created:', result.rows[0]);
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }

    return res.status(200).json({ message: "User created" });
});

const updateUser = asyncHandler(async (req, res) => {
    const updatedKeys = Object.keys(req.body.updatedData);

    let emptyFields = false;

    //Checks for empty updated fields
    updatedKeys.forEach(key => {
        if (req.body.updatedData[key] === "") {
            emptyFields = true;
            return;
        }
    });

    if (emptyFields) {
        return res.status(400).json({ message: "All updated fields are required!" });
    }

    //Sets the query string
    const settingData = updatedKeys.map(key => `"${key}" = '${req.body.updatedData[key]}'`).join(", ");

    const query = `
        UPDATE users
        SET ${settingData}
        WHERE id=${req.body.id}
        RETURNING "id", "email", "firstName", "lastName", "role", "savedEvents", "userImage", "chats", "willParticipate";
    `;

    const result = await client.query(query);
    if (result.rowCount === 1) {
        return res.status(200).json({ message: "Profile updated", data: result.rows[0] });
    }
    else {
        return res.status(400).message({ message: "The request did not complete!" });
    }
});

/*
    Functionality
    1. Removes the user from data base
    2. If organizer removes every event that he has organized
    3. Removes deleted user from every user chats array
*/
const removeUser = asyncHandler(async (req, res) => {
    const { id } = JSON.parse(req.query.data);

    const query = `
        SELECT * FROM users
        WHERE id=${id}
    `;

    const result = await client.query(query);

    if (result.rowCount === 0) {
        return res.status(404).json({ message: "Such user was not found!" });
    }

    if (result.rows[0].role === "organizer") {
        //Deleting every event that is organized by the user
        const allOrganizedEvents = await client.query(`SELECT * FROM "upcomingEvents" WHERE "upcomingEvents"."organizer_ID" = ${result.rows[0].id}`);

        //If the deleted user has organized events
        if (allOrganizedEvents.rowCount > 0) {
            const updatedUsersAfterEventsDelete = await Promise.all(allOrganizedEvents.rows.map(async (deletedEvent) => {
                const participants = deletedEvent.participants;

                //If the events thats are about to be deleted has users that will participate on
                if (participants.length > 0) {
                    const updatedUsers = await Promise.all(participants.map(async (participant) => {
                        const updateUserQuery = `
                                UPDATE "users"    
                                SET "moneySpent" = "moneySpent" - ${deletedEvent.price}, "willParticipate" = array_remove("willParticipate", ${deletedEvent.id}::text)
                                WHERE id=${participant}
                                RETURNING *
                        `;

                        const user = await client.query(updateUserQuery);

                        if (user.rowCount > 0) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }));

                    if (updatedUsers.length === 0) {
                        return 0;
                    }
                    else {
                        return 1;
                    }
                }
                else {
                    return 1;
                }
            }));
        }
        //Deleting the events thats are organized by the deleted organizer 
        const deleteEventsQuery = `
            DELETE FROM "upcomingEvents" WHERE "upcomingEvents"."organizer_ID" = ${result.rows[0].id}
        `;
        const deletedEvents = await client.query(deleteEventsQuery);
    }

    //Removes the deleted user id from every other user chats array 
    if (result.rows[0].chats) {
        if (result.rows[0].chats.length > 0) {
            const deletedUserChats = result.rows[0].chats;

            const correctedUsers = await Promise.all(deletedUserChats.map(async (userId) => {
                let removeChatQuery = `
                    UPDATE "users"
                    SET "chats" = array_remove("chats", ${result.rows[0].id})
                    WHERE id=${userId}    
                `;

                const updateUserChats = await client.query(removeChatQuery);

                if (updateUserChats.rowCount > 0) {
                    return 1;
                }
                else {
                    return 0;
                }
            }));

            //Removes every message that the deleted user has send
            const deleteMessagesQuery = `
                DELETE FROM "chats"
                WHERE "senderId" = ${result.rows[0].id} OR "receiverId" = ${result.rows[0].id}
            `;

            const deleteMessages = await client.query(deleteMessagesQuery);
        }
    }

    const deletingUser = await client.query(`DELETE FROM "users" WHERE id=${id}`);

    if (deletingUser.rowCount === 1) {
        res.status(200).json({ message: "User: " + id + " has been deleted!" })
    }
    else {
        res.status(400).json({ message: "No such user: " + id + " exist!" });
    }
});

module.exports = { getUser, createUser, updateUser, removeUser };
