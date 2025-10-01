# Barcode Attendance System with MySQL

A complete college attendance management system using Node.js backend with MySQL database.

## Features
- 🎯 Animated cover page with smooth transitions
- 📝 Student registration with MySQL storage
- 🆔 ID card generation with barcodes
- 📱 Barcode scanning (camera + gallery)
- 👨🏫 Teacher portal with real-time statistics
- 📊 Attendance tracking and management
- 📱 Fully responsive design with hamburger menu

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Libraries**: JsBarcode, ZXing

## Setup Instructions

### Local Development

1. **Install Dependencies**
```bash
npm install
```

2. **Setup MySQL Database**
- Install MySQL server
- Create database named `attendance_system`
- Update database credentials in `server.js` if needed

3. **Start the Server**
```bash
npm start
```

4. **Access Application**
Open browser and go to: `http://localhost:3000`

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Setup Environment Variables**
- Copy `.env.example` to `.env`
- Update with your MySQL database credentials
- Add environment variables in Vercel dashboard

3. **Deploy to Vercel**
```bash
vercel --prod
```

**Required Environment Variables for Vercel:**
- `DB_HOST` - MySQL host
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name (attendance_system)
- `NODE_ENV` - production

## Database Schema

### Students Table
- `id` (VARCHAR) - Primary Key
- `name` (VARCHAR) - Student name
- `course` (VARCHAR) - Course name
- `roll` (VARCHAR) - Roll number
- `phone` (VARCHAR) - Phone number
- `email` (VARCHAR) - Email address
- `photo` (VARCHAR) - Photo initials
- `created_at` (TIMESTAMP) - Registration time

### Attendance Table
- `id` (INT) - Auto increment primary key
- `student_id` (VARCHAR) - Foreign key to students
- `date` (DATE) - Attendance date
- `time` (TIME) - Attendance time
- `full_datetime` (DATETIME) - Complete timestamp
- `timestamp` (BIGINT) - Unix timestamp

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Add new student
- `DELETE /api/students/:id` - Delete student

### Attendance
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/count/:studentId` - Get student attendance count

## Usage

1. **Cover Page**: Beautiful animated entrance
2. **ID Card Generator**: Register students and generate barcoded ID cards
3. **Barcode Scanner**: Scan ID cards for attendance
4. **Teacher Portal**: View statistics and manage students

## Development

For development with auto-restart:
```bash
npm run dev
```

## Author
Mayank Kushwaha