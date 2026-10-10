# 🎮 AlgoPlay (VidyaVerse) — Gamified STEM & Coding Learning Platform

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express%20v4-lightgrey.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-blue.svg)](#)
[![Typography](https://img.shields.io/badge/UI-Poppins%20%7C%20Glassmorphism-9cf.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](#)

**AlgoPlay (VidyaVerse)** is an interactive, gamified educational platform designed for school students and educators. The platform transforms school curricula (Mathematics, Science, Technology, and Language) into bite-sized missions, visual problem-solving games, real-time misconception diagnosis, and streamlined classroom tools for teachers.

---

## 📑 Table of Contents
- [✨ Key Features Overview](#-key-features-overview)
- [🎓 Student Experience](#-student-experience)
- [👩‍🏫 Educator Hub & Classroom Tools](#-educator-hub--classroom-tools)
- [🧠 Pedagogical Loop & Misconception Engine](#-pedagogical-loop--misconception-engine)
- [🎮 Arcade Mini-Games Universe](#-arcade-mini-games-universe)
- [🗄️ Backend Architecture & Database Schemas](#️-backend-architecture--database-schemas)
- [📡 REST API Reference](#-rest-api-reference)
- [📁 Project Directory Structure](#-project-directory-structure)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [🔒 Child Safety & Privacy Disclaimers](#-child-safety--privacy-disclaimers)

---

## ✨ Key Features Overview

### 1. Unified Cyber-Glassmorphic UI
- **Unified Poppins Typography:** Consistent Google Font `Poppins` across all pages.
- **Deep Space & Radiant Gradients:** Translucent glassmorphism (`backdrop-filter: blur(16px)`), cyan and violet neon glows, and responsive cards.
- **Identical Login & Signup Portals:** [`Loginpage.html`](Loginpage.html) and [`signuppage.html`](signuppage.html) feature a 950px dual-panel card with matching aesthetic tags and live alert cards.
- **Shared accessibility foundation:** Every page loads [`multilingual/app-theme.css`](multilingual/app-theme.css) for consistent design tokens, visible keyboard focus, mobile tap targets, and reduced-motion support while preserving each page's existing layout.

### 2. High-Performance Full-Stack Backend
- **Node.js & Express API:** Production-grade REST backend running on port `5000`.
- **MongoDB Persistence:** Mongoose models for students, educators, exams, questions, homework assignments, and learning metrics.
- **Multipart Uploads:** Multer file storage handling teacher worksheets, PDFs, Word docs, images, and MP4 videos with immediate student distribution.
- **Zero-Downtime Offline Fallback:** Resilient in-memory fallback store ensures that pages remain functional even when MongoDB is offline.

---

## 🎓 Student Experience

### 🏠 Starting Landing Page (`index.html`)
- Animated twinkling starfield canvas background.
- Live animated counters: **2,500+ Active Students**, **15,200+ Missions Solved**, **98% Concept Mastery**, and **50+ Labs**.
- Direct launchers into Subject Tracks (Mathematics, Science, Technology, Biology, Language, and STEM Video Arena).
- Quick dual-path action buttons for Students and Educators.

### 🔐 Student Authentication (`Loginpage.html` & `signuppage.html`)
- Clean input fields with glowing cyan outline accents (`#7dd3fc`).
- **Live Teacher Resource Alert:** A dedicated `📬 Teacher Resource Assigned` card automatically alerts students when a teacher uploads new homework, with an instant **`👁️ Open File Now`** button.
- **Quick Demo Login:** One-click instant login button for frictionless testing and demonstration.

### 🎒 Student Dashboard (`maindashboard.html`)
- **Class Assignments Catalog:** Displays homework assigned by teachers, complete with subject tags, teacher name, date, and **`👁️ Open File`** and **`⬇️ Download`** buttons.
- **Quests & Track Navigation:** Direct access to daily missions, level hubs, arcade games, and AI tutor.

### 🤖 AI Study Tutor (`chatbox.html`)
- Socratic learning assistant providing guided hints without giving away final answers.
- **Bilingual Assistance:** Supports English and regional languages (Telugu) for inclusive learning.

### 🤖 AlgoBuddy AI Tutor (student dashboard)
- The active student dashboard (`maindashboard.html`) includes a floating AlgoBuddy chat assistant.
- Gemini requests go through the server-side `POST /api/chat` endpoint; the API key is never sent to the browser.
- Student sessions use short-lived signed tokens, bounded history, message validation, and per-student rate limiting.
- Conversations are kept in the browser session only and are isolated by student ID; they are not stored in MongoDB.

---

## 👩‍🏫 Educator Hub & Classroom Tools

### 📊 Modernized Teacher Dashboard (`teacherdash.html`)
Redesigned with a 3-tab layout:
1. **Class Overview & Roster:** View enrolled students, individual grades, XP, and status.
2. **Smart Bazaar & Misconceptions:** Visual breakdown of mathematical error patterns and targeted intervention priorities.
3. **Curriculum & Question Inspector:** Full visibility into quiz questions, correct answers, and distractors.
- **Executive KPIs:** 4 high-level stat cards tracking Total Students, Active Learners, Average Learning Gain, and Priority Remediation.
- **Export Capabilities:** One-click CSV export (`algoplay_fraction_analytics.csv`) for school district reporting.

### ✏️ Dynamic Batch Exam Builder (`giveexam.html`)
- **Question Count Selector:** Choose **3**, **5**, **10**, or enter a **custom count** (e.g., 7 or 15 questions).
- **Batch Card Generator:** Dynamically creates editable cards with question text, options A, B, C, D, and a 1-click radio selector for the correct answer.
- **Single-Click Publish:** Submits the exam and its entire question bank to MongoDB simultaneously.

### 📂 Assignment & Resource Studio (`resources.html`)
- **Drag-and-Drop Dropzone:** Easily upload homework files (PDF, DOC, DOCX, JPG, PNG, or MP4 up to 15MB). MP4 resources include an inline player on student dashboards.
- **Automated Student Linkage:** Files are stored in `/uploads` and recorded in MongoDB.
- **Instant Student Redirect:** Teacher is automatically redirected to the student view with options to immediately verify and open the file.

---

## 🧠 Pedagogical Loop & Misconception Engine

AlgoPlay implements a complete, closed-loop adaptive learning cycle:
```
DIAGNOSE ➔ IDENTIFY MISCONCEPTION ➔ TARGETED VISUAL HINT ➔ PRACTICE ➔ VERIFY INDEPENDENT MASTERY ➔ MEASURE LEARNING GAIN
```

### The 3 Progressive Missions (`fraction_mission.html`)
1. **Diagnostic Pre-Test (Stage 0):** Baseline assessment establishing initial competency.
2. **Mission 1 — Understand Fractions:** Interactive CSS/SVG visual fraction strips (**Market Bar Scale**) comparing $1/2$, $1/4$, $2/4$, $1/3$, and $1/6$.
3. **Mission 2 — Unlike Denominators Addition:** 4-step guided problem solving (Find LCM $\rightarrow$ Scale numerators $\rightarrow$ Add $\rightarrow$ Simplify) with misconception alerts.
4. **Mission 3 — Smart Bazaar Word Problems:** Authentic Indian marketplace scenarios:
   - *Farmer Suresh's Sabzi Basket:* Combining $1/2$ kg green chillies + $3/8$ kg ginger.
   - *Halwai Ramu's Mithai Kitchen:* Mixing $2/3$ cup rose water + $1/4$ cup saffron syrup.
   - *Grain Merchant's Wholesale Mandi:* Calculating total sacks of sona masoori rice ($3/10 + 2/5$).
5. **Post-Test & Learning Gain Measurement (Stage 4):**
   $$\text{Learning Gain} = \text{Post-Test Accuracy} - \text{Pre-Test Accuracy}$$

### Deterministic Misconception Rules (`fractionEngine.js`)

| Detected Misconception | Trigger Rule | Diagnostic Feedback & Visual Hint |
| :--- | :--- | :--- |
| **Direct Numerator/Denominator Addition** | Student selects $(n_1+n_2)/(d_1+d_2)$ (e.g. $1/2 + 1/4 = 2/6$) | Explains that denominators represent *slice size*. Shows visual watermelon slices. |
| **LCM Scaling Omission** | Student adjusts denominators but forgets numerators | Visualizes fraction scaling: $\frac{1 \times 2}{2 \times 2} = \frac{2}{4}$. |
| **Cross-Multiplication Confusion** | Student multiplies denominators without adjusting numerators | Guides student through identifying the Least Common Denominator first. |
| **Operation Sign Error** | Student subtracts numerators instead of adding | Clarifies word problem intent (combining quantities vs finding differences). |

---

## 🎮 Arcade Mini-Games Universe

AlgoPlay features 8 interactive STEM mini-games accessible via [`gameboard.html`](gameboard.html):

1. **Smart Bazaar Market Quest (`fraction_mission.html`):** Visual fraction bars and marketplace trading simulator.
2. **Mario Math Runner (`game2.html`):** Rapid-fire arithmetic platformer with obstacles.
3. **Continuous Chase Quiz (`newgame.html`):** Fast-paced runner quiz with survival mechanics.
4. **Physics Engine Lab (`phyg1.html`):** Simulator for gravitation, velocity, momentum, and sound waves.
5. **Chemistry Reaction Lab (`cheg1.html`):** Interactive atom builder and chemical reaction equations.
6. **Anatomy Pin Explorer (`sciencegame.html`):** Visual organ pin-drop exploration.
7. **Interactive Video Arena (`videogame1.html`):** Video challenges that pause dynamically for checkpoint quiz questions.
8. **Cosmic Science Arena (`sciencelevel.html`):** Space-themed multi-disciplinary science challenge.

---

## 🗄️ Backend Architecture & Database Schemas

The backend runs on **Express.js** and connects to **MongoDB** via Mongoose.

### Mongoose Schemas (`/models`)

- **Student (`models/Student.js`)**
  ```javascript
  {
    student_id: String,
    name: String,
    school_name: String,
    age: Number,
    grade: String,
    password: String, // Plain or hashed
    score: Number,
    xp: Number,
    rank: Number
  }
  ```

- **Teacher (`models/Teacher.js`)**
  ```javascript
  {
    name: String,
    email: String,
    school_name: String,
    subject: String,
    password: String
  }
  ```

- **Exam (`models/Exam.js`) & Question (`models/Question.js`)**
  ```javascript
  // Exam: { title, subject, duration, is_active }
  // Question: { exam_id, question_text, option_a, option_b, option_c, option_d, correct_option }
  ```

- **Assignment (`models/Assignment.js`)**
  ```javascript
  {
    title: String,
    subject: String,
    filename: String,
    original_name: String,
    teacher_name: String,
    timestamp: Date
  }
  ```

- **ExamAttempt (`models/ExamAttempt.js`) & LearningMetric (`models/LearningMetric.js`)**
  Tracks exam scores, timestamps, pre/post-test diagnostic scores, and detected error patterns.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status & MongoDB connection state |
| `POST` | `/Signup` | Register a new student |
| `POST` | `/Login` | Authenticate student |
| `POST` | `/TeacherSignup` | Register a new educator |
| `POST` | `/TeacherLogin` | Authenticate educator |
| `GET` | `/teacher/dashboard` | Fetch class roster, learner status & KPI stats |
| `POST` | `/exam/create` | Create a new test |
| `GET` | `/exam/:exam_id/questions` | Fetch questions for an exam |
| `POST` | `/exam/:exam_id/submit` | Grade exam answers & reward XP |
| `POST` | `/assign_work` | Upload file (`multipart/form-data`) & assign homework |
| `GET` | `/assignments` | List all class assignments |
| `POST` | `/levelupdate` | Update student current game level |
| `POST` | `/scoreupdate` | Increment student score & XP |
| `GET` | `/leaderboard` | Retrieve student rankings |
| `GET` | `/api/analytics/fraction` | Smart Bazaar class diagnostic metrics |

---

## 📁 Project Directory Structure

```text
vision-999/
│
├── server.js                    # Express REST API & MongoDB connection
├── models/                      # Mongoose Schema Definitions
│   ├── Student.js
│   ├── Teacher.js
│   ├── Exam.js
│   ├── Question.js
│   ├── ExamAttempt.js
│   ├── Assignment.js
│   └── LearningMetric.js
├── .env                         # Server environment configuration
├── .env.example                 # Example configuration template
├── package.json                 # Project dependencies & scripts
├── start.bat                    # One-click Windows startup script
├── uploads/                     # Uploaded documents and MP4 videos
├── storageService.js            # Persistence & analytics synchronization
├── fractionEngine.js            # Misconception diagnosis engine
│
├── 🌐 Public & Student Portals
│   ├── index.html               # Main Landing Page (Features, Tracks, Stats)
│   ├── Loginpage.html           # Student Login with Real-Time Assignment Alert
│   ├── signuppage.html          # Student Registration
│   ├── maindashboard.html       # Primary Student Dashboard & Assignment Viewer
│   ├── fraction_mission.html    # Smart Bazaar Fractions Quest (Missions 1-3)
│   ├── gameboard.html           # 8 Arcade Mini-Games Hub
│   ├── chatbox.html             # AI Socratic Study Tutor (English & Telugu)
│   ├── takeexam.html            # Active Exam Testing Interface
│   ├── leaderboard.html         # Class Leaderboard
│   └── userprofile.html         # Student Profile & Settings
│
├── 🎮 STEM Mini-Games
│   ├── game2.html               # Mario Math Runner
│   ├── newgame.html             # Continuous Runner Quiz
│   ├── phyg1.html               # Interactive Physics Lab
│   ├── cheg1.html               # Chemistry Reactions & Atom Lab
│   ├── sciencegame.html         # Human Anatomy Pin Explorer
│   ├── videogame1.html          # STEM Video Arena
│   └── sciencelevel.html        # Cosmic Starfield Science Arena
│
└── 👩‍🏫 Educator Tools
    ├── teacherdash.html         # 3-Tab Teacher Dashboard (Roster, Misconceptions, Inspector)
    ├── giveexam.html            # Batch Exam Builder with 3/5/10 Question Selector
    ├── resources.html           # Assignment Studio & Document Dropzone
    ├── teacherlogin.html        # Teacher Login Portal
    └── teachersignup.html       # Teacher Registration Portal
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on `mongodb://127.0.0.1:27017/algoplay` (or a remote MongoDB Atlas URI)

### 1. Clone Repository
```bash
git clone https://github.com/satyadev3s/vidya_verse.git
cd vidya_verse
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/algoplay
UPLOAD_DIR=uploads
NODE_ENV=development
AUTH_SECRET=use-a-long-random-secret
GEMINI_API_KEY=your-new-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

Never commit `.env` or expose `GEMINI_API_KEY` in frontend files. The key previously pasted into chat should be revoked and replaced because it must be treated as compromised.

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
```bash
npm start
```

Alternatively, on Windows, double-click **`start.bat`**.

- **Open Website:** [http://localhost:5000/index.html](http://localhost:5000/index.html)
- **Teacher Assignment Studio:** [http://localhost:5000/resources.html](http://localhost:5000/resources.html)
- **Student Login:** [http://localhost:5000/Loginpage.html](http://localhost:5000/Loginpage.html)
- **Teacher Dashboard:** [http://localhost:5000/teacherdash.html](http://localhost:5000/teacherdash.html)

### Render and MongoDB Atlas

The repository includes [`render.yaml`](render.yaml), which uses `npm ci`, starts `server.js` through `npm start`, and checks `/api/health`. In Render, create a Node web service from this repository and set `MONGODB_URI` to a MongoDB Atlas connection string and `GEMINI_API_KEY` to a newly generated key. Keep the generated `AUTH_SECRET` private. In MongoDB Atlas, create a database user with a strong password and add only the Render outbound access permitted by your deployment policy (a temporary `0.0.0.0/0` rule is not recommended for production). Verify the deployed `/api/health` response before testing student login and AlgoBuddy.

---

## 🔒 Child Safety & Privacy Disclaimers

- **Educational Purpose:** The platform is engineered to enhance STEM comprehension through playful learning mechanics and diagnostic feedback.
- **Local & Demo Authentication:** The `🚀 Quick Demo Login` feature uses local sessions to simplify review and demonstration. For enterprise deployments, integrate bcrypt password hashing and HTTP-only session cookies.
- **Data Privacy:** Local storage stores temporary client state. Production deployments should enforce school-specific multi-tenancy and data isolation.
