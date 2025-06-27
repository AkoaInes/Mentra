const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const { error } = require('console');

require('dotenv').config();
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname)); // Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, '/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session config
app.use(session({
  secret: 'mentra-secret',
  resave: false,
  saveUninitialized: false,
}));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

const uploadFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}_${file.fieldname}${ext}`;
      cb(null, uniqueName);
    }
  })
});

db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Middleware to protect routes
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

app.get('/', (req, res) => {
  //if (req.session.user) {
   // const page = req.session.user.status === 'mentor' ? 'main.html' : 'main_mentee.html';
   // res.redirect(`/${page}`);
 // } else {
    res.sendFile(path.join(__dirname, 'public', 'Landing.html'));
  //}
});

// Register mentee
app.post('/api/register', async (req, res) => {
  const { name, surname, email, password } = req.body;

  if (!name || !surname || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO mentee (name, surname, email, password, profile_img, status)
                 VALUES (?, ?, ?, ?, 'default_profile.jpg', 'mentee')`;

    db.query(sql, [name, surname, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Registered successfully", user_id: result.insertId });
      console.log('Registering:', req.body);
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login for both mentor and mentee
app.post('/login', (req, res) => {
  const { name, password, status } = req.body;
  const table = status === 'mentor' ? 'mentors' : 'mentee';

  const query = `SELECT * FROM ${table} WHERE name = ?`;
  db.query(query, [name], async (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(401).send('Invalid credentials');

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send('Invalid credentials');

    req.session.user = user;
res.json({
  message: 'Login successful',
  user_id: user.id,
  status: user.status,   // or just use status from req.body
  name: user.name
});
  });
});

// Get mentors linked to mentee
app.get('/api/my-mentors', requireLogin, (req, res) => {
  const menteeId = req.session.user.id;
  const query = `
  SELECT mentors.id, mentors.name, mentors.course, mentors.profile_img
  FROM mentor_mentee 
  JOIN mentors ON mentor_mentee.mentor_id = mentors.id 
  WHERE mentor_mentee.mentee_id = ?
`;

  db.query(query, [menteeId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch mentors' });
    res.json(results);
  });
});

// Account info
app.get('/api/mentee_account-info', requireLogin, (req, res) => {
  const id = req.session.user.id;

  const query = 'SELECT name, surname, profile_img FROM mentee WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Mentee not found' });

    const user = results[0];
    res.json({
      name: user.name,
      surname: user.surname,
      image: `/${user.profile_img || 'default.png'}`
    });
  });
});

app.get('/api/mentor_account-info', requireLogin, (req, res) => {
  const id = req.session.user.id;

  const query = 'SELECT name, surname, profile_img FROM mentors WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Mentee not found' });

    const user = results[0];
    res.json({
      name: user.name,
      surname: user.surname,
      image: `/${user.profile_img || 'default.png'}`
    });
  });
});


// Profile image upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `mentee_${req.session.user.id}${ext}`);
    }
  })
});

app.post('/upload-profile-image', requireLogin, upload.single('profileImage'), (req, res) => {
  const fileName = req.file.filename;
  const id = req.session.user.id;

  db.query('UPDATE mentee SET profile_img = ? WHERE id = ?', [fileName, id], (err) => {
    if (err) return res.status(500).json({ error: 'Image update failed' });
    res.json({ message: 'Profile picture updated!' });
  });
});

// Session data for specific mentor
app.get('/api/sessions/:mentorId', requireLogin, (req, res) => {
  const menteeId = req.session.user.id;
  const mentorId = req.params.mentorId;

  const query = `
    SELECT topic, duration, date 
    FROM sessions 
    WHERE mentee_id = ? AND mentor_id = ?
    ORDER BY date DESC
  `;

  db.query(query, [menteeId, mentorId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
    res.json(results);
  });
});

