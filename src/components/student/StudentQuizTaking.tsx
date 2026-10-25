import React, { useState, useEffect, useRef } from 'react';
import { StudentQuestion } from '../../types/quiz';
import {
  Clock,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface StudentQuizTakingProps {
  quiz: any;
  questions: StudentQuestion[];
  studentName: string;
  studentClass: string;
  schoolName: string;
  password?: string;
  onSubmitExam: (answers: Record<string, any>, timeSpentSeconds: number) => void;
}

export const StudentQuizTaking: React.FC<StudentQuizTakingProps> = ({
  quiz,
  questions,
  studentName,
  studentClass,
  schoolName,
  password,
  onSubmitExam,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startedAt] = useState<string>(new Date().toISOString());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.durationMinutes > 0 ? quiz.durationMinutes * 60 : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const initialSeconds = useRef<number>(quiz.durationMinutes > 0 ? quiz.durationMinutes * 60 : 0);
  const startTimeRef = useRef<number>(Date.now());

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleSelectOption = (questionId: string, optId: string, type: string) => {
    if (type === 'single_choice') {
      setAnswers(prev => ({ ...prev, [questionId]: optId }));
    } else if (type === 'multiple_choice') {
      const current = Array.isArray(answers[questionId]) ? [...answers[questionId]] : [];
      const updated = current.includes(optId)
        ? current.filter(x => x !== optId)
        : [...current, optId];
      setAnswers(prev => ({ ...prev, [questionId]: updated }));
    }
  };

  const handleShortAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleTrueFalseChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateTimeSpent = () => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    return Math.max(1, elapsed);
  };

  const handleFinalSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    const spent = calculateTimeSpent();
    onSubmitExam(answers, spent);
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter(k => {
    const v = answers[k];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }).length;
  const unansweredCount = questions.length - answeredCount;

  // Format timer MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeRemaining !== null && timeRemaining <= 60;
  const isTimeWarning = timeRemaining !== null && timeRemaining <= 300 && timeRemaining > 60;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate">{quiz.title}</h1>
            <p className="text-xs text-slate-500 truncate">
              Học sinh: <strong className="text-slate-800">{studentName}</strong> | Lớp:{' '}
              <strong className="text-slate-800">{studentClass}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition ${
                  isTimeCritical
                    ? 'bg-red-500 text-white border-red-600 animate-pulse'
                    : isTimeWarning
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Main Column: Question Card */}
        <div className="lg:col-span-3 space-y-4">
          {currentQuestion && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Question header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                  Câu hỏi {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                  {currentQuestion.type === 'single_choice' && 'Chọn 1 đáp án'}
                  {currentQuestion.type === 'multiple_choice' && 'Chọn nhiều đáp án'}
                  {currentQuestion.type === 'true_false' && 'Đúng / Sai'}
                  {currentQuestion.type === 'short_answer' && 'Điền kết quả'}
                </span>
              </div>

              {/* Question content */}
              <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                {currentQuestion.content}
              </div>

              {/* Options Section */}
              <div className="pt-2">
                {/* Single Choice Options */}
                {currentQuestion.type === 'single_choice' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(currentQuestion.id, opt.id, 'single_choice')}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-semibold'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="text-sm sm:text-base leading-relaxed mt-0.5">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Multiple Choice Options */}
                {currentQuestion.type === 'multiple_choice' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt) => {
                      const selectedArr = Array.isArray(answers[currentQuestion.id])
                        ? answers[currentQuestion.id]
                        : [];
                      const isSelected = selectedArr.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(currentQuestion.id, opt.id, 'multiple_choice')}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-semibold'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border mt-0.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isSelected ? '✓' : opt.id}
                          </div>
                          <span className="text-sm sm:text-base leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {currentQuestion.type === 'short_answer' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Nhập câu trả lời của em:
                    </label>
                    <input
                      type="text"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleShortAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Nhập đáp án hoặc giá trị số..."
                      className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* True/False Input */}
                {currentQuestion.type === 'true_false' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                      Ghi đáp án theo định dạng (ví dụ: <code>a-Đ; b-S; c-Đ; d-Đ</code>):
                    </div>
                    <input
                      type="text"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleTrueFalseChange(currentQuestion.id, e.target.value)}
                      placeholder="Nhập lựa chọn Đúng/Sai cho các ý..."
                      className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Navigation controls (Previous / Next) */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-xs transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <span className="text-xs text-slate-400 font-medium">
                  {answeredCount} / {questions.length} đã trả lời
                </span>

                <button
                  type="button"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Navigator Palette */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between">
              <span>Bảng danh sách câu</span>
              <span className="text-xs text-slate-500 font-normal">
                {answeredCount}/{questions.length} câu
              </span>
            </h3>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered =
                  ans !== undefined &&
                  ans !== null &&
                  ans !== '' &&
                  (!Array.isArray(ans) || ans.length > 0);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition cursor-pointer border ${
                      isCurrent
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : isAnswered
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
                <span>Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200 shrink-0" />
                <span>Chưa trả lời ({unansweredCount})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Nộp bài thi</span>
            </button>
          </div>
        </div>
      </main>

      {/* Confirm Submission Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Xác nhận nộp bài thi?</h3>

            {unansweredCount > 0 ? (
              <p className="text-sm text-slate-600 leading-relaxed">
                Em còn <strong className="text-amber-600">{unansweredCount} câu hỏi</strong> chưa trả lời. Em có chắc chắn muốn nộp bài ngay bây giờ không?
              </p>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed">
                Em đã hoàn thành tất cả {questions.length} câu hỏi. Hãy nhấn nút xác nhận để nộp bài và chấm điểm.
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Xác nhận nộp bài</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
