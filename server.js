const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create database and tables
    createTables();
});

// Create Tables
function createTables() {
    // Create students table
    const studentsTable = `
        CREATE TABLE IF NOT EXISTS students (
            id VARCHAR(10) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            course VARCHAR(50) NOT NULL,
            roll VARCHAR(20),
            phone VARCHAR(15),
            email VARCHAR(100),
            photo VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    // Create attendance table
    const attendanceTable = `
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(10) NOT NULL,
            date DATE NOT NULL,
            time TIME NOT NULL,
            full_datetime DATETIME NOT NULL,
            timestamp BIGINT NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE KEY unique_attendance (student_id, date)
        )
    `;
    
    db.query(studentsTable, (err) => {
        if (err) console.error('Error creating students table:', err);
        else console.log('Students table ready');
    });
    
    db.query(attendanceTable, (err) => {
        if (err) console.error('Error creating attendance table:', err);
        else console.log('Attendance table ready');
        
        // Insert default students
        insertDefaultStudents();
    });
}

// Insert Default Students
function insertDefaultStudents() {
    const defaultStudents = [
        ['STU001', 'Mayank Kushwaha', 'BCA 3rd Year', '001', '9876543210', 'mayank@example.com', 'MK'],
        ['STU002', 'Rahul Sharma', 'BCA 2nd Year', '002', '9876543211', 'rahul@example.com', 'RS'],
        ['STU003', 'Priya Singh', 'BCA 1st Year', '003', '9876543212', 'priya@example.com', 'PS'],
        ['STU004', 'Amit Kumar', 'BCA 3rd Year', '004', '9876543213', 'amit@example.com', 'AK'],
        ['STU005', 'Sneha Patel', 'BCA 2nd Year', '005', '9876543214', 'sneha@example.com', 'SP']
    ];
    
    defaultStudents.forEach(student => {
        const query = 'INSERT IGNORE INTO students (id, name, course, roll, phone, email, photo) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(query, student, (err) => {
            if (err) console.error('Error inserting default student:', err);
        });
    });
}

// API Routes

// Get all students
app.get('/api/students', (req, res) => {
    const query = 'SELECT * FROM students ORDER BY name';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Add new student
app.post('/api/students', (req, res) => {
    const { id, name, course, roll, phone, email, photo } = req.body;
    const query = 'INSERT INTO students (id, name, course, roll, phone, email, photo) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.query(query, [id, name, course, roll, phone, email, photo], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id: id });
    });
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
    const studentId = req.params.id;
    const query = 'DELETE FROM students WHERE id = ?';
    
    db.query(query, [studentId], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Mark attendance
app.post('/api/attendance', (req, res) => {
    const { student_id, date, time, full_datetime, timestamp } = req.body;
    const query = 'INSERT INTO attendance (student_id, date, time, full_datetime, timestamp) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [student_id, date, time, full_datetime, timestamp], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                res.json({ success: false, message: 'Already marked today' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        res.json({ success: true });
    });
});

// Get attendance records
app.get('/api/attendance', (req, res) => {
    const query = `
        SELECT a.*, s.name, s.course 
        FROM attendance a 
        JOIN students s ON a.student_id = s.id 
        ORDER BY a.timestamp DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Get student attendance count
app.get('/api/attendance/count/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const query = 'SELECT COUNT(*) as count FROM attendance WHERE student_id = ?';
    
    db.query(query, [studentId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ count: results[0].count });
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});