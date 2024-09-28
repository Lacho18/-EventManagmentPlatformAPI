const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const client = require('../connection');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory where files will be saved
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

// Route to handle file upload
router.post('/', upload.single('file'), async (req, res) => {
    try {
        // Ensure that the file has been uploaded and id is provided
        if (!req.file || !req.body.id) {
            return res.status(400).json({ message: 'File or ID missing' });
        }

        // Escape backslashes in the file path if needed
        const filePath = req.file.path.replace(/\\/g, '/');

        // Use parameterized queries to avoid SQL injection and safely insert values
        const query = `
          UPDATE users
          SET "userImage" = $1
          WHERE id = $2
          RETURNING *;
        `;

        // Execute the query with parameters
        const values = [filePath, req.body.id];
        const result = await client.query(query, values);

        res.json({ message: 'File uploaded and user updated successfully!', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})
    .put('/', async (req, res) => {
        const data = req.body;

        if (data.isClosed) {
            const query = `
                UPDATE users
                SET "userImage" = $1
                WHERE id = $2
                RETURNING "id", "email", "firstName", "lastName", "role", "savedEvents", "userImage";
            `;

            const values = ['empty', data.userId];

            const result = await client.query(query, values);

            if (result.rowCount === 1) {
                return res.status(200).json({ message: "Updated!", data: result.rows[0] });
            }
            else {
                return res.status(400).json({ message: "Bad request!" });
            }
        }
    });

module.exports = router;