// Database variables
let students = {};
let attendanceRecords = [];
let codeReader = null;
let stream = null;
let scanning = false;
let studentCounter = 6;
let dbInitialized = false;

// Student Registration
function registerStudent() {
    if (!dbInitialized) {
        document.getElementById('registrationResult').innerHTML = 
            '<div class="error">Database not initialized. Please wait...</div>';
        return;
    }
    
    const name = document.getElementById('studentName').value.trim();
    const course = document.getElementById('studentCourse').value;
    const roll = document.getElementById('rollNumber').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    
    if (!name || !course || !roll || !phone || !email) {
        document.getElementById('registrationResult').innerHTML = 
            '<div class="error">Please fill all fields!</div>';
        return;
    }
    
    const studentId = 'STU' + String(studentCounter).padStart(3, '0');
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    const success = DatabaseOps.addStudent(studentId, name, course, roll, phone, email, initials);
    
    if (success) {
        studentCounter++;
        document.getElementById('registrationResult').innerHTML = 
            `<div class="success">✅ Student registered successfully! ID: ${studentId}</div>`;
        
        // Clear form
        document.getElementById('studentName').value = '';
        document.getElementById('studentCourse').value = '';
        document.getElementById('rollNumber').value = '';
        document.getElementById('phoneNumber').value = '';
        document.getElementById('studentEmail').value = '';
        
        // Refresh data
        loadStudentsFromDB();
        loadAttendanceFromDB();
        populateDropdowns();
        updateDashboard();
    } else {
        document.getElementById('registrationResult').innerHTML = 
            '<div class="error">Failed to register student!</div>';
    }
}

// Cover Page Transition
function enterPortal() {
    const coverPage = document.getElementById('coverPage');
    const mainApp = document.getElementById('mainApp');
    
    // Exit animation for cover page
    coverPage.style.animation = 'coverExit 0.8s ease-in-out forwards';
    
    setTimeout(() => {
        coverPage.style.display = 'none';
        mainApp.style.display = 'block';
        mainApp.style.animation = 'appEnter 0.8s ease-out forwards';
        
        // Initialize app after entrance
        setTimeout(async () => {
            await initializeApp();
        }, 500);
    }, 800);
}

// Toggle Registration Form
function toggleRegistrationForm() {
    const form = document.getElementById('registrationForm');
    const toggleBtn = document.querySelector('.action-btn');
    const icon = document.getElementById('toggleIcon');
    
    if (form.style.display === 'none' || !form.classList.contains('show')) {
        form.style.display = 'block';
        setTimeout(() => {
            form.classList.add('show');
        }, 10);
        toggleBtn.classList.add('active');
        icon.textContent = '▼';
    } else {
        form.classList.remove('show');
        toggleBtn.classList.remove('active');
        icon.textContent = '▶';
        setTimeout(() => {
            form.style.display = 'none';
        }, 500);
    }
}

// Mobile Menu Toggle
function toggleMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navTabs = document.getElementById('navTabs');
    
    menuToggle.classList.toggle('active');
    navTabs.classList.toggle('active');
}

// Tab Management
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    
    // Close mobile menu after selection
    const menuToggle = document.querySelector('.menu-toggle');
    const navTabs = document.getElementById('navTabs');
    if (menuToggle && navTabs.classList.contains('active')) {
        menuToggle.classList.remove('active');
        navTabs.classList.remove('active');
    }
    
    if (tabName === 'teacher') {
        updateDashboard();
    }
}

// ID Card Generator
function generateIDCard() {
    const studentId = document.getElementById('studentSelect').value;
    if (!studentId) return;
    
    const student = students[studentId];
    const container = document.getElementById('idCardContainer');
    
    container.innerHTML = `
        <div class="id-card">
            <div class="college-name">SHAMBHUNATH COLLEGE</div>
            <div class="student-info">
                <div class="student-photo">${student.photo}</div>
                <div class="student-details">
                    <h3>${student.name}</h3>
                    <p>ID: ${studentId}</p>
                    <p>${student.course}</p>
                </div>
            </div>
            <div class="barcode-section">
                <svg id="barcode-${studentId}"></svg>
                <div style="color: #333; font-size: 10px; margin-top: 5px;">${studentId}</div>
            </div>
        </div>
    `;
    
    // Generate barcode
    JsBarcode(`#barcode-${studentId}`, studentId, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: false
    });
}

