-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    course VARCHAR(50) NOT NULL,
    roll VARCHAR(20),
    phone VARCHAR(15),
    email VARCHAR(100),
    photo VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    full_datetime TIMESTAMP NOT NULL,
    timestamp BIGINT NOT NULL,
    UNIQUE(student_id, date)
);

-- Disable RLS for easier access (for development)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- Insert default students
INSERT INTO students (id, name, course, roll, phone, email, photo) VALUES
('STU001', 'Mayank Kushwaha', 'BCA 3rd Year', '001', '9876543210', 'mayank@example.com', 'MK'),
('STU002', 'Rahul Sharma', 'BCA 2nd Year', '002', '9876543211', 'rahul@example.com', 'RS'),
('STU003', 'Priya Singh', 'BCA 1st Year', '003', '9876543212', 'priya@example.com', 'PS')
ON CONFLICT (id) DO NOTHING;