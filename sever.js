const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

let data = JSON.parse(fs.readFileSync("data.json"));

// GET DEFAULT EXAM INSTRUCTIONS
app.get("/exams/:type", (req, res) => {
  res.json(data.exams[req.params.type]);
});

// GET DEFAULT QUESTIONS
app.get("/questions/:type", (req, res) => {
  res.json(data.questions[req.params.type]);
});

// CHECK TEACHER ASSIGNED EXAM
app.get("/assigned/:studentId", (req, res) => {
  const assigned = data.assignedExams[req.params.studentId];
  if (!assigned) return res.json({ assigned: false });
  res.json({ assigned: true, examCode: assigned.examCode });
});

// LOAD CUSTOM EXAM
app.get("/customexam/:code", (req, res) => {
  res.json(data.customExams[req.params.code]);
});

// SUBMIT NORMAL EXAM
app.post("/submit", (req, res) => {
  evaluateExam(req, res, data.questions[req.body.examType]);
});

// SUBMIT CUSTOM EXAM
app.post("/customsubmit", (req, res) => {
  const exam = data.customExams[req.body.examCode].questions;
  evaluateExam(req, res, exam);
});

// EXAM EVALUATION FUNCTION
function evaluateExam(req, res, examQuestions) {
  let answers = req.body.answers;
  let correct = 0;
  let review = [];

  examQuestions.forEach(q => {
    const ans = answers[q.id];
    if (ans === q.correct) correct++;

    review.push({
      question: q.question,
      your: ans,
      correct: q.correct,
      explanation: q.explanation
    });
  });

  res.json({
    marks: correct,
    total: examQuestions.length,
    suggestions: [
      "Practice weak topics.",
      "Improve accuracy.",
      "Avoid guessing."
    ],
    answers: review
  });
}

app.listen(3000, () => console.log("Backend running at http://localhost:3000"));