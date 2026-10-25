import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { QuizCreator } from './components/quiz-creator/QuizCreator';
import { QuizResultsView } from './components/results/QuizResultsView';
import { StudentQuizEntry } from './components/student/StudentQuizEntry';
import { StudentQuizTaking } from './components/student/StudentQuizTaking';
import { StudentQuizResult } from './components/student/StudentQuizResult';
import { testFirestoreConnection } from './lib/firebase';
import { Quiz, StudentQuestion, GradedResult } from './types/quiz';
import { BookOpen, KeyRound, ShieldAlert, CheckCircle2, User, ArrowLeft } from 'lucide-react';

type AppView =
  | 'DASHBOARD'
  | 'CREATE_QUIZ'
  | 'QUIZ_RESULTS'
  | 'STUDENT_ENTRY'
  | 'STUDENT_TAKING'
  | 'STUDENT_RESULT';

function MainApp() {
  const { currentUser, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');

  // Selected quiz for viewing results
  const [activeResultsQuiz, setActiveResultsQuiz] = useState<Quiz | null>(null);

  // Student exam session state
  const [studentPublicCode, setStudentPublicCode] = useState<string>('');
  const [activeStudentExam, setActiveStudentExam] = useState<{
    quiz: any;
    questions: StudentQuestion[];
    studentName: string;
    studentClass: string;
    schoolName: string;
    password?: string;
  } | null>(null);
  const [studentGradedResult, setStudentGradedResult] = useState<GradedResult | null>(null);
  const [studentTimeSpent, setStudentTimeSpent] = useState<number>(0);

  // Manual code entry modal from landing page
  const [showCodeInputModal, setShowCodeInputModal] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  // 1. Check connection and parse URL hash / query on mount
  useEffect(() => {
    testFirestoreConnection();

    const handleHashChange = () => {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      let code = searchParams.get('quiz');

      if (!code && hash.startsWith('#quiz=')) {
        code = hash.replace('#quiz=', '');
      } else if (!code && hash.startsWith('#/quiz/')) {
        code = hash.replace('#/quiz/', '');
      }

      if (code) {
        setStudentPublicCode(code.trim().toUpperCase());
        setCurrentView('STUDENT_ENTRY');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handler when student enters the exam
  const handleEnterExam = (data: {
    quiz: any;
    questions: StudentQuestion[];
    studentName: string;
    studentClass: string;
    schoolName: string;
    password?: string;
  }) => {
    setActiveStudentExam(data);
    setCurrentView('STUDENT_TAKING');
  };

  // Handler when student submits the exam
  const handleSubmitExam = async (answers: Record<string, any>, timeSpentSeconds: number) => {
    if (!activeStudentExam) return;

    try {
      const response = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: activeStudentExam.quiz.id,
          publicCode: activeStudentExam.quiz.publicCode,
          password: activeStudentExam.password,
          studentName: activeStudentExam.studentName,
          studentClass: activeStudentExam.studentClass,
          schoolName: activeStudentExam.schoolName,
          answers,
          startedAt: new Date().toISOString(),
          timeSpentSeconds,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || 'Lỗi khi gửi bài thi. Vui lòng thử lại.');
        return;
      }

      setStudentGradedResult(data.result);
      setStudentTimeSpent(timeSpentSeconds);
      setCurrentView('STUDENT_RESULT');
    } catch (err: any) {
      console.error('Submit exam error:', err);
      alert('Không thể kết nối đến máy chủ để chấm điểm.');
    }
  };

  const handleRetakeExam = () => {
    setStudentGradedResult(null);
    setCurrentView('STUDENT_TAKING');
  };

  // Navigate to teacher preview
  const handlePreviewAsStudent = (code: string) => {
    window.location.hash = `#quiz=${code}`;
    setStudentPublicCode(code);
    setCurrentView('STUDENT_ENTRY');
  };

  // Handle manual code entry submit
  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    const cleanCode = manualCodeInput.trim().toUpperCase();
    window.location.hash = `#quiz=${cleanCode}`;
    setStudentPublicCode(cleanCode);
    setShowCodeInputModal(false);
    setCurrentView('STUDENT_ENTRY');
  };

  // Exit student mode and return to dashboard
  const handleExitStudentMode = () => {
    window.location.hash = '';
    setActiveStudentExam(null);
    setStudentGradedResult(null);
    setCurrentView('DASHBOARD');
  };

  // Loading indicator for Firebase Auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold text-slate-700">Đang khởi tạo hệ thống QUIZ PRO...</p>
      </div>
    );
  }

  // 2. Student Flow (no teacher account needed!)
  if (currentView === 'STUDENT_ENTRY' && studentPublicCode) {
    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-50">
          <button
            type="button"
            onClick={handleExitStudentMode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer backdrop-blur-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về trang chủ</span>
          </button>
        </div>
        <StudentQuizEntry publicCode={studentPublicCode} onEnterExam={handleEnterExam} />
      </div>
    );
  }

  if (currentView === 'STUDENT_TAKING' && activeStudentExam) {
    return (
      <StudentQuizTaking
        quiz={activeStudentExam.quiz}
        questions={activeStudentExam.questions}
        studentName={activeStudentExam.studentName}
        studentClass={activeStudentExam.studentClass}
        schoolName={activeStudentExam.schoolName}
        password={activeStudentExam.password}
        onSubmitExam={handleSubmitExam}
      />
    );
  }

  if (currentView === 'STUDENT_RESULT' && studentGradedResult && activeStudentExam) {
    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-50">
          <button
            type="button"
            onClick={handleExitStudentMode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl shadow-md hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát phòng thi</span>
          </button>
        </div>
        <StudentQuizResult
          result={studentGradedResult}
          quiz={activeStudentExam.quiz}
          questions={activeStudentExam.questions}
          studentName={activeStudentExam.studentName}
          studentClass={activeStudentExam.studentClass}
          timeSpentSeconds={studentTimeSpent}
          onRetakeExam={activeStudentExam.quiz.allowRetake ? handleRetakeExam : undefined}
        />
      </div>
    );
  }

  // 3. Teacher Flow: If not logged in, show Teacher Auth Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/40 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* Top Header */}
        <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xl tracking-tight block">QUIZ PRO</span>
              <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider block">
                Tạo đề nhanh &amp; Thi trực tuyến
              </span>
            </div>
          </div>

          {/* Quick button for student with code */}
          <button
            type="button"
            onClick={() => setShowCodeInputModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Học sinh vào thi</span>
          </button>
        </header>

        {/* Center Auth Card */}
        <div className="my-auto py-6">
          {authMode === 'LOGIN' ? (
            <LoginForm
              onSwitchToRegister={() => setAuthMode('REGISTER')}
              onOpenForgotPassword={() => setShowForgotPassword(true)}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setAuthMode('LOGIN')}
            />
          )}
        </div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />

        {/* Modal for Student Entering Code Manually */}
        {showCodeInputModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Nhập mã đề thi</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Nhập mã đề thi do giáo viên cung cấp (ví dụ: QP-849201)
                </p>
              </div>

              <form onSubmit={handleManualCodeSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  autoFocus
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                  placeholder="QP-XXXXXX"
                  className="w-full text-center tracking-widest uppercase font-mono font-bold text-lg p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCodeInputModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
                  >
                    Vào phòng thi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 pt-6">
          QUIZ PRO © 2026 – Nền tảng EdTech tạo đề thi từ Word và chấm điểm trực tuyến thông minh.
        </footer>
      </div>
    );
  }

  // 4. Logged-in Teacher Views
  if (currentView === 'CREATE_QUIZ') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <QuizCreator
          onBack={() => setCurrentView('DASHBOARD')}
          onSuccess={() => setCurrentView('DASHBOARD')}
        />
      </div>
    );
  }

  if (currentView === 'QUIZ_RESULTS' && activeResultsQuiz) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <QuizResultsView
          quiz={activeResultsQuiz}
          onBack={() => {
            setActiveResultsQuiz(null);
            setCurrentView('DASHBOARD');
          }}
        />
      </div>
    );
  }

  return (
    <TeacherDashboard
      onCreateNew={() => setCurrentView('CREATE_QUIZ')}
      onViewResults={(quiz) => {
        setActiveResultsQuiz(quiz);
        setCurrentView('QUIZ_RESULTS');
      }}
      onPreviewQuiz={handlePreviewAsStudent}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
