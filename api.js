// API Client for MySQL Backend
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Database Operations with MySQL Backend
const DatabaseOps = {
    // Student Operations
    addStudent: async (id, name, course, roll, phone, email, photo) => {
        try {
            const response = await fetch(`${API_BASE}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, name, course, roll, phone, email, photo })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error adding student:', error);
            return false;
        }
    },
    
    getAllStudents: async () => {
        try {
            const response = await fetch(`${API_BASE}/students`);
            const students = await response.json();
            
            // Convert array to object format for compatibility
            const studentsObj = {};
            students.forEach(student => {
                studentsObj[student.id] = {
                    name: student.name,
                    course: student.course,
                    roll: student.roll,
                    phone: student.phone,
                    email: student.email,
                    photo: student.photo
                };
            });
            return studentsObj;
        } catch (error) {
            console.error('Error getting students:', error);
            return {};
        }
    },
    
    deleteStudent: async (studentId) => {
        try {
            const response = await fetch(`${API_BASE}/students/${studentId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error deleting student:', error);
            return false;
        }
    },
    
    // Attendance Operations
    markAttendance: async (studentId, date, time, fullDateTime, timestamp) => {
        try {
            const response = await fetch(`${API_BASE}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    date: date,
                    time: time,
                    full_datetime: fullDateTime,
                    timestamp: timestamp
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error marking attendance:', error);
            return { success: false, message: 'Network error' };
        }
    },
    
    getAttendanceRecords: async () => {
        try {
            const response = await fetch(`${API_BASE}/attendance`);
            const records = await response.json();
            
            // Convert to expected format
            return records.map(record => ({
                studentId: record.student_id,
                name: record.name,
                course: record.course,
                date: new Date(record.full_datetime).toDateString(),
                time: record.time,
                fullDateTime: record.full_datetime,
                timestamp: record.timestamp
            }));
        } catch (error) {
            console.error('Error getting attendance records:', error);
            return [];
        }
    },
    
    getStudentAttendanceCount: async (studentId) => {
        try {
            const response = await fetch(`${API_BASE}/attendance/count/${studentId}`);
            const result = await response.json();
            return result.count;
        } catch (error) {
            console.error('Error getting attendance count:', error);
            return 0;
        }
    }
};

// Initialize database connection
async function initDatabase() {
    try {
        // Test connection to backend
        const response = await fetch(`${API_BASE}/students`);
        if (response.ok) {
            console.log('Connected to MySQL backend');
            return true;
        } else {
            console.error('Backend connection failed');
            return false;
        }
    } catch (error) {
        console.error('Database initialization failed:', error);
        return false;
    }
}

// Export for browser
window.DatabaseOps = DatabaseOps;
window.initDatabase = initDatabase;