// Get mentees for a specific mentor
app.get('/api/my-mentees', (req, res) => {
  const mentorId = req.query.mentor_id;
  if (!mentorId) return res.status(400).json({ error: "mentor_id required" });

  const sql = `
  SELECT me.id, me.name, me.surname, me.course, me.profile_img
  FROM mentor_mentee mm
  JOIN mentee me ON mm.mentee_id = me.id
  WHERE mm.mentor_id = ?
`;  

  db.query(sql, [mentorId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Start session
app.post('/api/sessions/start', (req, res) => {
  const { mentor_id, mentee_id, start_time } = req.body;
  const sql = `
    INSERT INTO sessions (mentor_id, mentee_id, date, start_time)
    VALUES (?, ?, CURDATE(), ?)
  `;

  db.query(sql, [mentor_id, mentee_id, start_time], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ session_id: result.insertId });
  });
});

// End session
app.post('/api/sessions/end', (req, res) => {
  const { session_id, end_time, duration } = req.body;
  const sql = `
    UPDATE sessions SET end_time = ?, duration = ?
    WHERE session_id = ?
  `;

  db.query(sql, [end_time, duration, session_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Session ended." });
  });
});

// Send list of available mentors to mentees
app.get('/api/available-mentors', (req, res) => {
  const query = `
    SELECT id, name, surname, course, level, profile_img 
    FROM mentors
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching mentors:', err);
      return res.status(500).json({ error: 'Failed to load mentors' });
    }
    res.json(results);
  });
});

// Send mentorship request from mentee to mentor
app.post('/api/send-request', requireLogin, (req, res) => {
  const { mentor_id } = req.body;
  const mentee_id = req.session.user.id;

  if (!mentor_id) {
    return res.status(400).json({ error: 'mentor_id is required' });
  }

  const sql = `
    INSERT INTO mentorship_requests (mentor_id, mentee_id)
    VALUES (?, ?)
  `;

  db.query(sql, [mentor_id, mentee_id], (err, result) => {
    if (err) {
      // Handle duplicate request gracefully
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "You've already sent a request to this mentor." });
      }
      console.error('Error inserting request:', err);
      return res.status(500).json({ error: 'Failed to send request' });
    }
    res.json({ message: 'Request sent successfully!' });
  });
});

// Inbox: Get all mentorship requests sent to a mentor (with mentee names)
app.get('/api/requests/inbox', (req, res) => {
  const mentorId = req.query.mentor_id;
  if (!mentorId) return res.status(400).json({ error: "mentor_id required" });

  const sql = `
    SELECT r.request_id, r.status, r.requested_at,
           m.id AS mentee_id, m.name AS mentee_name, m.surname AS mentee_surname
    FROM mentorship_requests r
    JOIN mentee m ON r.mentee_id = m.id
    WHERE r.mentor_id = ?
    ORDER BY r.requested_at DESC
  `;

  db.query(sql, [mentorId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Outbox: Get all mentorship requests sent by a mentee (with mentor names)
app.get('/api/requests/outbox', (req, res) => {
  const menteeId = req.query.mentee_id;
  if (!menteeId) return res.status(400).json({ error: "mentee_id required" });

  const sql = `
    SELECT r.request_id, r.status, r.requested_at,
           m.id AS mentor_id, m.name AS mentor_name, m.surname AS mentor_surname
    FROM mentorship_requests r
    JOIN mentors m ON r.mentor_id = m.id
    WHERE r.mentee_id = ?
    ORDER BY r.requested_at DESC
  `;

  db.query(sql, [menteeId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/respond-request', (req, res) => {
  const { request_id, action } = req.body;

  // Step 1: Update status
  db.query('UPDATE mentorship_requests SET status = ? WHERE request_id = ?', [action, request_id], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to update request status' });

    if (action === 'accept') {
      // Step 2: Get mentor_id and mentee_id
      db.query('SELECT mentor_id, mentee_id FROM mentorship_requests WHERE request_id = ?', [request_id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch request info' });
        if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });

        const { mentor_id, mentee_id } = rows[0];

        // Step 3: Check if already linked
        db.query('SELECT * FROM mentor_mentee WHERE mentor_id = ? AND mentee_id = ?', [mentor_id, mentee_id], (err, existing) => {
          if (err) return res.status(500).json({ message: 'Error checking existing link' });

          if (existing.length === 0) {
            // Step 4: Insert into mentor_mentee
            db.query('INSERT INTO mentor_mentee (mentor_id, mentee_id) VALUES (?, ?)', [mentor_id, mentee_id], (err) => {
              if (err) return res.status(500).json({ message: 'Failed to link mentor and mentee' });
              return res.json({ message: 'Request accepted and linked successfully' });
            });
          } else {
            return res.json({ message: 'Request accepted. Already linked.' });
          }
        });
      });
    } else {
      res.json({ message: 'Request rejected successfully' });
    }
  });
});

app.post('/api/sessions/upload', uploadFiles.fields([
  { name: 'notes', maxCount: 1 },
  { name: 'assignment', maxCount: 1 }
]), (req, res) => {
  const { session_id } = req.body;
  const notesPath = req.files['notes'] ? req.files['notes'][0].filename : null;
  const assignmentPath = req.files['assignment'] ? req.files['assignment'][0].filename : null;

  const sql = `UPDATE sessions SET notes_path = ?, assignments_path = ? WHERE session_id = ?`;
  db.query(sql, [notesPath, assignmentPath, session_id], err => {
    if (err) return res.status(500).json({ error: 'Upload failed' });
    res.json({ message: 'Files uploaded' });
  });
});

app.get('/api/sessions/:sessionId/files', (req, res) => {
  const sessionId = req.params.sessionId;

  const sql = `SELECT notes_path, assignments_path FROM sessions WHERE session_id = ?`;
  db.query(sql, [sessionId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results[0]) return res.status(404).json({ error: 'Session not found' });
    res.json(results[0]);
  });
});

app.get('/api/linked-users', (req, res) => {
  const { user_id, status } = req.query;

  if (!user_id || !status) return res.status(400).json({ error: "Missing user_id or status" });

  if (status === 'mentee') {
    const sql = `
      SELECT mentors.id, mentors.name, mentors.surname, mentors.profile_img
      FROM mentor_mentee
      JOIN mentors ON mentor_mentee.mentor_id = mentors.id
      WHERE mentor_mentee.mentee_id = ?
    `;
    db.query(sql, [user_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } else if (status === 'mentor') {
    const sql = `
      SELECT mentee.id, mentee.name, mentee.surname, mentee.profile_img
      FROM mentor_mentee
      JOIN mentee ON mentor_mentee.mentee_id = mentee.id
      WHERE mentor_mentee.mentor_id = ?
    `;
    db.query(sql, [user_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } else {
    res.status(400).json({ error: "Invalid status" });
  }
});

app.get('/api/sessions/history', (req, res) => {
  const { mentor_id, mentee_id, range } = req.query;

  if (!mentor_id || !mentee_id) return res.status(400).json({ error: "Missing mentor or mentee ID" });

  let sql = `
    SELECT session_id, topic, duration, date AS session_date
    FROM sessions
    WHERE mentor_id = ? AND mentee_id = ?
  `;
  const params = [mentor_id, mentee_id];

  // Optional filtering by date range
  if (range === '24h') {
    sql += ' AND date >= NOW() - INTERVAL 1 DAY';
  } else if (range === '7d') {
    sql += ' AND date >= NOW() - INTERVAL 7 DAY';
  } else if (range === '1m') {
    sql += ' AND date >= NOW() - INTERVAL 1 MONTH';
  } else if (range === '3m') {
    sql += ' AND date >= NOW() - INTERVAL 3 MONTH';
  } else if (range === '1y') {
    sql += ' AND date >= NOW() - INTERVAL 1 YEAR';
  }

  sql += ' ORDER BY date DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/register-mentor', async (req, res) => {
  const { name, surname, password, email, level, course } = req.body;

  if (!name || !surname || !password || !email || !level || !course) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO mentors (name, surname, password, email, level, course, profile_img, status)
      VALUES (?, ?, ?, ?, ?, ?, 'default_profile.jpg', 'mentor')
    `;
    db.query(sql, [name, surname, hashedPassword, email, level, course], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Mentor registered successfully!', id: result.insertId });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});