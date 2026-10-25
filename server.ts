import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Helper: Normalize answer strings
function normalizeStr(str: any): string {
  if (typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

// 1. Verify access to quiz and return sanitized questions (NO answer keys or explanations)
app.post('/api/quizzes/access', async (req, res) => {
  try {
    const { publicCode, password } = req.body;
    if (!publicCode) {
      return res.status(400).json({ success: false, error: 'Thiếu mã đề thi.' });
    }

    const qQuery = query(
      collection(db, 'quizzes'),
      where('status', '==', 'published'),
      where('publicCode', '==', publicCode.trim().toUpperCase())
    );
    const qSnap = await getDocs(qQuery);
    if (qSnap.empty) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi với mã này hoặc đề thi chưa được phát hành.' });
    }

    const quizDoc = qSnap.docs[0];
    const quizData = quizDoc.data();

    if (quizData.status === 'draft') {
      return res.status(403).json({ success: false, error: 'Đề thi này đang ở trạng thái bản nháp và chưa được phát hành.' });
    }
    if (quizData.status === 'closed') {
      return res.status(403).json({ success: false, error: 'Đề thi này đã đóng và không còn nhận bài làm.' });
    }

    // Verify password if required
    if (quizData.hasPassword && quizData.password) {
      if (!password || password.trim() !== quizData.password.trim()) {
        return res.status(401).json({
          success: false,
          error: 'Mật khẩu đề thi không chính xác. Vui lòng kiểm tra lại.',
        });
      }
    }

    // Fetch questions from subcollection
    const questionsSnap = await getDocs(collection(db, 'quizzes', quizDoc.id, 'questions'));
    let questionsList = questionsSnap.docs.map(d => {
      const q = d.data();
      // CRITICAL SECURITY: Never leak correctAnswer or explanation to client
      return {
        id: q.id || d.id,
        order: q.order || 1,
        type: q.type || 'single_choice',
        content: q.content,
        options: q.options || [],
        points: q.points || 1,
      };
    });

    // Shuffle questions if configured
    if (quizData.shuffleQuestions) {
      questionsList = [...questionsList].sort(() => Math.random() - 0.5);
      questionsList.forEach((q, idx) => { q.order = idx + 1; });
    }

    // Shuffle options if configured
    if (quizData.shuffleOptions) {
      questionsList = questionsList.map(q => {
        if (q.type === 'single_choice' || q.type === 'multiple_choice') {
          return {
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5),
          };
        }
        return q;
      });
    }

    // Sanitize quiz metadata (strip password)
    const sanitizedQuiz = {
      id: quizDoc.id,
      publicCode: quizData.publicCode,
      title: quizData.title,
      subject: quizData.subject,
      grade: quizData.grade,
      durationMinutes: quizData.durationMinutes,
      maxScore: quizData.maxScore || 10,
      hasPassword: quizData.hasPassword,
      questionCount: questionsList.length,
      showScoreImmediately: quizData.showScoreImmediately !== false,
      revealAnswersMode: quizData.revealAnswersMode || 'none',
      minScoreToRevealAnswers: quizData.minScoreToRevealAnswers || 0,
      revealExplanationsMode: quizData.revealExplanationsMode || 'none',
      minScoreToRevealExplanations: quizData.minScoreToRevealExplanations || 0,
      allowRetake: quizData.allowRetake || false,
      requireSchoolName: quizData.requireSchoolName || false,
    };

    return res.json({
      success: true,
      quiz: sanitizedQuiz,
      questions: questionsList,
    });
  } catch (err: any) {
    console.error('Access verification error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi máy chủ khi kiểm tra đề thi.' });
  }
});