function printIDCard() {
    const idCard = document.querySelector('.id-card');
    if (!idCard) {
        alert('Please generate an ID card first!');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print ID Card</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    ${document.querySelector('link[rel="stylesheet"]').sheet.cssText}
                </style>
            </head>
            <body>
                ${idCard.outerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Barcode Scanner
async function startScanner() {
    if (scanning) return;
    
    try {
        scanning = true;
        const videoElement = document.getElementById('scannerVideo');
        
        // Get camera stream
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment'
            } 
        });
        
        videoElement.srcObject = stream;
        
        // Wait for video to load
        await new Promise(resolve => {
            videoElement.onloadedmetadata = resolve;
        });
        
        codeReader = new ZXing.BrowserMultiFormatReader();
        
        // Start continuous scanning
        codeReader.decodeFromVideoDevice(null, 'scannerVideo', (result, err) => {
            if (result && scanning) {
                processBarcode(result.text);
            }
        });
        
        document.getElementById('scanResult').innerHTML = '<div class="success">Scanner started. Point camera at barcode.</div>';
        
    } catch (err) {
        scanning = false;
        document.getElementById('scanResult').innerHTML = '<div class="error">Camera access denied: ' + err.message + '</div>';
    }
}

function stopScanner() {
    scanning = false;
    
    if (codeReader) {
        codeReader.reset();
    }
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    const videoElement = document.getElementById('scannerVideo');
    videoElement.srcObject = null;
    
    document.getElementById('scanResult').innerHTML = '<div class="error">Scanner stopped.</div>';
}

