/**
 * AlgoPlay — Node.js & Express Backend with MongoDB (Mongoose)
 * 
 * Features:
 * - Full REST API for Student & Teacher authentication
 * - MongoDB persistence for Students, Teachers, Exams, Questions, Attempts & Assignments
 * - Multer file upload for teacher assignment distribution
 * - Learning analytics & misconception metric logging
 * - Resilient graceful connection handling (handles offline & active MongoDB instances)
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

// Import Mongoose Models
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Exam = require('./models/Exam');
const Question = require('./models/Question');
const ExamAttempt = require('./models/ExamAttempt');
const Assignment = require('./models/Assignment');
const LearningMetric = require('./models/LearningMetric');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/algoplay';
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
const configuredGeminiKey = String(process.env.GEMINI_API_KEY || '').trim();
const GEMINI_API_KEY = /^(replace-with|your[-_])/i.test(configuredGeminiKey)
  ? ''
  : configuredGeminiKey;
const GEMINI_MODEL = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
const MAX_CHAT_MESSAGE_LENGTH = 1200;
const MAX_CHAT_HISTORY_ITEMS = 10;
const CHAT_WINDOW_MS = 60 * 1000;
const CHAT_REQUESTS_PER_WINDOW = 12;
const chatRateLimits = new Map();
const gemini = GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

if (!process.env.AUTH_SECRET) {
  console.warn('⚠️ AUTH_SECRET is not configured; student tokens will be invalidated on restart.');
}
if (!GEMINI_API_KEY) {
  console.warn('ℹ️ GEMINI_API_KEY is not configured; /api/chat will return a configuration error.');
}

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const allowedExtensions = new Set([
      '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.mp4'
    ]);
    if (!allowedExtensions.has(extension)) {
      return cb(new Error('Unsupported file type. Upload PDF, DOC, DOCX, PNG, JPG, JPEG, or MP4 files.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend and uploads
app.use('/uploads', express.static(UPLOAD_DIR, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.use(express.static(__dirname));

function encodeTokenPart(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createStudentToken(student) {
  const payload = {
    sub: String(student.id || student._id),
    name: student.name,
    role: 'student',
    exp: Date.now() + (8 * 60 * 60 * 1000)
  };
  const encodedPayload = encodeTokenPart(payload);
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function readStudentToken(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return res.status(401).json({ error: 'Student authentication required' });
  }

  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (suppliedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid student session' });
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.role !== 'student' || !payload.sub || payload.exp < Date.now()) {
      return res.status(401).json({ error: 'Expired student session' });
    }
    req.student = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid student session' });
  }
}

function allowChatRequest(req, res, next) {
  const key = `${req.student.sub}:${req.ip}`;
  const now = Date.now();
  const recent = (chatRateLimits.get(key) || []).filter(timestamp => now - timestamp < CHAT_WINDOW_MS);
  if (recent.length >= CHAT_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: 'You have reached the short-term chat limit. Please try again in a minute.' });
  }
  recent.push(now);
  chatRateLimits.set(key, recent);
  next();
}

function cleanChatHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(item => item && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string')
    .slice(-MAX_CHAT_HISTORY_ITEMS)
    .map(item => ({ role: item.role, text: item.text.slice(0, MAX_CHAT_MESSAGE_LENGTH) }));
}

// MongoDB Connection State Tracking
let isMongoConnected = false;

// Fallback in-memory stores for seamless offline operation
const memoryStore = {
  students: [],
  teachers: [],
  exams: [
    { id: '1', title: 'Mid-Term Mathematics Test', subject: 'Mathematics', duration: 30, is_active: true },
    { id: '2', title: 'General Science Assessment', subject: 'Science', duration: 25, is_active: true },
    { id: '3', title: 'Computer Logic & Coding Quiz', subject: 'Technology', duration: 20, is_active: true }
  ],
  questions: [
    { id: '101', exam_id: '1', question: 'What is 15 * 8 - 25?', A: '95', B: '105', C: '85', D: '115', correct: 'A' },
    { id: '102', exam_id: '1', question: 'Which fraction is equivalent to 1/2?', A: '2/4', B: '2/6', C: '3/8', D: '1/4', correct: 'A' },
    { id: '201', exam_id: '2', question: 'Which organelle is the powerhouse of the cell?', A: 'Nucleus', B: 'Mitochondria', C: 'Ribosome', D: 'Chloroplast', correct: 'B' },
    { id: '301', exam_id: '3', question: 'What does HTML stand for?', A: 'Hyper Text Markup Language', B: 'High Tech Machine Language', C: 'Hyperlink Text Mode Layout', D: 'Home Tool Markup Language', correct: 'A' }
  ],
  assignments: [
    { id: 'a1', subject: 'Science', teacher_name: 'Prof. Sharma', date: '2026-10-10', filename: 'science_lab_guide.pdf' },
    { id: 'a2', subject: 'Mathematics', teacher_name: 'Prof. Sharma', date: '2026-10-09', filename: 'fractions_practice.pdf' },
    { id: 'a3', subject: 'Technology', teacher_name: 'Mrs. Sen', date: '2026-10-08', filename: 'intro_algorithms.pdf' }
  ],
  attempts: []
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 2500
})
.then(() => {
  isMongoConnected = true;
  console.log('✅ Connected to MongoDB successfully at:', MONGODB_URI);
})
.catch((err) => {
  isMongoConnected = false;
  console.warn('⚠️ MongoDB connection could not be established:', err.message);
  console.warn('ℹ️ Running in resilient fallback mode with in-memory persistence.');
});

mongoose.connection.on('connected', () => { isMongoConnected = true; });
mongoose.connection.on('disconnected', () => { isMongoConnected = false; });

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    backend: 'Node.js / Express',
    database: isMongoConnected ? 'MongoDB (Connected)' : 'MongoDB (Resilient Fallback Active)'
  });
});

// ------------------------------------------
// 1. STUDENT AUTHENTICATION
// ------------------------------------------

app.post('/api/demo-login', (req, res) => {
  const student = {
    id: '101',
    name: 'Demo Learner',
    age: 12,
    schoolname: 'AlgoPlay Academy',
    classofstudy: 'Grade 6',
    score: 45,
    xp: 120
  };
  res.json({ message: 'Demo login successful', student, token: createStudentToken(student) });
});

// Student Signup
app.post('/Signup', async (req, res) => {
  try {
    const { name, age, schoolname, classofstudy, password } = req.body;
    if (!name || !age || !schoolname || !classofstudy || !password) {
      return res.status(400).json({ error: 'Missing required signup fields' });
    }

    if (isMongoConnected) {
      const existing = await Student.findOne({ name });
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      const student = new Student({
        name,
        age: Number(age),
        schoolname,
        classofstudy,
        password,
        score: 0,
        xp: 120
      });
      await student.save();
      const clientStudent = student.toClient();
      return res.status(201).json({
        message: 'Signup successful',
        student: clientStudent,
        token: createStudentToken(clientStudent)
      });
    } else {
      // Memory fallback
      const existing = memoryStore.students.find(s => s.name === name);
      if (existing) return res.status(400).json({ error: 'Username already exists' });
      const newStudent = {
        id: String(Date.now()),
        name,
        age: Number(age),
        schoolname,
        classofstudy,
        password,
        score: 0,
        xp: 120
      };
      memoryStore.students.push(newStudent);
      return res.status(201).json({
        message: 'Signup successful',
        student: newStudent,
        token: createStudentToken(newStudent)
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student Login
app.post('/Login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password required' });
    }

    if (isMongoConnected) {
      const student = await Student.findOne({ name: identifier });
      if (!student) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const isMatch = await student.comparePassword(password);
      if (!isMatch && student.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      student.last_login = new Date();
      await student.save();
      const clientStudent = student.toClient();
      return res.json({
        message: 'Login successful',
        student: clientStudent,
        token: createStudentToken(clientStudent)
      });
    } else {
      const student = memoryStore.students.find(s => s.name === identifier && s.password === password);
      if (!student) {
        // Create demo student for smooth demo preview if not found
        const demoStudent = {
          id: '101',
          name: identifier,
          age: 12,
          schoolname: 'AlgoPlay Academy',
          classofstudy: 'Grade 6',
          score: 45,
          xp: 120
        };
        return res.json({
          message: 'Login successful (Demo Mode)',
          student: demoStudent,
          token: createStudentToken(demoStudent)
        });
      }
      return res.json({ message: 'Login successful', student, token: createStudentToken(student) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gemini-powered student tutor
app.post('/api/chat', readStudentToken, allowChatRequest, async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message || message.length > MAX_CHAT_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message must be between 1 and ${MAX_CHAT_MESSAGE_LENGTH} characters.` });
  }

  if (!gemini) {
    return res.status(503).json({
      error: 'The AI tutor is not configured on the server. Add GEMINI_API_KEY to vidya_verse/.env and restart the backend.'
    });
  }

  const history = cleanChatHistory(req.body.history);
  const contents = [
    ...history.map(item => ({ role: item.role, parts: [{ text: item.text }] })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await Promise.race([
      gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: `You are AlgoBuddy, a friendly educational tutor for students in Classes 6-10.
Explain Maths, Science, English, and Technology in simple, age-appropriate language.
Use step-by-step explanations, examples, and hints. Encourage understanding instead of copying.
Generate practice questions when requested. Adapt to the student's class when known.
Do not claim access to private grades, assignments, or records. If uncertain, say so.
Never provide direct answers to active exam questions; explain the general concept or offer a similar practice problem instead.
The authenticated student's display name is ${req.student.name}.`,
          temperature: 0.4,
          maxOutputTokens: 700
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out')), 15000))
    ]);

    const text = typeof response.text === 'string' ? response.text.trim() : '';
    if (!text) {
      return res.status(502).json({ error: 'The AI tutor returned an empty response. Please try again.' });
    }
    return res.json({ response: text });
  } catch (err) {
    console.error('AI tutor request failed:', err);
    const providerMessage = String(err.message || err.status || '').toLowerCase();
    if (
      providerMessage.includes('api key') ||
      providerMessage.includes('api_key_invalid') ||
      providerMessage.includes('unauthorized') ||
      providerMessage.includes('permission denied') ||
      providerMessage.includes('401') ||
      providerMessage.includes('403')
    ) {
      return res.status(502).json({
        error: 'The Gemini API key was rejected. Check GEMINI_API_KEY in vidya_verse/.env and restart the backend.'
      });
    }
    if (
      providerMessage.includes('quota') ||
      providerMessage.includes('resource exhausted') ||
      providerMessage.includes('rate limit') ||
      providerMessage.includes('429')
    ) {
      return res.status(429).json({ error: 'The AI tutor is temporarily busy. Please try again shortly.' });
    }
    if (
      providerMessage.includes('timeout') ||
      providerMessage.includes('network') ||
      providerMessage.includes('fetch failed') ||
      providerMessage.includes('econnreset') ||
      providerMessage.includes('enotfound')
    ) {
      return res.status(502).json({ error: 'The AI tutor service could not be reached. Please try again.' });
    }
    return res.status(502).json({ error: 'The AI tutor could not respond right now. Please try again.' });
  }
});

// ------------------------------------------
// 2. TEACHER AUTHENTICATION & DASHBOARD
// ------------------------------------------

// Teacher Signup
app.post('/TeacherSignup', async (req, res) => {
  try {
    const { name, email, schoolname, password } = req.body;
    if (!name || !email || !schoolname || !password) {
      return res.status(400).json({ error: 'Missing required teacher fields' });
    }

    if (isMongoConnected) {
      const existing = await Teacher.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email already exists' });
      const teacher = new Teacher({ name, email, schoolname, password });
      await teacher.save();
      return res.status(201).json({ message: 'Signup successful', teacher: teacher.toClient() });
    } else {
      const existing = memoryStore.teachers.find(t => t.email === email);
      if (existing) return res.status(400).json({ error: 'Email already exists' });
      const newTeacher = { id: String(Date.now()), name, email, schoolname, password };
      memoryStore.teachers.push(newTeacher);
      return res.status(201).json({ message: 'Signup successful', teacher: newTeacher });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Login
app.post('/TeacherLogin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (isMongoConnected) {
      const teacher = await Teacher.findOne({ email });
      if (!teacher) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const isMatch = await teacher.comparePassword(password);
      if (!isMatch && teacher.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      teacher.last_login = new Date();
      await teacher.save();
      return res.json({ message: 'Login successful', teacher: teacher.toClient() });
    } else {
      const teacher = memoryStore.teachers.find(t => t.email === email && t.password === password) || {
        id: '1',
        name: 'Prof. Sharma',
        email: email || 'teacher@algoplay.org',
        schoolname: 'AlgoPlay Demonstration School'
      };
      return res.json({ message: 'Login successful', teacher });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Dashboard Metrics
app.get('/teacher/dashboard', async (req, res) => {
  try {
    const { email } = req.query;
    let teacher = null;
    let students = [];

    if (isMongoConnected && email) {
      teacher = await Teacher.findOne({ email });
      if (teacher) {
        students = await Student.find({ schoolname: teacher.schoolname });
      }
    }

    if (!students || students.length === 0) {
      students = isMongoConnected ? await Student.find().limit(20) : memoryStore.students;
    }

    // Default sample class data for complete teacher visibility
    if (students.length === 0) {
      students = [
        { id: 1, name: 'Aarav Patel', age: 11, schoolname: 'AlgoPlay Demo', classofstudy: 'Grade 6', score: 85, xp: 420 },
        { id: 2, name: 'Diya Sharma', age: 12, schoolname: 'AlgoPlay Demo', classofstudy: 'Grade 6', score: 92, xp: 510 },
        { id: 3, name: 'Vihaan Reddy', age: 11, schoolname: 'AlgoPlay Demo', classofstudy: 'Grade 6', score: 48, xp: 190 },
        { id: 4, name: 'Ananya Rao', age: 12, schoolname: 'AlgoPlay Demo', classofstudy: 'Grade 6', score: 78, xp: 340 },
        { id: 5, name: 'Kavya Nair', age: 11, schoolname: 'AlgoPlay Demo', classofstudy: 'Grade 6', score: 32, xp: 130 }
      ];
    }

    const totalStudents = students.length;
    const activeStudents = students.filter(s => (s.score || 0) > 0).length;
    const excellent = students.filter(s => (s.score || 0) >= 80).length;
    const average = students.filter(s => (s.score || 0) >= 40 && (s.score || 0) < 80).length;
    const needsHelp = students.filter(s => (s.score || 0) < 40).length;

    const classDistribution = {};
    students.forEach(s => {
      const cls = s.classofstudy || 'Grade 6';
      classDistribution[cls] = (classDistribution[cls] || 0) + 1;
    });

    res.json({
      teacher: teacher ? (teacher.toClient ? teacher.toClient() : teacher) : { name: 'Prof. Sharma', schoolname: 'AlgoPlay Academy' },
      stats: {
        total_students: totalStudents,
        active_students: activeStudents
      },
      progress_chart: {
        excellent,
        average,
        needs_help: needsHelp
      },
      class_chart: classDistribution,
      students: students.map(s => (s.toClient ? s.toClient() : s))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------
// 3. EXAMS & ASSESSMENTS
// ------------------------------------------

// Create Exam (Full parameters: title, subject, duration, class_grade, instructions, passing_marks, etc.)
app.post('/exam/create', async (req, res) => {
  try {
    const {
      title,
      subject,
      duration,
      teacher_id,
      description,
      class_grade,
      instructions,
      passing_marks,
      negative_marking,
      marks_per_question,
      shuffle_questions,
      shuffle_options,
      show_results_immediately,
      show_correct_answers,
      max_attempts,
      start_date,
      end_date
    } = req.body;

    if (!title || !subject || !duration) {
      return res.status(400).json({ error: 'Title, subject, and duration required' });
    }

    const durationMins = Number(duration) || 25;

    if (isMongoConnected) {
      const exam = new Exam({
        title: title.trim(),
        subject: subject.trim(),
        description: description ? description.trim() : '',
        class_grade: class_grade ? class_grade.trim() : '',
        duration_minutes: durationMins,
        teacher_id: teacher_id || '1',
        is_active: true,
        is_published: true,
        is_draft: false,
        instructions: instructions ? instructions.trim() : 'Please complete all questions before the timer expires.',
        passing_marks: Number(passing_marks) || 40,
        negative_marking: Number(negative_marking) || 0,
        marks_per_question: Number(marks_per_question) || 1,
        shuffle_questions: Boolean(shuffle_questions),
        shuffle_options: Boolean(shuffle_options),
        show_results_immediately: show_results_immediately !== undefined ? Boolean(show_results_immediately) : true,
        show_correct_answers: show_correct_answers !== undefined ? Boolean(show_correct_answers) : true,
        max_attempts: Number(max_attempts) || 1,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        published_at: new Date()
      });
      await exam.save();
      return res.status(201).json({ success: true, exam_id: String(exam._id), exam });
    } else {
      const id = 'EXAM_' + Date.now();
      const newExam = {
        id,
        _id: id,
        title: title.trim(),
        subject: subject.trim(),
        description: description ? description.trim() : '',
        class_grade: class_grade ? class_grade.trim() : '',
        duration: durationMins,
        duration_minutes: durationMins,
        teacher_id: teacher_id || '1',
        is_active: true,
        is_published: true,
        is_draft: false,
        instructions: instructions ? instructions.trim() : 'Please complete all questions before the timer expires.',
        passing_marks: Number(passing_marks) || 40,
        negative_marking: Number(negative_marking) || 0,
        marks_per_question: Number(marks_per_question) || 1,
        show_results_immediately: true,
        show_correct_answers: true,
        created_at: new Date()
      };
      memoryStore.exams.unshift(newExam);
      return res.status(201).json({ success: true, exam_id: id, exam: newExam });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Question to Exam
app.post('/exam/:exam_id/add-question', async (req, res) => {
  try {
    const { exam_id } = req.params;
    const { question, A, B, C, D, correct, marks, explanation, difficulty, order } = req.body;

    if (!question || !A || !B) {
      return res.status(400).json({ error: 'Question text and at least options A and B are required' });
    }

    const cleanCorrect = (correct || 'A').toUpperCase().trim();

    if (isMongoConnected) {
      const q = new Question({
        exam_id: String(exam_id),
        question_text: question.trim(),
        option_a: A.trim(),
        option_b: B.trim(),
        option_c: (C || '').trim(),
        option_d: (D || '').trim(),
        correct_option: ['A', 'B', 'C', 'D'].includes(cleanCorrect) ? cleanCorrect : 'A',
        marks: Number(marks) || 1,
        explanation: explanation ? explanation.trim() : '',
        difficulty: difficulty || 'medium',
        order: Number(order) || 0
      });
      await q.save();

      // Update exam question count and total marks
      const totalQ = await Question.countDocuments({ exam_id: String(exam_id) });
      const questionsList = await Question.find({ exam_id: String(exam_id) });
      const totalMarks = questionsList.reduce((acc, curr) => acc + (curr.marks || 1), 0);
      await Exam.findByIdAndUpdate(exam_id, { total_questions: totalQ, total_marks: totalMarks }).catch(() => {});

      return res.status(201).json({ message: 'Question added', question_id: String(q._id) });
    } else {
      const id = 'Q_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const newQ = {
        id,
        _id: id,
        exam_id: String(exam_id),
        question: question.trim(),
        question_text: question.trim(),
        A: A.trim(),
        B: B.trim(),
        C: (C || '').trim(),
        D: (D || '').trim(),
        correct: ['A', 'B', 'C', 'D'].includes(cleanCorrect) ? cleanCorrect : 'A',
        correct_option: ['A', 'B', 'C', 'D'].includes(cleanCorrect) ? cleanCorrect : 'A',
        marks: Number(marks) || 1,
        explanation: explanation || ''
      };
      memoryStore.questions.push(newQ);
      return res.status(201).json({ message: 'Question added', question_id: id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Exam (Admin / Teacher action to make exam active)
app.post('/exam/:exam_id/start', async (req, res) => {
  try {
    const { exam_id } = req.params;
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(exam_id)) {
        await Exam.findByIdAndUpdate(exam_id, { is_active: true, is_published: true });
      } else {
        await Exam.updateMany({ _id: exam_id }, { is_active: true, is_published: true });
      }
    } else {
      const e = memoryStore.exams.find(x => String(x.id) === String(exam_id) || String(x._id) === String(exam_id));
      if (e) {
        e.is_active = true;
        e.is_published = true;
      }
    }
    res.json({ success: true, message: 'Exam started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop / Close Exam (Admin / Teacher action)
app.post('/exam/:exam_id/stop', async (req, res) => {
  try {
    const { exam_id } = req.params;
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(exam_id)) {
        await Exam.findByIdAndUpdate(exam_id, { is_active: false });
      } else {
        await Exam.updateMany({ _id: exam_id }, { is_active: false });
      }
    } else {
      const e = memoryStore.exams.find(x => String(x.id) === String(exam_id) || String(x._id) === String(exam_id));
      if (e) e.is_active = false;
    }
    res.json({ success: true, message: 'Exam stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Exam
app.delete('/exam/:exam_id', async (req, res) => {
  try {
    const { exam_id } = req.params;
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(exam_id)) {
        await Exam.findByIdAndDelete(exam_id);
        await Question.deleteMany({ exam_id: String(exam_id) });
        await ExamAttempt.deleteMany({ exam_id: String(exam_id) });
      }
    } else {
      memoryStore.exams = memoryStore.exams.filter(e => String(e.id) !== String(exam_id) && String(e._id) !== String(exam_id));
      memoryStore.questions = memoryStore.questions.filter(q => String(q.exam_id) !== String(exam_id));
    }
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Exam Details (For Instructions Screen / Metadata)
app.get('/exam/:exam_id/details', async (req, res) => {
  try {
    const { exam_id } = req.params;
    let examData = null;
    let questionCount = 0;
    let totalMarks = 0;

    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(exam_id)) {
        examData = await Exam.findById(exam_id);
      }
      if (!examData) {
        examData = await Exam.findOne({ _id: exam_id });
      }
      if (examData) {
        const qList = await Question.find({ exam_id: String(exam_id) });
        questionCount = qList.length;
        totalMarks = qList.reduce((acc, q) => acc + (q.marks || 1), 0);
      }
    } else {
      examData = memoryStore.exams.find(e => String(e.id) === String(exam_id) || String(e._id) === String(exam_id));
      if (examData) {
        const qList = memoryStore.questions.filter(q => String(q.exam_id) === String(exam_id));
        questionCount = qList.length;
        totalMarks = qList.reduce((acc, q) => acc + (q.marks || 1), 0);
      }
    }

    if (!examData) {
      // Fallback for default demo exams 1, 2, 3
      const found = memoryStore.exams.find(e => String(e.id) === String(exam_id));
      if (found) {
        return res.json({
          id: String(found.id),
          title: found.title,
          subject: found.subject,
          duration: found.duration || 30,
          total_questions: 4,
          total_marks: 4,
          passing_marks: 40,
          instructions: 'Complete all questions before the timer expires.'
        });
      }
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({
      id: String(examData._id || examData.id),
      title: examData.title,
      subject: examData.subject,
      description: examData.description || '',
      class_grade: examData.class_grade || '',
      duration: examData.duration_minutes || examData.duration || 25,
      total_questions: questionCount || examData.total_questions || 5,
      total_marks: totalMarks || examData.total_marks || questionCount || 5,
      passing_marks: examData.passing_marks || 40,
      negative_marking: examData.negative_marking || 0,
      instructions: examData.instructions || 'Review all questions carefully. You can mark questions for review and navigate freely before final submission.',
      is_active: examData.is_active !== undefined ? examData.is_active : true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Active Exams (Enhanced for Students)
app.get('/exams/active', async (req, res) => {
  try {
    const { student_id, class_grade } = req.query;
    let resultExams = [];

    if (isMongoConnected) {
      const query = { is_active: true };
      if (class_grade) {
        query.$or = [{ class_grade }, { class_grade: { $exists: false } }, { class_grade: '' }];
      }
      const exams = await Exam.find(query).sort({ created_at: -1 });
      
      for (const e of exams) {
        const qCount = await Question.countDocuments({ exam_id: String(e._id) });
        // Check if student has already submitted or has in-progress attempt
        let attemptStatus = 'available';
        if (student_id) {
          const attempt = await ExamAttempt.findOne({ exam_id: String(e._id), student_id: String(student_id) });
          if (attempt) {
            if (['submitted', 'auto_submitted', 'expired'].includes(attempt.status)) {
              attemptStatus = 'submitted';
            } else if (attempt.status === 'in_progress') {
              attemptStatus = 'in_progress';
            }
          }
        }
        resultExams.push({
          id: String(e._id),
          title: e.title,
          subject: e.subject,
          description: e.description || '',
          class_grade: e.class_grade || 'All Grades',
          duration: e.duration_minutes,
          total_questions: qCount,
          is_active: e.is_active,
          student_status: attemptStatus
        });
      }
    }

    if (resultExams.length === 0) {
      // Return memoryStore exams
      resultExams = memoryStore.exams.map(e => {
        const qCount = memoryStore.questions.filter(q => String(q.exam_id) === String(e.id || e._id)).length;
        let attemptStatus = 'available';
        if (student_id && memoryStore.attempts) {
          const att = memoryStore.attempts.find(a => String(a.exam_id) === String(e.id || e._id) && String(a.student_id) === String(student_id));
          if (att) {
            attemptStatus = att.status;
          }
        }
        return {
          id: String(e.id || e._id),
          title: e.title,
          subject: e.subject,
          description: e.description || '',
          class_grade: e.class_grade || 'All Grades',
          duration: e.duration || e.duration_minutes || 25,
          total_questions: qCount || 4,
          is_active: e.is_active !== undefined ? e.is_active : true,
          student_status: attemptStatus
        };
      });
    }

    res.json(resultExams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student Starts / Resumes an Attempt (Server Authoritative Expiry)
app.post('/exam/:exam_id/start-attempt', async (req, res) => {
  try {
    const { exam_id } = req.params;
    const { student_id } = req.body;
    const cleanStudentId = String(student_id || '101');
    const cleanExamId = String(exam_id);

    // 1. Fetch exam duration
    let durationMins = 25;
    if (isMongoConnected) {
      let exam = null;
      if (mongoose.Types.ObjectId.isValid(cleanExamId)) {
        exam = await Exam.findById(cleanExamId);
      }
      if (!exam) exam = await Exam.findOne({ _id: cleanExamId });
      if (exam) durationMins = exam.duration_minutes || 25;
    } else {
      const e = memoryStore.exams.find(x => String(x.id) === cleanExamId || String(x._id) === cleanExamId);
      if (e) durationMins = e.duration || e.duration_minutes || 25;
    }

    const now = new Date();

    if (isMongoConnected) {
      // Check existing attempt
      let existingAttempt = await ExamAttempt.findOne({
        exam_id: cleanExamId,
        student_id: cleanStudentId
      });

      if (existingAttempt) {
        // If already submitted, return finalized status
        if (['submitted', 'auto_submitted', 'expired'].includes(existingAttempt.status)) {
          return res.json({
            already_submitted: true,
            status: existingAttempt.status,
            attempt_id: String(existingAttempt._id),
            score: existingAttempt.score,
            max_score: existingAttempt.max_score,
            message: 'You have already submitted this exam.'
          });
        }

        // In progress — check if expired
        const expiresAt = new Date(existingAttempt.expires_at);
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

        if (remainingSeconds <= 0) {
          // Time expired — mark auto submitted
          existingAttempt.status = 'expired';
          existingAttempt.submitted_at = now;
          await existingAttempt.save();
          return res.json({
            expired: true,
            status: 'expired',
            attempt_id: String(existingAttempt._id),
            message: 'Exam time has expired.'
          });
        }

        // Resume active attempt
        return res.json({
          resumed: true,
          attempt_id: String(existingAttempt._id),
          answers: existingAttempt.answers || {},
          started_at: existingAttempt.started_at,
          expires_at: existingAttempt.expires_at,
          remaining_seconds: remainingSeconds,
          status: 'in_progress'
        });
      }

      // Create new attempt
      const expiresAt = new Date(now.getTime() + durationMins * 60 * 1000);
      const newAttempt = new ExamAttempt({
        exam_id: cleanExamId,
        student_id: cleanStudentId,
        started_at: now,
        expires_at: expiresAt,
        status: 'in_progress',
        answers: {}
      });
      await newAttempt.save();

      return res.json({
        resumed: false,
        attempt_id: String(newAttempt._id),
        answers: {},
        started_at: now,
        expires_at: expiresAt,
        remaining_seconds: durationMins * 60,
        status: 'in_progress'
      });

    } else {
      // Memory Store fallback
      if (!memoryStore.attempts) memoryStore.attempts = [];
      let existing = memoryStore.attempts.find(a => String(a.exam_id) === cleanExamId && String(a.student_id) === cleanStudentId);

      if (existing) {
        if (['submitted', 'auto_submitted', 'expired'].includes(existing.status)) {
          return res.json({
            already_submitted: true,
            status: existing.status,
            attempt_id: existing.id,
            score: existing.score,
            max_score: existing.max_score,
            message: 'You have already submitted this exam.'
          });
        }
        const expiresAt = new Date(existing.expires_at);
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        return res.json({
          resumed: true,
          attempt_id: existing.id,
          answers: existing.answers || {},
          started_at: existing.started_at,
          expires_at: existing.expires_at,
          remaining_seconds: remainingSeconds,
          status: 'in_progress'
        });
      }

      const expiresAt = new Date(now.getTime() + durationMins * 60 * 1000);
      const newAttempt = {
        id: 'ATT_' + Date.now(),
        exam_id: cleanExamId,
        student_id: cleanStudentId,
        started_at: now,
        expires_at: expiresAt,
        status: 'in_progress',
        answers: {}
      };
      memoryStore.attempts.push(newAttempt);
      return res.json({
        resumed: false,
        attempt_id: newAttempt.id,
        answers: {},
        started_at: now,
        expires_at: expiresAt,
        remaining_seconds: durationMins * 60,
        status: 'in_progress'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Progress in Background (Autosave answers per question)
app.post('/exam/:exam_id/save-progress', async (req, res) => {
  try {
    const { exam_id } = req.params;
    const { student_id, answers, current_question_index } = req.body;
    const cleanStudentId = String(student_id || '101');
    const cleanExamId = String(exam_id);

    if (isMongoConnected) {
      const attempt = await ExamAttempt.findOne({ exam_id: cleanExamId, student_id: cleanStudentId });
      if (attempt && attempt.status === 'in_progress') {
        attempt.answers = { ...attempt.answers, ...(answers || {}) };
        attempt.updated_at = new Date();
        await attempt.save();
        return res.json({ success: true, message: 'Progress saved' });
      }
    } else {
      const att = (memoryStore.attempts || []).find(a => String(a.exam_id) === cleanExamId && String(a.student_id) === cleanStudentId);
      if (att && att.status === 'in_progress') {
        att.answers = { ...att.answers, ...(answers || {}) };
        return res.json({ success: true, message: 'Progress saved' });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Exam Questions (SECURE: DOES NOT LEAK CORRECT ANSWERS TO STUDENTS!)
app.get('/exam/:exam_id/questions', async (req, res) => {
  try {
    const { exam_id } = req.params;
    const cleanExamId = String(exam_id);

    if (isMongoConnected) {
      const questions = await Question.find({ exam_id: cleanExamId }).sort({ order: 1, _id: 1 });
      if (questions.length > 0) {
        return res.json(questions.map(q => ({
          id: String(q._id),
          question: q.question_text,
          A: q.option_a,
          B: q.option_b,
          C: q.option_c || '',
          D: q.option_d || '',
          marks: q.marks || 1
        })));
      }
    }

    const filtered = memoryStore.questions.filter(q => String(q.exam_id) === cleanExamId);
    const source = filtered.length > 0 ? filtered : memoryStore.questions;
    res.json(source.map(q => ({
      id: String(q.id || q._id),
      question: q.question || q.question_text,
      A: q.A || q.option_a,
      B: q.B || q.option_b,
      C: q.C || q.option_c || '',
      D: q.D || q.option_d || '',
      marks: q.marks || 1
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reliable & Idempotent Exam Submission
app.post('/exam/:exam_id/submit', async (req, res) => {
  try {
    const { exam_id } = req.params;
    const { student_id, answers, auto_submitted } = req.body;
    const cleanStudentId = String(student_id || '101');
    const cleanExamId = String(exam_id);
    const userAnswers = answers || {};

    const now = new Date();

    if (isMongoConnected) {
      // 1. Fetch official questions with correct options
      const questions = await Question.find({ exam_id: cleanExamId });

      let score = 0;
      let totalMarks = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;
      const questionResults = [];

      questions.forEach(q => {
        const qIdStr = String(q._id);
        const chosen = (userAnswers[qIdStr] || '').toUpperCase().trim();
        const correctOpt = (q.correct_option || '').toUpperCase().trim();
        const qMarks = q.marks || 1;
        totalMarks += qMarks;

        if (!chosen) {
          unansweredCount++;
          questionResults.push({
            question_id: qIdStr,
            selected: '',
            correct: correctOpt,
            is_correct: false,
            marks_earned: 0,
            marks_total: qMarks
          });
        } else if (chosen === correctOpt) {
          correctCount++;
          score += qMarks;
          questionResults.push({
            question_id: qIdStr,
            selected: chosen,
            correct: correctOpt,
            is_correct: true,
            marks_earned: qMarks,
            marks_total: qMarks
          });
        } else {
          incorrectCount++;
          questionResults.push({
            question_id: qIdStr,
            selected: chosen,
            correct: correctOpt,
            is_correct: false,
            marks_earned: 0,
            marks_total: qMarks
          });
        }
      });

      const maxScore = totalMarks > 0 ? totalMarks : questions.length;
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const passed = percentage >= 40;

      // 2. Fetch or create ExamAttempt idempotently
      let attempt = await ExamAttempt.findOne({ exam_id: cleanExamId, student_id: cleanStudentId });

      if (attempt) {
        if (['submitted', 'auto_submitted'].includes(attempt.status)) {
          // Idempotent: Return already computed result
          return res.json({
            success: true,
            already_submitted: true,
            score: attempt.score,
            max_score: attempt.max_score,
            percentage: attempt.percentage,
            passed: attempt.passed,
            xpEarned: attempt.score * 15,
            message: 'Exam previously submitted'
          });
        }

        const startedAt = attempt.started_at || new Date(now.getTime() - 60000);
        attempt.status = auto_submitted ? 'auto_submitted' : 'submitted';
        attempt.submitted_at = now;
        attempt.time_taken_seconds = Math.max(1, Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000));
        attempt.answers = userAnswers;
        attempt.score = score;
        attempt.max_score = maxScore;
        attempt.percentage = percentage;
        attempt.passed = passed;
        attempt.question_results = questionResults;
        attempt.updated_at = now;
        await attempt.save();
      } else {
        attempt = new ExamAttempt({
          exam_id: cleanExamId,
          student_id: cleanStudentId,
          status: auto_submitted ? 'auto_submitted' : 'submitted',
          started_at: new Date(now.getTime() - 60000),
          expires_at: now,
          submitted_at: now,
          time_taken_seconds: 60,
          answers: userAnswers,
          score,
          max_score: maxScore,
          percentage,
          passed,
          question_results: questionResults
        });
        await attempt.save();
      }

      // Update student overall score & XP
      if (mongoose.Types.ObjectId.isValid(cleanStudentId)) {
        await Student.findByIdAndUpdate(cleanStudentId, {
          $inc: { score, xp: score * 15 }
        }).catch(() => {});
      } else {
        await Student.findOneAndUpdate({ name: cleanStudentId }, {
          $inc: { score, xp: score * 15 }
        }).catch(() => {});
      }

      return res.json({
        success: true,
        message: 'Exam submitted successfully',
        score,
        max_score: maxScore,
        percentage,
        passed,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unanswered_count: unansweredCount,
        xpEarned: score * 15
      });

    } else {
      // Memory Store Grading
      const qList = memoryStore.questions.filter(q => String(q.exam_id) === cleanExamId);
      const questionsToGrade = qList.length > 0 ? qList : memoryStore.questions;

      let score = 0;
      let totalMarks = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;
      const questionResults = [];

      questionsToGrade.forEach(q => {
        const qIdStr = String(q.id || q._id);
        const chosen = (userAnswers[qIdStr] || '').toUpperCase().trim();
        const correctOpt = (q.correct || q.correct_option || 'A').toUpperCase().trim();
        const qMarks = q.marks || 1;
        totalMarks += qMarks;

        if (!chosen) {
          unansweredCount++;
          questionResults.push({ question_id: qIdStr, selected: '', correct: correctOpt, is_correct: false });
        } else if (chosen === correctOpt) {
          correctCount++;
          score += qMarks;
          questionResults.push({ question_id: qIdStr, selected: chosen, correct: correctOpt, is_correct: true });
        } else {
          incorrectCount++;
          questionResults.push({ question_id: qIdStr, selected: chosen, correct: correctOpt, is_correct: false });
        }
      });

      const maxScore = totalMarks > 0 ? totalMarks : questionsToGrade.length;
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const passed = percentage >= 40;

      if (!memoryStore.attempts) memoryStore.attempts = [];
      let att = memoryStore.attempts.find(a => String(a.exam_id) === cleanExamId && String(a.student_id) === cleanStudentId);
      if (att) {
        att.status = auto_submitted ? 'auto_submitted' : 'submitted';
        att.submitted_at = now;
        att.answers = userAnswers;
        att.score = score;
        att.max_score = maxScore;
        att.percentage = percentage;
        att.passed = passed;
        att.question_results = questionResults;
      } else {
        memoryStore.attempts.push({
          id: 'ATT_' + Date.now(),
          exam_id: cleanExamId,
          student_id: cleanStudentId,
          status: auto_submitted ? 'auto_submitted' : 'submitted',
          submitted_at: now,
          answers: userAnswers,
          score,
          max_score: maxScore,
          percentage,
          passed,
          question_results: questionResults
        });
      }

      return res.json({
        success: true,
        message: 'Exam submitted successfully',
        score,
        max_score: maxScore,
        percentage,
        passed,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unanswered_count: unansweredCount,
        xpEarned: score * 15
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student Result Endpoint
app.get('/exam/:exam_id/result', async (req, res) => {
  try {
    const { exam_id } = req.params;
    const { student_id } = req.query;
    const cleanStudentId = String(student_id || '101');
    const cleanExamId = String(exam_id);

    let attemptData = null;
    let examData = null;
    let questionsData = [];

    if (isMongoConnected) {
      attemptData = await ExamAttempt.findOne({ exam_id: cleanExamId, student_id: cleanStudentId });
      if (mongoose.Types.ObjectId.isValid(cleanExamId)) {
        examData = await Exam.findById(cleanExamId);
      }
      if (!examData) examData = await Exam.findOne({ _id: cleanExamId });
      questionsData = await Question.find({ exam_id: cleanExamId });
    } else {
      attemptData = (memoryStore.attempts || []).find(a => String(a.exam_id) === cleanExamId && String(a.student_id) === cleanStudentId);
      examData = memoryStore.exams.find(e => String(e.id) === cleanExamId || String(e._id) === cleanExamId);
      questionsData = memoryStore.questions.filter(q => String(q.exam_id) === cleanExamId);
    }

    if (!attemptData) {
      return res.status(404).json({ error: 'No submitted attempt found for this student.' });
    }

    const reviewQuestions = questionsData.map(q => {
      const qId = String(q._id || q.id);
      const chosen = (attemptData.answers && attemptData.answers[qId]) || 'Unanswered';
      const isCorrect = chosen === (q.correct_option || q.correct);
      return {
        id: qId,
        question: q.question_text || q.question,
        A: q.option_a || q.A,
        B: q.option_b || q.B,
        C: q.option_c || q.C,
        D: q.option_d || q.D,
        selected: chosen,
        correct: q.correct_option || q.correct,
        is_correct: isCorrect,
        explanation: q.explanation || ''
      };
    });

    res.json({
      exam_title: examData ? examData.title : 'Assessment',
      subject: examData ? examData.subject : 'General',
      score: attemptData.score,
      max_score: attemptData.max_score,
      percentage: attemptData.percentage,
      passed: attemptData.passed,
      status: attemptData.status,
      submitted_at: attemptData.submitted_at,
      time_taken_seconds: attemptData.time_taken_seconds || 0,
      xp_earned: (attemptData.score || 0) * 15,
      questions: reviewQuestions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Exam Monitoring & Results Analytics Endpoint
app.get('/exam/:exam_id/submissions', async (req, res) => {
  try {
    const { exam_id } = req.params;
    const cleanExamId = String(exam_id);
    let attemptsList = [];
    let examTitle = 'Exam';

    if (isMongoConnected) {
      const exam = await Exam.findById(cleanExamId).catch(() => null);
      if (exam) examTitle = exam.title;
      attemptsList = await ExamAttempt.find({ exam_id: cleanExamId }).sort({ submitted_at: -1 });
    } else {
      const e = memoryStore.exams.find(x => String(x.id) === cleanExamId || String(x._id) === cleanExamId);
      if (e) examTitle = e.title;
      attemptsList = (memoryStore.attempts || []).filter(a => String(a.exam_id) === cleanExamId);
    }

    // Enhance attempts with student names
    const enriched = await Promise.all(attemptsList.map(async (att) => {
      let studentName = 'Student #' + att.student_id;
      if (isMongoConnected) {
        if (mongoose.Types.ObjectId.isValid(att.student_id)) {
          const s = await Student.findById(att.student_id);
          if (s) studentName = s.name;
        } else {
          const s = await Student.findOne({ name: att.student_id });
          if (s) studentName = s.name;
        }
      }
      return {
        id: String(att._id || att.id),
        student_id: att.student_id,
        student_name: studentName,
        status: att.status,
        score: att.score,
        max_score: att.max_score,
        percentage: att.percentage,
        passed: att.passed,
        submitted_at: att.submitted_at,
        time_taken_seconds: att.time_taken_seconds
      };
    }));

    // Compute aggregate analytics
    const totalSubmissions = enriched.length;
    const scores = enriched.map(a => a.score);
    const avgScore = totalSubmissions > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / totalSubmissions) * 10) / 10 : 0;
    const highestScore = totalSubmissions > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalSubmissions > 0 ? Math.min(...scores) : 0;
    const passedCount = enriched.filter(a => a.passed).length;
    const passPercentage = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;

    res.json({
      exam_id: cleanExamId,
      exam_title: examTitle,
      total_submissions: totalSubmissions,
      analytics: {
        average_score: avgScore,
        highest_score: highestScore,
        lowest_score: lowestScore,
        pass_percentage: passPercentage,
        passed_count: passedCount
      },
      submissions: enriched
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export for Exam Results
app.get('/exam/:exam_id/export-csv', async (req, res) => {
  try {
    const { exam_id } = req.params;
    const cleanExamId = String(exam_id);
    let attemptsList = [];
    let examTitle = 'Exam_Results';

    if (isMongoConnected) {
      const exam = await Exam.findById(cleanExamId).catch(() => null);
      if (exam) examTitle = exam.title.replace(/[^a-zA-Z0-9]/g, '_');
      attemptsList = await ExamAttempt.find({ exam_id: cleanExamId }).sort({ submitted_at: -1 });
    } else {
      attemptsList = (memoryStore.attempts || []).filter(a => String(a.exam_id) === cleanExamId);
    }

    let csv = 'Student ID,Student Name,Score,Max Marks,Percentage,Result,Status,Submitted At,Time Taken (s)\n';
    for (const att of attemptsList) {
      let studentName = 'Student #' + att.student_id;
      if (isMongoConnected) {
        if (mongoose.Types.ObjectId.isValid(att.student_id)) {
          const s = await Student.findById(att.student_id);
          if (s) studentName = s.name;
        } else {
          const s = await Student.findOne({ name: att.student_id });
          if (s) studentName = s.name;
        }
      }
      csv += `"${att.student_id}","${studentName}",${att.score},${att.max_score},${att.percentage}%,"${att.passed ? 'PASSED' : 'FAILED'}","${att.status}","${att.submitted_at ? new Date(att.submitted_at).toISOString() : ''}",${att.time_taken_seconds || 0}\n`;
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(`${examTitle}_Results.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------
// 4. ASSIGNMENTS & UPLOADS
// ------------------------------------------

// Upload / Assign Work
app.post('/assign_work', (req, res, next) => {
  upload.single('assignment_file')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size is 15MB.' });
      }
      return res.status(400).json({ error: error.message || 'File upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const subject = (req.body.subject || '').trim();
    const title = (req.body.title || '').trim();
    const teacher_name = (req.body.teacher_name || 'Prof. Sharma').trim();

    if (!subject) return res.status(400).json({ error: 'Subject is required' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const filename = req.file.filename;
    const original_name = req.file.originalname || filename;

    if (isMongoConnected) {
      const assignment = new Assignment({
        title: title || original_name,
        subject,
        filename,
        original_name,
        teacher_name
      });
      await assignment.save();
      return res.status(201).json({
        success: true,
        message: 'Assignment uploaded successfully',
        assignment: assignment.toClient()
      });
    } else {
      const newA = {
        id: String(Date.now()),
        title: title || original_name,
        subject,
        filename: original_name,
        teacher_name,
        date: new Date().toISOString().split('T')[0],
        url: `/uploads/${filename}`
      };
      memoryStore.assignments.unshift(newA);
      return res.status(201).json({
        success: true,
        message: 'Assignment uploaded successfully',
        assignment: newA
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Assignments
app.get('/assignments', async (req, res) => {
  try {
    if (isMongoConnected) {
      const works = await Assignment.find().sort({ timestamp: -1 });
      if (works.length > 0) {
        return res.json(works.map(w => w.toClient()));
      }
    }
    res.json(memoryStore.assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------
// 5. XP & LEVEL UPDATES
// ------------------------------------------

// Level Update
app.post('/levelupdate', async (req, res) => {
  try {
    const { student_id, level, xp, accuracy } = req.body;
    if (isMongoConnected && student_id && mongoose.Types.ObjectId.isValid(student_id)) {
      await Student.findByIdAndUpdate(student_id, {
        $inc: { xp: Number(xp) || 25 }
      });
    }
    res.json({ success: true, message: 'Level progress recorded', level, xp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Score Update
app.post('/scoreupdate', async (req, res) => {
  try {
    const { name, score } = req.body;
    if (isMongoConnected && name) {
      const student = await Student.findOneAndUpdate(
        { name },
        { $inc: { score: Number(score) || 0 } },
        { new: true }
      );
      if (student) return res.json({ message: 'Score updated', student: student.toClient() });
    }
    res.json({ message: 'Score updated', name, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile Update
app.post('/profilesupdate', async (req, res) => {
  try {
    const { name, age, schoolname, classofstudy, password } = req.body;
    if (isMongoConnected && name) {
      const updateData = {};
      if (age) updateData.age = Number(age);
      if (schoolname) updateData.schoolname = schoolname;
      if (classofstudy) updateData.classofstudy = classofstudy;
      if (password) updateData.password = password;

      const student = await Student.findOneAndUpdate({ name }, updateData, { new: true });
      if (student) return res.json({ message: 'Profile updated', student: student.toClient() });
    }
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    if (isMongoConnected) {
      const students = await Student.find().sort({ score: -1, xp: -1 }).limit(20);
      return res.json(students.map(s => s.toClient()));
    }
    const sorted = [...memoryStore.students].sort((a, b) => (b.score || 0) - (a.score || 0));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------
// 6. LEARNING ANALYTICS & MISCONCEPTIONS
// ------------------------------------------

// Record / Update Learning Metrics
app.post('/api/analytics/fraction', async (req, res) => {
  try {
    const { student_name, concept, pre_test_score, post_test_score, gain_points, misconceptions } = req.body;

    if (isMongoConnected) {
      let metric = await LearningMetric.findOne({ student_name, concept: concept || 'Grade 6 Fractions' });
      if (!metric) {
        metric = new LearningMetric({
          student_name: student_name || 'Explorer',
          concept: concept || 'Grade 6 Fractions',
          pre_test_score: pre_test_score || 0,
          post_test_score: post_test_score || 0,
          gain_points: gain_points || 0
        });
      } else {
        if (pre_test_score !== undefined) metric.pre_test_score = pre_test_score;
        if (post_test_score !== undefined) metric.post_test_score = post_test_score;
        if (gain_points !== undefined) metric.gain_points = gain_points;
      }
      metric.updated_at = new Date();
      await metric.save();
      return res.json({ success: true, metric });
    }

    res.json({ success: true, message: 'Learning metric recorded locally' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Learning Metrics Summary
app.get('/api/analytics/fraction', async (req, res) => {
  try {
    if (isMongoConnected) {
      const metrics = await LearningMetric.find().sort({ updated_at: -1 });
      return res.json(metrics);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// START SERVER
// ==========================================
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 AlgoPlay Node & Express + MongoDB Backend Running!`);
  console.log(`  📡 API Server: http://localhost:${PORT}`);
  console.log(`  📂 Static Files Served on Port ${PORT}`);
  console.log(`  🍃 MongoDB: ${isMongoConnected ? 'Connected' : 'Fallback mode'}`);
  console.log(`======================================================\n`);
});

module.exports = { app, server };
