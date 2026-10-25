import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Question, QuizSettings, Quiz } from '../../types/quiz';
import { WordUploader } from './WordUploader';
import { QuestionItemEditor } from './QuestionItemEditor';
import { QuizSettingsForm } from './QuizSettingsForm';
import { ShareQuizModal } from '../common/ShareQuizModal';
import { createQuiz, setQuizStatus } from '../../services/quizService';
import {
  FileText,
  Sliders,
  CheckCircle,
  Plus,
  Save,
  Send,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface QuizCreatorProps {
  onBack: () => void;
  onSuccess: (createdQuiz: Quiz) => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ onBack, onSuccess }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<QuizSettings>({
    title: '',
    subject: 'Toán học',
    grade: 'Lớp 12',
    durationMinutes: 45,
    maxScore: 10,
    hasPassword: false,
    password: '',
    shuffleQuestions: true,
    shuffleOptions: true,
    maxAttempts: 1,
    showScoreImmediately: true,
    revealAnswersMode: 'score_threshold',
    minScoreToRevealAnswers: 7.0,
    revealExplanationsMode: 'score_threshold',
    minScoreToRevealExplanations: 8.0,
    allowRetake: true,
    requireSchoolName: false,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishedQuiz, setPublishedQuiz] = useState<Quiz | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // When WordUploader parses questions
  const handleParsed = (result: any) => {
    setQuestions(result.questions);
    if (!settings.title && result.questions.length > 0) {
      setSettings(prev => ({
        ...prev,
        title: `Đề kiểm tra trắc nghiệm (${result.questions.length} câu)`,
      }));
    }
    setCurrentStep(2);
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q_${questions.length + 1}_${Date.now()}`,
      order: questions.length + 1,
      type: 'single_choice',
      content: `Câu hỏi ${questions.length + 1}`,
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correctAnswer: 'A',
      explanation: '',
      points: 1,
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updated: Question) => {
    const copy = [...questions];
    copy[index] = updated;
    setQuestions(copy);
  };

  const handleDeleteQuestion = (index: number) => {
    const filtered = questions.filter((_, idx) => idx !== index);
    // Re-index order
    const reindexed = filtered.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reindexed);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...questions];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    setQuestions(copy.map((q, idx) => ({ ...q, order: idx + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const copy = [...questions];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    setQuestions(copy.map((q, idx) => ({ ...q, order: idx + 1 })));
  };

  const validateQuiz = (): string | null => {
    if (!settings.title.trim()) {
      return 'Vui lòng nhập tên đề thi / bài kiểm tra.';
    }
    if (questions.length === 0) {
      return 'Đề thi phải có ít nhất 1 câu hỏi.';
    }
    if (settings.hasPassword && !settings.password?.trim()) {
      return 'Thầy/cô đã bật yêu cầu mật khẩu nhưng chưa nhập mật khẩu làm bài.';
    }
    return null;
  };

  const handleSave = async (publishNow: boolean) => {
    setErrorMsg(null);
    const validationErr = validateQuiz();
    if (validationErr) {
      setErrorMsg(validationErr);
      return;
    }

    if (!currentUser) {
      setErrorMsg('Vui lòng đăng nhập tài khoản giáo viên để lưu đề thi.');
      return;
    }

    // Check missing answers
    const missingCount = questions.filter(
      q => !q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)
    ).length;

    if (publishNow && missingCount > 0) {
      const confirm = window.confirm(
        `Đang có ${missingCount} câu hỏi chưa được chọn đáp án đúng. Thầy/cô có chắc chắn muốn phát hành đề ngay không?`
      );
      if (!confirm) return;
    }

    setSaving(true);
    try {
      const savedQuiz = await createQuiz(
        currentUser.uid,
        currentUser.email || '',
        settings,
        questions
      );

      if (publishNow) {
        await setQuizStatus(savedQuiz.id, 'published');
        savedQuiz.status = 'published';
        setPublishedQuiz(savedQuiz);
        setShowShareModal(true);
      } else {
        onSuccess(savedQuiz);
      }
    } catch (err: any) {
      console.error('Error saving quiz:', err);
      setErrorMsg(err.message || 'Lỗi khi lưu đề thi lên hệ thống Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const missingAnswersCount = questions.filter(
    q => !q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Quay lại danh sách đề thi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Tạo đề thi trắc nghiệm mới</h1>
            <p className="text-xs text-slate-500">
              {questions.length > 0 ? `${questions.length} câu hỏi đã nạp` : 'Tải file Word hoặc soạn thảo trực tiếp'}
            </p>
          </div>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              currentStep === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Nạp Word</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            disabled={questions.length === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 2
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Rà soát câu hỏi ({questions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            disabled={questions.length === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 3
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Cài đặt &amp; Phát hành</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* STEP 1: Upload Word */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <WordUploader onParsed={handleParsed} />
        </div>
      )}

      {/* STEP 2: Review & Edit Questions */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
            <div>
              <h3 className="font-bold text-blue-950 text-sm">
                Danh sách câu hỏi ({questions.length} câu)
              </h3>
              <p className="text-xs text-blue-800/80">
                Thầy/cô có thể chỉnh sửa nội dung, chọn đáp án đúng, thêm bớt phương án hoặc di chuyển vị trí.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu hỏi mới</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                <span>Tiếp tục cài đặt</span>
              </button>
            </div>
          </div>

          {missingAnswersCount > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Đang có <strong>{missingAnswersCount} câu hỏi</strong> chưa được chọn đáp án đúng (viền màu vàng). Thầy/cô vui lòng kiểm tra lại.
                </span>
              </div>
            </div>
          )}

          {/* Questions list */}
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionItemEditor
                key={q.id}
                question={q}
                index={idx}
                totalQuestions={questions.length}
                onChange={(updated) => handleUpdateQuestion(idx, updated)}
                onDelete={() => handleDeleteQuestion(idx)}
                onMoveUp={() => handleMoveUp(idx)}
                onMoveDown={() => handleMoveDown(idx)}
              />
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi tiếp theo</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Settings & Publish */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <QuizSettingsForm settings={settings} onChange={setSettings} />

          {/* Action buttons: Save draft & Publish */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>Lưu bản nháp</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Phát hành đề thi ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareQuizModal
        quiz={publishedQuiz}
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          if (publishedQuiz) onSuccess(publishedQuiz);
        }}
      />
    </div>
  );
};