// Gallery Image Scanner
function scanFromImage() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('scannerCanvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            try {
                const codeReader = new ZXing.BrowserMultiFormatReader();
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                codeReader.decodeFromImageData(imageData)
                    .then(result => {
                        processBarcode(result.text);
                    })
                    .catch(err => {
                        document.getElementById('scanResult').innerHTML = '<div class="error">No barcode found in image.</div>';
                    });
            } catch (err) {
                document.getElementById('scanResult').innerHTML = '<div class="error">Error scanning image: ' + err.message + '</div>';
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function processBarcode(studentId) {
    if (students[studentId]) {
        markAttendance(studentId);
    } else {
        document.getElementById('scanResult').innerHTML = '<div class="error">Invalid student ID: ' + studentId + '</div>';
    }
}

function markAttendance(studentId) {
    if (!dbInitialized || !students[studentId]) {
        document.getElementById('scanResult').innerHTML = 
            '<div class="error">Invalid student ID or database not ready!</div>';
        return;
    }
    
    const student = students[studentId];
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    const fullDateTime = now.toLocaleString();
    const today = now.toDateString();
    
    const result = DatabaseOps.markAttendance(studentId, today, timeString, fullDateTime, now.getTime());
    
    if (result.success) {
        document.getElementById('scanResult').innerHTML = 
            `<div class="success">✅ Attendance marked for ${student.name} at ${fullDateTime}</div>`;
        
        // Refresh data
        loadAttendanceFromDB();
        updateDashboard();
        updateAttendanceHistory();
    } else {
        document.getElementById('scanResult').innerHTML = 
            `<div class="error">${result.message || 'Failed to mark attendance'}</div>`;
    }
}

// Teacher Portal Functions
function markManualAttendance() {
    const studentId = document.getElementById('manualStudentSelect').value;
    if (!studentId) {
        alert('Please select a student!');
        return;
    }
    markAttendance(studentId);
    document.getElementById('manualStudentSelect').value = '';
}

function updateDashboard() {
    const today = new Date().toDateString();
    const todayRecords = attendanceRecords.filter(record => record.date === today);
    
    const totalStudents = Object.keys(students).length;
    const presentStudents = todayRecords.length;
    const absentStudents = totalStudents - presentStudents;
    const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
    
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('presentStudents').textContent = presentStudents;
    document.getElementById('absentStudents').textContent = absentStudents;
    document.getElementById('attendanceRate').textContent = attendanceRate + '%';
}

function exportToExcel() {
    const today = new Date().toDateString();
    const todayRecords = attendanceRecords.filter(record => record.date === today);
    
    let csvContent = "Student ID,Name,Course,Time,Status\n";
    todayRecords.forEach(record => {
        csvContent += `${record.studentId},${record.name},${record.course},${record.time},Present\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Show Student Details
function showStudentDetails() {
    const studentId = document.getElementById('detailStudentSelect').value;
    const container = document.getElementById('studentDetailsContainer');
    
    if (!studentId) {
        container.innerHTML = '';
        return;
    }
    
    const student = students[studentId];
    if (!student) {
        container.innerHTML = '<div class="error">Student not found</div>';
        return;
    }
    
    let attendanceCount = 0;
    if (dbInitialized) {
        attendanceCount = DatabaseOps.getStudentAttendanceCount(studentId);
    } else {
        attendanceCount = attendanceRecords.filter(record => record.studentId === studentId).length;
    }
    
    container.innerHTML = `
        <div class="student-card">
            <div class="student-info-grid">
                <div class="info-item">
                    <div class="info-label">Student ID</div>
                    <div class="info-value">${studentId}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${student.name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Course</div>
                    <div class="info-value">${student.course}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Roll Number</div>
                    <div class="info-value">${student.roll || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${student.phone || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${student.email || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Attendance</div>
                    <div class="info-value">${attendanceCount} days</div>
                </div>
            </div>
            <button class="btn btn-danger" onclick="deleteStudent('${studentId}')">🗑️ Delete Student</button>
        </div>
    `;
}

// Delete Student
function deleteStudent(studentId) {
    if (!dbInitialized) return;
    
    if (confirm(`Are you sure you want to delete ${students[studentId].name}?`)) {
        const success = DatabaseOps.deleteStudent(studentId);
        
        if (success) {
            // Refresh data
            loadStudentsFromDB();
            loadAttendanceFromDB();
            populateDropdowns();
            updateDashboard();
            document.getElementById('studentDetailsContainer').innerHTML = '';
            document.getElementById('detailStudentSelect').value = '';
            
            alert('Student deleted successfully!');
        } else {
            alert('Failed to delete student!');
        }
    }
}

// Populate dropdowns
function populateDropdowns() {
    const studentSelect = document.getElementById('studentSelect');
    const manualSelect = document.getElementById('manualStudentSelect');
    const detailSelect = document.getElementById('detailStudentSelect');
    
    // Clear existing options except first
    studentSelect.innerHTML = '<option value="">Select a student</option>';
    manualSelect.innerHTML = '<option value="">Select a student</option>';
    detailSelect.innerHTML = '<option value="">Select a student</option>';
    
    Object.keys(students).forEach(id => {
        const student = students[id];
        const option1 = new Option(`${student.name} - ${student.course}`, id);
        const option2 = new Option(`${student.name} - ${student.course}`, id);
        const option3 = new Option(`${student.name} - ${student.course}`, id);
        studentSelect.add(option1);
        manualSelect.add(option2);
        detailSelect.add(option3);
    });
}

// Update Attendance History
function updateAttendanceHistory() {
    const container = document.getElementById('attendanceHistoryContainer');
    
    if (!container) return;
    
    let records = [];
    if (dbInitialized) {
        records = DatabaseOps.getAttendanceRecords().slice(0, 10);
    } else {
        records = attendanceRecords
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 10);
    }
    
    const sortedRecords = records;
    
    if (sortedRecords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No attendance records yet.</p>';
        return;
    }
    
    container.innerHTML = sortedRecords.map(record => `
        <div class="attendance-record">
            <div class="record-info">
                <div>
                    <div class="record-student">${record.name}</div>
                    <div class="record-course">${record.course} (${record.studentId})</div>
                </div>
            </div>
            <div class="record-datetime">
                <div class="record-date">${record.dateString || record.date}</div>
                <div class="record-time">${record.time}</div>
            </div>
        </div>
    `).join('');
}

// Load data from database
function loadStudentsFromDB() {
    if (dbInitialized) {
        students = DatabaseOps.getAllStudents();
        console.log('Loaded students from DB:', Object.keys(students).length);
    }
}

function loadAttendanceFromDB() {
    if (dbInitialized) {
        attendanceRecords = DatabaseOps.getAttendanceRecords();
        console.log('Loaded attendance records from DB:', attendanceRecords.length);
    }
}

// Initialize database when entering portal
async function initializeApp() {
    if (!dbInitialized) {
        dbInitialized = await initDatabase();
        console.log('Database initialized:', dbInitialized);
    }
    
    if (dbInitialized) {
        loadStudentsFromDB();
        loadAttendanceFromDB();
        populateDropdowns();
        updateDashboard();
        updateAttendanceHistory();
        console.log('Application data loaded');
    } else {
        console.error('Database initialization failed');
    }
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    // Don't initialize database on cover page
    console.log('Page loaded - waiting for user to enter portal');
});