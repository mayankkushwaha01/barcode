// Supabase Client Configuration
const SUPABASE_URL = 'https://tbjnmvezrijgypwinosh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiam5tdmV6cmlqZ3lwd2lub3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Mjg4MTgsImV4cCI6MjA3NTAwNDgxOH0.7UYwL21s4fDrK7ekpD4GIiGy3KsIyciIgmrf4ncH2wc';

// Initialize Supabase client
let supabaseClient;
try {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully');
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
}

// Database operations using Supabase client
const SupabaseAPI = {
    async addStudent(id, name, course, roll, phone, email, photo) {
        try {
            const { data, error } = await supabaseClient
                .from('students')
                .insert({ id, name, course, roll, phone, email, photo })
                .select();
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            return { success: true };
        } catch (error) {
            console.error('Error adding student:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getAllStudents() {
        try {
            const { data, error } = await supabaseClient
                .from('students')
                .select('*')
                .order('name');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    },
    
    async deleteStudent(id) {
        try {
            const { error } = await supabaseClient
                .from('students')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting student:', error);
            return { success: false };
        }
    },
    
    async markAttendance(studentId) {
        try {
            const now = new Date();
            const { data, error } = await supabaseClient
                .from('attendance')
                .insert({
                    student_id: studentId,
                    date: now.toISOString().split('T')[0],
                    time: now.toTimeString().split(' ')[0],
                    full_datetime: now.toISOString(),
                    timestamp: now.getTime()
                })
                .select();
            
            if (error) {
                console.error('Attendance error:', error);
                if (error.code === '23505' || error.message.includes('duplicate')) {
                    return { success: false, message: 'Already marked today' };
                }
                throw error;
            }
            return { success: true };
        } catch (error) {
            console.error('Error marking attendance:', error);
            return { success: false, message: error.message };
        }
    },
    
    async getAttendanceRecords() {
        try {
            const { data, error } = await supabaseClient
                .from('attendance')
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            
            // Get student data separately
            const { data: students, error: studentsError } = await supabaseClient
                .from('students')
                .select('*');
            
            if (studentsError) throw studentsError;
            
            // Merge data
            const studentsMap = {};
            students.forEach(student => {
                studentsMap[student.id] = student;
            });
            
            return (data || []).map(record => ({
                ...record,
                name: studentsMap[record.student_id]?.name || 'Unknown',
                course: studentsMap[record.student_id]?.course || 'Unknown'
            }));
        } catch (error) {
            console.error('Error fetching attendance:', error);
            return [];
        }
    },
    
    async getStudentAttendanceCount(studentId) {
        try {
            const { count, error } = await supabaseClient
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', studentId);
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching attendance count:', error);
            return 0;
        }
    }
};