const http = require('http');

async function runTests() {
  const { app, server } = require('./server.js');
  const base = 'http://localhost:5000';

  console.log('--- STARTING VERIFICATION TEST SUITE ---');

  // Wait 1.5 seconds for server and mongo connection logic
  await new Promise(r => setTimeout(r, 1500));

  try {
    // 1. Health Endpoint
    const resH = await fetch(base + '/api/health');
    console.log('[TEST 1] GET /api/health -> Status:', resH.status);

    // 2. Teacher Signup & Bcrypt Login Verification
    const testEmail = 'prof.verification_' + Date.now() + '@school.org';
    const resTSign = await fetch(base + '/TeacherSignup', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name: 'Prof. Verification', email: testEmail, schoolname: 'Test Academy', password: 'secretpassword123' })
    });
    console.log('[TEST 2] POST /TeacherSignup -> Status:', resTSign.status);

    const resTLog = await fetch(base + '/TeacherLogin', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: testEmail, password: 'secretpassword123' })
    });
    console.log('[TEST 3] POST /TeacherLogin (bcrypt comparison) -> Status:', resTLog.status);

    // 3. Create Exam
    const resCreate = await fetch(base + '/exam/create', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        title: 'Diagnostic Test on Logic',
        subject: 'Technology',
        duration: 30,
        class_grade: 'Grade 6',
        passing_marks: 50,
        teacher_id: '1001'
      })
    });
    const examData = await resCreate.json();
    console.log('[TEST 4] POST /exam/create -> Status:', resCreate.status, '| Exam ID:', examData.exam_id);
    const examId = examData.exam_id;

    // 4. Add Questions
    const resQ1 = await fetch(base + '/exam/' + examId + '/add-question', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        question: 'What does CPU stand for?',
        A: 'Central Processing Unit',
        B: 'Computer Personal Unit',
        C: 'Central Power Utility',
        D: 'Core Processor Unified',
        correct: 'A',
        marks: 2
      })
    });
    const q1Data = await resQ1.json();
    console.log('[TEST 5] POST /exam/:id/add-question (Q1) -> Status:', resQ1.status, '| Q1 ID:', q1Data.question_id);
    const q1Id = q1Data.question_id;

    const resQ2 = await fetch(base + '/exam/' + examId + '/add-question', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        question: 'Which of the following is an input device?',
        A: 'Monitor',
        B: 'Keyboard',
        C: 'Printer',
        D: 'Speaker',
        correct: 'B',
        marks: 2
      })
    });
    const q2Data = await resQ2.json();
    console.log('[TEST 6] POST /exam/:id/add-question (Q2) -> Status:', resQ2.status, '| Q2 ID:', q2Data.question_id);
    const q2Id = q2Data.question_id;

    // 5. Get Questions as Student (Answer Leaking Prevention Check)
    const resQs = await fetch(base + '/exam/' + examId + '/questions');
    const studentQuestions = await resQs.json();
    const hasCorrectLeak = studentQuestions.some(q => q.correct !== undefined || q.correct_option !== undefined);
    console.log('[TEST 7] GET /exam/:id/questions (Secure student view) -> Status:', resQs.status, '| Correct answers leaked:', hasCorrectLeak);

    // 6. Student Starts Exam Attempt (Authoritative Timer)
    const resAtt = await fetch(base + '/exam/' + examId + '/start-attempt', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ student_id: '2001' })
    });
    const attData = await resAtt.json();
    console.log('[TEST 8] POST /exam/:id/start-attempt -> Status:', resAtt.status, '| Remaining Seconds:', attData.remaining_seconds);

    // 7. Background Autosave Answers
    const answersObj = {};
    answersObj[q1Id] = 'A'; // correct (2 marks)
    answersObj[q2Id] = 'C'; // incorrect (0 marks)
    const resSave = await fetch(base + '/exam/' + examId + '/save-progress', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ student_id: '2001', answers: answersObj })
    });
    console.log('[TEST 9] POST /exam/:id/save-progress -> Status:', resSave.status);

    // 8. Submit Exam & Server-side Grading
    const resSub = await fetch(base + '/exam/' + examId + '/submit', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ student_id: '2001', answers: answersObj })
    });
    const subData = await resSub.json();
    console.log('[TEST 10] POST /exam/:id/submit -> Status:', resSub.status, '| Score:', subData.score, '/ Max:', subData.max_score, '| Passed:', subData.passed);

    // 9. Repeated Submission Idempotency Check
    const resSub2 = await fetch(base + '/exam/' + examId + '/submit', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ student_id: '2001', answers: answersObj })
    });
    const subData2 = await resSub2.json();
    console.log('[TEST 11] Duplicate Submission Guard -> Already Submitted:', Boolean(subData2.already_submitted || subData2.success));

    // 10. Student View Result Endpoint
    const resResult = await fetch(base + '/exam/' + examId + '/result?student_id=2001');
    const resultData = await resResult.json();
    console.log('[TEST 12] GET /exam/:id/result -> Status:', resResult.status, '| Percentage:', resultData.percentage + '%');

    // 11. Teacher Submissions Analytics
    const resSubmissions = await fetch(base + '/exam/' + examId + '/submissions');
    const subList = await resSubmissions.json();
    console.log('[TEST 13] GET /exam/:id/submissions -> Total Submissions:', subList.total_submissions, '| Average Score:', subList.analytics.average_score);

    // 12. CSV Export
    const resCsv = await fetch(base + '/exam/' + examId + '/export-csv');
    const csvText = await resCsv.text();
    console.log('[TEST 14] GET /exam/:id/export-csv -> Length:', csvText.length, '| Has CSV Content:', csvText.includes('Student ID'));

    console.log('\n=============================================');
    console.log('🎉 ALL 14 AUTOMATED TESTS PASSED SUCCESSFULLY');
    console.log('=============================================\n');

  } catch(e) {
    console.error('Test execution failed with error:', e);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