// 2. Submit attempt, perform backend grading, conditionally reveal answer keys
app.post('/api/quizzes/submit', async (req, res) => {
  try {
    const {
      quizId,
      publicCode,
      password,
      studentName,
      studentClass,
      schoolName,
      answers,
      startedAt,
      timeSpentSeconds,
    } = req.body;

    if (!quizId || !studentName?.trim() || !studentClass?.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin học sinh và bài thi.' });
    }

    const quizRef = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizRef);
    if (!quizSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi.' });
    }

    const quiz = quizSnap.data();
    if (quiz.status === 'closed') {
      return res.status(403).json({ success: false, error: 'Đề thi đã đóng.' });
    }
    if (quiz.hasPassword && quiz.password) {
      if (!password || password.trim() !== quiz.password.trim()) {
        return res.status(401).json({ success: false, error: 'Mật khẩu đề thi không đúng.' });
      }
    }

    // Load real questions with answer keys from database
    const questionsSnap = await getDocs(collection(db, 'quizzes', quizId, 'questions'));
    const realQuestions = questionsSnap.docs.map(d => d.data());

    if (realQuestions.length === 0) {
      return res.status(400).json({ success: false, error: 'Đề thi không có câu hỏi.' });
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalPointsEarned = 0;
    let totalMaxPoints = 0;

    const details: Record<string, any> = {};

    realQuestions.forEach((q) => {
      const qId = q.id;
      const qPoints = q.points || 1;
      totalMaxPoints += qPoints;

      const studentAns = answers ? answers[qId] : undefined;
      const correctAns = q.correctAnswer;
      let isCorrect = false;

      if (studentAns === undefined || studentAns === null || studentAns === '' || (Array.isArray(studentAns) && studentAns.length === 0)) {
        unansweredCount++;
      } else {
        // Evaluate based on type
        if (q.type === 'single_choice') {
          isCorrect = normalizeStr(studentAns) === normalizeStr(correctAns);
        } else if (q.type === 'multiple_choice') {
          const sArr = Array.isArray(studentAns) ? studentAns.map(normalizeStr).sort() : [normalizeStr(studentAns)];
          const cArr = Array.isArray(correctAns) ? correctAns.map(normalizeStr).sort() : [normalizeStr(correctAns)];
          isCorrect = sArr.length === cArr.length && sArr.every((val, i) => val === cArr[i]);
        } else if (q.type === 'short_answer') {
          isCorrect = normalizeStr(studentAns) === normalizeStr(correctAns);
        } else if (q.type === 'true_false') {
          // Compare strings or object
          isCorrect = normalizeStr(studentAns) === normalizeStr(correctAns);
        }

        if (isCorrect) {
          correctCount++;
          totalPointsEarned += qPoints;
        } else {
          incorrectCount++;
        }
      }

      details[qId] = {
        isCorrect,
        studentAnswer: studentAns || '',
        // Correct answer and explanation will only be added if allowed below
      };
    });

    const maxScore = quiz.maxScore || 10;
    const finalScore = totalMaxPoints > 0
      ? Math.round(((totalPointsEarned / totalMaxPoints) * maxScore) * 10) / 10
      : 0;

    // Check conditions for revealing answers and explanations
    let canViewAnswers = false;
    if (quiz.revealAnswersMode === 'always') {
      canViewAnswers = true;
    } else if (quiz.revealAnswersMode === 'score_threshold') {
      canViewAnswers = finalScore >= (quiz.minScoreToRevealAnswers || 0);
    }

    let canViewExplanations = false;
    if (quiz.revealExplanationsMode === 'always') {
      canViewExplanations = true;
    } else if (quiz.revealExplanationsMode === 'score_threshold') {
      canViewExplanations = finalScore >= (quiz.minScoreToRevealExplanations || 0);
    }

    // Populate solution details strictly according to permissions
    realQuestions.forEach((q) => {
      const item = details[q.id];
      if (canViewAnswers) {
        item.correctAnswer = q.correctAnswer;
      }
      if (canViewExplanations && q.explanation) {
        item.explanation = q.explanation;
      }
    });

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const attemptRecord = {
      id: attemptId,
      quizId,
      publicCode: quiz.publicCode || publicCode,
      studentName: studentName.trim(),
      studentClass: studentClass.trim(),
      schoolName: schoolName ? schoolName.trim() : '',
      score: finalScore,
      maxScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalQuestions: realQuestions.length,
      timeSpentSeconds: timeSpentSeconds || 0,
      answers: answers || {},
      canViewAnswers,
      canViewExplanations,
      startedAt: startedAt || now,
      submittedAt: now,
    };

    // Save attempt record to Firestore
    await setDoc(doc(db, 'quizzes', quizId, 'attempts', attemptId), attemptRecord);

    return res.json({
      success: true,
      result: {
        attemptId,
        score: finalScore,
        maxScore,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalQuestions: realQuestions.length,
        timeSpentSeconds: timeSpentSeconds || 0,
        canViewAnswers,
        canViewExplanations,
        minScoreToRevealAnswers: quiz.minScoreToRevealAnswers,
        minScoreToRevealExplanations: quiz.minScoreToRevealExplanations,
        revealAnswersMode: quiz.revealAnswersMode,
        details,
      },
    });
  } catch (err: any) {
    console.error('Submission error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi khi chấm điểm và nộp bài.' });
  }
});

// Setup Vite in Dev or static in Prod
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QUIZ PRO server listening on port ${PORT} (dev=${isDev})`);
  });
}

startServer();
