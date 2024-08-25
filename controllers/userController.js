const asyncHandler = require('express-async-handler');
const client = require('../connection');

const getUser = asyncHandler(async (req, res) => {
    const { email, password } = JSON.parse(req.query.data);
    console.log(email + "    " + password);
    let result = await findUser(['email', 'password'], [email, password]);
    console.log(result.rows[0]);

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
    let sameEmail = await findUser(['email'], [data.email]);
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
        return res.status(400).json({ message: "Password should not include only symbols!" });
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

    let role = "participant";

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
            0,
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

const updateUser = asyncHandler((req, res) => {
    console.log("Put user function");
});

const removeUser = asyncHandler((req, res) => {
    console.log("Delete user function");
});

//Finds users by specific request
async function findUser(fields, values) {
    if (fields.length !== values.length) {
        return "Invalid parameters";
    }

    const conditions = fields.map((field, index) => `"${field}" = $${index + 1}`).join(' AND ');
    let query = `
            SELECT * FROM users WHERE ${conditions}
    `;

    const result = await client.query(query, values)

    return result;
}

module.exports = { getUser, createUser, updateUser, removeUser };