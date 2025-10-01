// Student Database
const students = {
    'STU001': { name: 'Mayank Kushwaha', course: 'BCA 3rd Year', photo: 'MK' },
    'STU002': { name: 'Rahul Sharma', course: 'BCA 2nd Year', photo: 'RS' },
    'STU003': { name: 'Priya Singh', course: 'BCA 1st Year', photo: 'PS' },
    'STU004': { name: 'Amit Kumar', course: 'BCA 3rd Year', photo: 'AK' },
    'STU005': { name: 'Sneha Patel', course: 'BCA 2nd Year', photo: 'SP' }
};

let attendanceRecords = [];
let codeReader = null;
let stream = null;
let scanning = false;

// Tab Management
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    
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
                    ${document.querySelector('style').innerHTML}
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
        codeReader = new ZXing.BrowserMultiFormatReader();
        
        // Start video stream
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        });
        
        const videoElement = document.getElementById('scannerVideo');
        videoElement.srcObject = stream;
        
        // Continuous scanning
        const scanLoop = async () => {
            if (!scanning) return;
            
            try {
                const result = await codeReader.decodeOnceFromVideoDevice(undefined, 'scannerVideo');
                if (result && scanning) {
                    processBarcode(result.text);
                    // Continue scanning after a short delay
                    setTimeout(scanLoop, 2000);
                }
            } catch (err) {
                if (scanning) {
                    setTimeout(scanLoop, 500);
                }
            }
        };
        
        scanLoop();
        document.getElementById('scanResult').innerHTML = '<div class="success">Scanner started. Point camera at barcode.</div>';
        
    } catch (err) {
        scanning = false;
        document.getElementById('scanResult').innerHTML = '<div class="error">Camera access denied or not available</div>';
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
            try {
                const codeReader = new ZXing.BrowserMultiFormatReader();
                codeReader.decodeFromImageElement(img)
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
    const student = students[studentId];
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    // Check if already marked today
    const today = now.toDateString();
    const existingRecord = attendanceRecords.find(record => 
        record.studentId === studentId && record.date === today
    );
    
    if (existingRecord) {
        document.getElementById('scanResult').innerHTML = 
            `<div class="error">Attendance already marked for ${student.name} today at ${existingRecord.time}</div>`;
        return;
    }
    
    // Add attendance record
    attendanceRecords.push({
        studentId: studentId,
        name: student.name,
        course: student.course,
        time: timeString,
        date: today
    });
    
    document.getElementById('scanResult').innerHTML = 
        `<div class="success">✅ Attendance marked for ${student.name} at ${timeString}</div>`;
    
    updateDashboard();
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
    
    // Update attendance table
    const tableBody = document.getElementById('attendanceTableBody');
    tableBody.innerHTML = '';
    
    todayRecords.forEach(record => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${record.studentId}</td>
            <td>${record.name}</td>
            <td>${record.course}</td>
            <td>${record.time}</td>
            <td><span class="status-present">Present</span></td>
        `;
    });
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

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
});