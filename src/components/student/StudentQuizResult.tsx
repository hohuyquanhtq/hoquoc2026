import React from 'react';
import { GradedResult, StudentQuestion } from '../../types/quiz';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  RotateCcw,
  Lock,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface StudentQuizResultProps {
  result: GradedResult;
  quiz: any;
  questions: StudentQuestion[];
  studentName: string;
  studentClass: string;
  timeSpentSeconds: number;
  onRetakeExam?: () => void;
}

export const StudentQuizResult: React.FC<StudentQuizResultProps> = ({
  result,
  quiz,
  questions,
  studentName,
  studentClass,
  timeSpentSeconds,
  onRetakeExam,
}) => {
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} phút ${s} giây`;
  };

  // Grade classification
  const getRating = (score: number, max: number) => {
    const pct = (score / max) * 10;
    if (pct >= 9) return { label: 'Xuất sắc', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 8) return { label: 'Giỏi', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 6.5) return { label: 'Khá', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (pct >= 5) return { label: 'Trung bình', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Cần cố gắng', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const rating = getRating(result.score, result.maxScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Result Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sm:p-8 text-center relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-3 backdrop-blur-xs">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">KẾT QUẢ BÀI THI</h1>
            <p className="text-blue-100 text-sm mt-1">{quiz.title}</p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-blue-100">
              <span>Học sinh: <strong className="text-white">{studentName}</strong></span>
              <span>•</span>
              <span>Lớp: <strong className="text-white">{studentClass}</strong></span>
            </div>
          </div>

          {/* Score & Metrics Dashboard */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              {/* Score Display */}
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tổng điểm đạt được
                </span>
                <div className="flex items-baseline justify-center sm:justify-start gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-blue-600 tracking-tight">
                    {result.score}
                  </span>
                  <span className="text-2xl font-bold text-slate-400">/ {result.maxScore}</span>
                </div>
                <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${rating.color}`}>
                  Đánh giá: {rating.label}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full sm:w-auto text-xs">
                <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center shadow-xs">
                  <span className="text-slate-400 block mb-0.5">Số câu đúng</span>
                  <strong className="text-emerald-600 text-lg font-bold">{result.correctCount}</strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-rose-100 text-center shadow-xs">
                  <span className="text-slate-400 block mb-0.5">Số câu sai</span>
                  <strong className="text-rose-600 text-lg font-bold">{result.incorrectCount}</strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-100 text-center shadow-xs">
                  <span className="text-slate-400 block mb-0.5">Chưa trả lời</span>
                  <strong className="text-slate-700 text-lg font-bold">{result.unansweredCount}</strong>
                </div>
                <div className="col-span-2 sm:col-span-3 p-3 bg-white rounded-xl border border-blue-100 text-center shadow-xs flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-600">Thời gian làm bài:</span>
                  <strong className="text-blue-900 font-bold">{formatSeconds(timeSpentSeconds)}</strong>
                </div>
              </div>
            </div>

            {/* Answer Reveal Status Callout */}
            {result.canViewAnswers ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs sm:text-sm">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold block text-emerald-900 mb-0.5">
                    Đủ điều kiện xem đáp án chi tiết!
                  </strong>
                  Thầy/cô cho phép em xem lại toàn bộ câu hỏi kèm đáp án đúng và hướng dẫn giải ở bên dưới.
                </div>
              </div>
            ) : (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-amber-900 text-xs sm:text-sm">
                <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold block text-amber-950 mb-1">
                    Đáp án được bảo mật theo quy định của giáo viên
                  </strong>
                  {result.revealAnswersMode === 'score_threshold' ? (
                    <p>
                      Đề thi này yêu cầu đạt tối thiểu <strong>{result.minScoreToRevealAnswers} điểm</strong> để mở khóa đáp án chi tiết. Em đạt <strong>{result.score} điểm</strong> nên đáp án chưa thể hiển thị.
                    </p>
                  ) : (
                    <p>Giáo viên đã cài đặt không công bố đáp án cho bài kiểm tra này.</p>
                  )}
                  {quiz.allowRetake && (
                    <p className="mt-1 font-semibold text-amber-800">
                      Em có thể ôn tập lại kiến thức và làm lại bài thi để cải thiện điểm số!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Retake Action button if permitted */}
            {quiz.allowRetake && onRetakeExam && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={onRetakeExam}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm lại bài thi</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Questions Review (Only if canViewAnswers === true) */}
        {result.canViewAnswers && result.details && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Chi tiết bài làm và Đáp án chính xác</span>
            </h2>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const item = result.details ? result.details[q.id] : null;
                const isCorrect = item?.isCorrect;
                const studentAns = item?.studentAnswer;
                const correctAns = item?.correctAnswer;
                const explanation = item?.explanation;

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 ${
                      isCorrect ? 'border-emerald-200' : 'border-rose-200'
                    }`}
                  >
                    {/* Item header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="font-bold text-xs sm:text-sm text-slate-800">
                        Câu {idx + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Đúng
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            {studentAns ? 'Sai' : 'Chưa làm'}
                          </>
                        )}
                      </span>
                    </div>

                    {/* Question text */}
                    <div className="text-sm sm:text-base font-medium text-slate-900 whitespace-pre-line">
                      {q.content}
                    </div>

                    {/* Choices list */}
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {q.options.map((opt) => {
                          const isStudentSelected =
                            Array.isArray(studentAns)
                              ? studentAns.includes(opt.id)
                              : studentAns === opt.id;
                          const isTheCorrectAnswer =
                            Array.isArray(correctAns)
                              ? correctAns.includes(opt.id)
                              : correctAns === opt.id;

                          let optStyle = 'border-slate-200 bg-white text-slate-700';
                          if (isTheCorrectAnswer) {
                            optStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500';
                          } else if (isStudentSelected && !isTheCorrectAnswer) {
                            optStyle = 'border-rose-400 bg-rose-50/60 text-rose-950 line-through';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${optStyle}`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                                  isTheCorrectAnswer
                                    ? 'bg-emerald-600 text-white'
                                    : isStudentSelected
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span className="mt-0.5">{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer / Text answer summary */}
                    {q.type === 'short_answer' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block mb-0.5">Em đã trả lời:</span>
                          <strong className="text-slate-900 text-sm font-mono">
                            {studentAns || '(Bỏ trống)'}
                          </strong>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                          <span className="text-emerald-700 block mb-0.5">Đáp án đúng chuẩn:</span>
                          <strong className="text-emerald-900 text-sm font-mono">
                            {correctAns}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Explanation box */}
                    {explanation && (
                      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900">
                          <HelpCircle className="w-4 h-4 text-blue-600" />
                          <span>Hướng dẫn giải chi tiết:</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-line pl-5">{explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
