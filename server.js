const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

//  Use express.static to serve static files from the current folder
app.use(express.static(__dirname));   // 👈 Add this here

//  MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'akoalilika1',
    database: 'mentra_db'
});

//  Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

// API to fetch mentors
app.get('/mentors', (req, res) => {
    const sql = 'SELECT * FROM mentors';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch mentors' });
        } else {
            res.json(results);
        }
    });
});

//  (Optional) Serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//  Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

