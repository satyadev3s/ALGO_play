# 🚀 AlgoPlay — Gamified STEM & AI Educational Platform

![AlgoPlay Banner](https://img.shields.io/badge/AlgoPlay-v1.0.0-00d8ff?style=for-the-badge&logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-v4.21.2-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-v6+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash_Lite-8E75C2?style=for-the-badge&logo=google&logoColor=white)
![Multilingual](https://img.shields.io/badge/Languages-6_Indian_Languages-ff007f?style=for-the-badge)

**AlgoPlay** is an interactive, gamified learning platform tailored for grades 6–10 and competitive STEM foundation. It transforms traditional school curriculums into epic quests featuring **XP systems, interactive games, real-time visual simulations, a Google Gemini-powered AI Study Tutor, and universal multilingual support across 6 Indian languages**.

---

## 📌 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠️ Technologies Used](#️-technologies-used)
- [📦 Packages & Dependencies](#-packages--dependencies)
- [📂 Project Directory Structure](#-project-directory-structure)
- [⚙️ Prerequisites & Installation](#️-prerequisites--installation)
- [🚀 How to Run the Website](#-how-to-run-the-website)
- [🍃 MongoDB Compass Connection](#-mongodb-compass-connection)
- [🌐 Multilingual System Architecture](#-multilingual-system-architecture)
- [🤖 AlgoBuddy AI Tutor](#-algobuddy-ai-tutor)
- [📡 API Endpoints Reference](#-api-endpoints-reference)

---

## ✨ Key Features

1. **🤖 Live Gemini AI Study Tutor ("AlgoBuddy")**:
   - Direct integration with Google's latest **Gemini 3.5 Flash Lite** model via the official `@google/genai` SDK.
   - Answers questions across **Computer Science, AIML, Mathematics, Science, and Languages**.
   - Built-in educational fallback engine ensuring students always receive answers even during offline or connectivity issues.
   - Dual-input support: dedicated sidebar composer + persistent bottom chat bar with real-time markdown formatting and KaTeX math notation.

2. **🏪 Smart Bazaar — Fractions Quest**:
   - An interactive, gamified simulation of an Indian marketplace where students learn unlike fractions through visual slice trading.
   - Real-time diagnostic quiz, step-by-step visual hints, and XP progression.

3. **🎮 9 Integrated Gamified STEM Missions**:
   - **Mario Math Runner**: Speed arcade math challenges.
   - **Continuous Chase Quiz**: Speed challenge testing logic and reaction time.
   - **SUTRA Math Cannon**: Physics-based bubble shooter math game.
   - **Physics Engine Lab**: Interactive gravity, motion, and collision simulator.
   - **Chemistry Lab Reactions**: Virtual atom, molecule, and chemical bonding workbench.
   - **Anatomy Pin Explorer**: Step-by-step human biology and organ system diagnostics.
   - **Subject Arcade Hub & Video Arena**: Interactive video quests and arcade games.
   - **WEKA Data Mining Lab**: Virtual machine learning lab (Decision Trees, Naive Bayes, Neural Networks, Clustering).

4. **🌐 Deep Multilingual Engine (6 Languages)**:
   - Real-time page translation into **తెలుగు (Telugu)**, **हिन्दी (Hindi)**, **தமிழ் (Tamil)**, **ଓଡ଼ిଆ (Odia)**, **മലയാളം (Malayalam)**, and **English**.
   - Persistent across all 80+ platform views via `localStorage` and `sessionStorage`.
   - Dynamic text-node traversal engine with emoji isolation and regex pattern matching for dynamic numbers (Levels, XP counters, Dates, Author tags).

5. **🔊 Procedural 8-Bit Web Audio Synthesizer**:
   - Built-in sound engine using the browser's native **Web Audio API** (`audio-manager.js`).
   - Procedurally synthesizes retro arcade jumps, coin pickups, clicks, and celebratory fanfares with zero external audio assets.

6. **🧑‍🎓 Student & 👩‍🏫 Teacher Portals**:
   - **Students**: Profile customization, daily quests, exam center, assignment viewer, and global leaderboards.
   - **Teachers**: Assignment distribution (PDF, DOCX, images, MP4 videos), exam creation, student progress metrics, and misconception diagnostics.

---

## 🛠️ Technologies Used

### Frontend
| Technology | Description |
| :--- | :--- |
| **HTML5 & CSS3** | Semantic markup with custom Glassmorphism and Neon Cyberpunk themes (`var(--bg)`, `--accent`, backdrop filters). |
| **Vanilla JavaScript (ES6+)** | Lightweight, high-performance client scripting with zero frontend framework overhead. |
| **HTML5 Canvas API** | Particle animations, interactive quantum backgrounds, and custom 2D game rendering loops. |
| **Web Audio API** | Real-time procedural audio synthesis generating retro 8-bit sound effects. |
| **MutationObserver API** | Watches the DOM in real-time to translate dynamically fetched content (e.g. assignments, scores). |
| **TreeWalker API** | Deep `NodeFilter.SHOW_TEXT` text-node traversal for universal language localization. |

### Backend
| Technology | Description |
| :--- | :--- |
| **Node.js (v18+)** | Asynchronous, event-driven JavaScript server runtime. |
| **Express.js (v4.21.2)** | Minimalist web application framework providing RESTful API routing, middleware, and static asset delivery. |
| **MongoDB & Mongoose (v8.9.5)** | NoSQL document database with strict schema modeling, automatic indexing, and dual-mode in-memory resilience. |
| **Crypto (Node.js Core)** | Cryptographic HMAC-SHA256 signature generation for stateless student & teacher bearer tokens. |

### Artificial Intelligence & Machine Learning
| Technology | Description |
| :--- | :--- |
| **Google Gen AI SDK** | `@google/genai` (v2.28.0) official SDK connecting to Google Gemini. |
| **Gemini 3.5 Flash Lite** | High-throughput, low-latency reasoning model powering the AlgoBuddy AI Study Tutor. |
| **WEKA Data Mining Lab** | Educational data science simulation covering Naive Bayes, Decision Trees, J48, and K-Means. |

---

## 📦 Packages & Dependencies

Below is the list of all production npm packages defined in `package.json` and their role in the platform:

| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| **`@google/genai`** | `^2.28.0` | Official Google Gen AI SDK used in `server.js` to communicate with the Gemini API (`gemini-3.5-flash-lite`). Powers the conversational AI tutor for real-time educational Q&A. |
| **`express`** | `^4.21.2` | Core backend framework handling HTTP routing, REST API endpoints (`/api/chat`, `/api/auth/*`, `/assignments`, `/exams`), JSON request parsing, and serving static HTML/CSS/JS frontend files. |
| **`mongoose`** | `^8.9.5` | Object Data Modeling (ODM) library for MongoDB. Defines schemas and validates data for `Students`, `Teachers`, `Exams`, `Questions`, `ExamAttempts`, `Assignments`, and `LearningMetrics`. |
| **`dotenv`** | `^16.4.7` | Loads sensitive configuration (such as `GEMINI_API_KEY`, `MONGODB_URI`, `PORT`, and `AUTH_SECRET`) from the root `.env` file into `process.env`. |
| **`cors`** | `^2.8.5` | Cross-Origin Resource Sharing middleware enabling secure cross-origin requests from web clients and external tools. |
| **`multer`** | `^1.4.5-lts.1` | Multipart/form-data upload middleware for teachers to upload assignment worksheets and videos (`.pdf`, `.docx`, `.png`, `.jpg`, `.mp4`) to the `uploads/` directory. |
| **`bcryptjs`** | `^2.4.3` | Secure password hashing algorithm for teacher and student authentication with salting rounds. |

---

## 📂 Project Directory Structure

```text
Algo_play/
└── Code_0apex/
    ├── models/                      # Mongoose Schema Definitions
    │   ├── Assignment.js            # Teacher class assignments
    │   ├── Exam.js                  # Exam definitions & subject metadata
    │   ├── ExamAttempt.js           # Student test submission records
    │   ├── LearningMetric.js        # Analytics & misconception metrics
    │   ├── Question.js              # MCQ question banks
    │   ├── Student.js               # Student accounts & profiles
    │   └── Teacher.js               # Educator accounts & credentials
    ├── multilingual/                # Universal Localization System
    │   ├── site-i18n.js             # Universal deep text traversal & sync engine
    │   ├── site-i18n.css            # Floating language selector widget style
    │   ├── landing-i18n.js          # Landing page language coordinator
    │   ├── en.json                  # English dictionary
    │   ├── te.json                  # Telugu dictionary (తెలుగు)
    │   ├── hi.json                  # Hindi dictionary (हिन्दी)
    │   ├── ta.json                  # Tamil dictionary (தமிழ்)
    │   ├── or.json                  # Odia dictionary (ଓଡ଼ିଆ)
    │   └── ml.json                  # Malayalam dictionary (മലയാളം)
    ├── uploads/                     # Teacher-uploaded worksheets & videos
    ├── .env                         # Environment variables (API keys, ports)
    ├── audio-manager.js             # Procedural Web Audio API sound synthesizer
    ├── chatbox.html & chatbox.js    # AI Study Tutor Interface
    ├── fraction_mission.html        # Smart Bazaar Fractions Interactive Mission
    ├── gameboard.html               # Subject Arcade Hub
    ├── index.html                   # Platform Landing Page
    ├── Loginpage.html               # Student Login & Registration
    ├── maindashboard.html           # Main Student Gamified Dashboard
    ├── package.json                 # Project dependencies & scripts
    ├── server.js                    # Express + MongoDB + Gemini Backend Server
    ├── student_portal.html          # Student Exam & Diagnostic Portal
    ├── teacherdash.html             # Teacher Management Dashboard
    └── teacherlogin.html            # Educator Login & Registration
```

---

## ⚙️ Prerequisites & Installation

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher installed ([Download Node.js](https://nodejs.org/)).
- **MongoDB**: Installed locally ([Download MongoDB Community Server](https://www.mongodb.com/try/download/community)) or a MongoDB Atlas URI.
- **MongoDB Compass**: For database visualization ([Download Compass](https://www.mongodb.com/products/tools/compass)).

### 2. Clone / Open Project
```powershell
cd c:\Users\durga\Videos\Captures\gym\src\Algo_play\Code_0apex
```

### 3. Install Dependencies
```powershell
npm install
```

### 4. Configure Environment Variables (`.env`)
Create or edit the `.env` file in `Code_0apex/`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/algoplay
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
AUTH_SECRET=algoplay_secure_jwt_token_secret_key_2026
```

---

## 🚀 How to Run the Website

### Step 1: Ensure MongoDB is Running
Make sure your local MongoDB service is running:
```powershell
net start MongoDB
```

### Step 2: Start the AlgoPlay Backend
From the `Code_0apex` folder, run:
```powershell
node server.js
```
*(Or run `npm start`)*

You will see:
```text
======================================================
  🚀 AlgoPlay Node & Express + MongoDB Backend Running!
  📡 API Server: http://localhost:5000
  📂 Static Files Served on Port 5000
======================================================
✅ Connected to MongoDB successfully at: mongodb://127.0.0.1:27017/algoplay
```

### Step 3: Access the Platform in Your Browser
Open your browser and navigate to:
* 🌐 **Landing Page**: [http://localhost:5000](http://localhost:5000)
* 🎮 **Student Dashboard**: [http://localhost:5000/maindashboard.html](http://localhost:5000/maindashboard.html)
* 🤖 **AI Study Chatbot**: [http://localhost:5000/chatbox.html](http://localhost:5000/chatbox.html)
* 🏪 **Smart Bazaar Fractions Quest**: [http://localhost:5000/fraction_mission.html](http://localhost:5000/fraction_mission.html)
* 🧑‍🎓 **Student Login**: [http://localhost:5000/Loginpage.html](http://localhost:5000/Loginpage.html)
* 👩‍🏫 **Teacher Dashboard**: [http://localhost:5000/teacherdash.html](http://localhost:5000/teacherdash.html)

---

## 🍃 MongoDB Compass Connection

To inspect or manage users, assignments, and questions:
1. Open **MongoDB Compass**.
2. In the **New Connection** field, enter:
   ```text
   mongodb://localhost:27017
   ```
3. Click **Connect**.
4. In the database list on the left, select **`algoplay`**.
5. You will see all 7 platform collections:
   - `students`: Registered student profiles, grade levels, and passwords.
   - `teachers`: Verified educator accounts.
   - `assignments`: Teacher assignments with download URLs and file metadata.
   - `exams`: Active quizzes and test definitions.
   - `questions`: Question banks with answer options and correct choices.
   - `examattempts`: Student exam submissions, scores, and timestamps.
   - `learningmetrics`: Misconception logs and concept mastery scores.

---

## 🌐 Multilingual System Architecture

AlgoPlay includes a proprietary client-side internationalization system (`site-i18n.js`):
* **Persistent Across All Pages**: The selected language is stored in `localStorage` under `algoplay_lang`. Navigating across any page maintains the chosen language seamlessly.
* **Affix & Emoji Peeling**: Separates leading/trailing icons, emojis, bullets, and punctuation (e.g. `👁️ Open File`, `Start Quest →`, `Play Now 🎮`), translates the substantive text, and restores original styling.
* **Dynamic Pattern Matchers**: Uses regex rules for dynamic content like `Level 3 Explorer`, `120 / 500 XP to Level 2`, and `By Prof. Sharma`.
* **Zero Flicker**: Employs an active `MutationObserver` to re-translate any dynamically loaded cards or asynchronous assignment lists immediately.

---

## 🤖 AlgoBuddy AI Tutor

The AI chatbot connects directly to Google Gemini via `POST /api/chat`:
* **Model**: `gemini-3.5-flash-lite` (or `gemini-flash-latest`).
* **Subjects**: Computer Science, AIML, Cyber Security, Mathematics (Fractions, Algebra, Geometry), Science (Physics, Chemistry, Biology), and Languages.
* **LaTeX Cleaners**: Cleans raw LaTeX equations into standard readable unicode (e.g., `1/2 + 1/4 = 3/4`).
* **Resilient**: If the internet or API quota is unavailable, the backend gracefully switches to the built-in educational tutor engine with zero downtime.

---

## 📡 API Endpoints Reference

### 🔐 Authentication
* `POST /api/auth/register` — Register a new student.
* `POST /api/auth/login` — Student login (returns HMAC token).
* `POST /api/teacher/register` — Register a new teacher.
* `POST /api/teacher/login` — Teacher login.

### 🤖 AI Study Assistant
* `POST /api/chat` — Send a query to Gemini AlgoBuddy (supports chat history, rate-limited to 12 req/min).

### 📚 Assignments
* `GET /assignments` — Retrieve all active teacher assignments.
* `POST /upload-assignment` — Upload assignment file (PDF, DOCX, video) with subject & grade.
* `DELETE /assignments/:id` — Delete an assignment.

### 📝 Exams & Metrics
* `GET /api/exams` — List all active quizzes and tests.
* `GET /api/exams/:id/questions` — Fetch exam questions.
* `POST /api/exams/attempt` — Submit completed exam attempt and record score.
* `POST /api/metrics` — Log student concept mastery and misconception diagnostics.

---

## 📜 License & Copyright
© 2025–2026 **AlgoPlay Education**. Safe. Secure. Fun.
All rights reserved.
