// SQL.js Database Implementation
let db = null;

// Initialize Database
async function initDatabase() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        db = new SQL.Database();
        
        // Create students table
        db.run(`
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                course TEXT NOT NULL,
                roll TEXT,
                phone TEXT,
                email TEXT,
                photo TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create attendance table
        db.run(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                full_datetime TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (student_id) REFERENCES students (id)
            )
        `);
        
        // Insert default students
        insertDefaultStudents();
        
        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Database initialization failed:', error);
        return false;
    }
}

// Insert default students
function insertDefaultStudents() {
    const defaultStudents = [
        ['STU001', 'Mayank Kushwaha', 'BCA 3rd Year', '001', '9876543210', 'mayank@example.com', 'MK'],
        ['STU002', 'Rahul Sharma', 'BCA 2nd Year', '002', '9876543211', 'rahul@example.com', 'RS'],
        ['STU003', 'Priya Singh', 'BCA 1st Year', '003', '9876543212', 'priya@example.com', 'PS'],
        ['STU004', 'Amit Kumar', 'BCA 3rd Year', '004', '9876543213', 'amit@example.com', 'AK'],
        ['STU005', 'Sneha Patel', 'BCA 2nd Year', '005', '9876543214', 'sneha@example.com', 'SP']
    ];
    
    defaultStudents.forEach(student => {
        try {
            db.run(`INSERT OR IGNORE INTO students (id, name, course, roll, phone, email, photo) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`, student);
        } catch (error) {
            console.error('Error inserting default student:', error);
        }
    });
}

// Database Operations
const DatabaseOps = {
    // Student Operations
    addStudent: (id, name, course, roll, phone, email, photo) => {
        try {
            db.run(`INSERT INTO students (id, name, course, roll, phone, email, photo) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                   [id, name, course, roll, phone, email, photo]);
            return true;
        } catch (error) {
            console.error('Error adding student:', error);
            return false;
        }
    },
    
    getAllStudents: () => {
        try {
            const stmt = db.prepare('SELECT * FROM students ORDER BY name');
            const students = {};
            while (stmt.step()) {
                const row = stmt.getAsObject();
                students[row.id] = {
                    name: row.name,
                    course: row.course,
                    roll: row.roll,
                    phone: row.phone,
                    email: row.email,
                    photo: row.photo
                };
            }
            stmt.free();
            return students;
        } catch (error) {
            console.error('Error getting students:', error);
            return {};
        }
    },
    
    deleteStudent: (studentId) => {
        try {
            db.run('DELETE FROM students WHERE id = ?', [studentId]);
            db.run('DELETE FROM attendance WHERE student_id = ?', [studentId]);
            return true;
        } catch (error) {
            console.error('Error deleting student:', error);
            return false;
        }
    },
    
    // Attendance Operations
    markAttendance: (studentId, date, time, fullDateTime, timestamp) => {
        try {
            // Check if already marked today
            const stmt = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND date = ?');
            stmt.bind([studentId, date]);
            stmt.step();
            const result = stmt.getAsObject();
            stmt.free();
            
            if (result.count > 0) {
                return { success: false, message: 'Already marked today' };
            }
            
            db.run(`INSERT INTO attendance (student_id, date, time, full_datetime, timestamp) 
                     VALUES (?, ?, ?, ?, ?)`, 
                   [studentId, date, time, fullDateTime, timestamp]);
            return { success: true };
        } catch (error) {
            console.error('Error marking attendance:', error);
            return { success: false, message: 'Database error' };
        }
    },
    
    getAttendanceRecords: () => {
        try {
            const stmt = db.prepare(`
                SELECT a.*, s.name, s.course 
                FROM attendance a 
                JOIN students s ON a.student_id = s.id 
                ORDER BY a.timestamp DESC
            `);
            const records = [];
            while (stmt.step()) {
                const row = stmt.getAsObject();
                records.push({
                    studentId: row.student_id,
                    name: row.name,
                    course: row.course,
                    date: row.date,
                    time: row.time,
                    fullDateTime: row.full_datetime,
                    timestamp: row.timestamp
                });
            }
            stmt.free();
            return records;
        } catch (error) {
            console.error('Error getting attendance records:', error);
            return [];
        }
    },
    
    getTodayAttendance: () => {
        try {
            const today = new Date().toDateString();
            const stmt = db.prepare(`
                SELECT a.*, s.name, s.course 
                FROM attendance a 
                JOIN students s ON a.student_id = s.id 
                WHERE a.date = ?
                ORDER BY a.timestamp DESC
            `);
            stmt.bind([today]);
            const records = [];
            while (stmt.step()) {
                const row = stmt.getAsObject();
                records.push({
                    studentId: row.student_id,
                    name: row.name,
                    course: row.course,
                    time: row.time,
                    timestamp: row.timestamp
                });
            }
            stmt.free();
            return records;
        } catch (error) {
            console.error('Error getting today attendance:', error);
            return [];
        }
    },
    
    getStudentAttendanceCount: (studentId) => {
        try {
            const stmt = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE student_id = ?');
            stmt.bind([studentId]);
            stmt.step();
            const result = stmt.getAsObject();
            stmt.free();
            return result.count;
        } catch (error) {
            console.error('Error getting attendance count:', error);
            return 0;
        }
    }
};

// Export database for browser
window.DatabaseOps = DatabaseOps;
window.initDatabase = initDatabase;