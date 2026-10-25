import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Quiz } from '../../types/quiz';
import { getTeacherQuizzes, deleteQuiz, setQuizStatus } from '../../services/quizService';
import { ShareQuizModal } from '../common/ShareQuizModal';
import {
  Plus,
  BookOpen,
  FileText,
  Clock,
  Users,
  Share2,
  Trash2,
  CheckCircle2,
  Lock,
  BarChart3,
  LogOut,
  FolderOpen,
  Send,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface TeacherDashboardProps {
  onCreateNew: () => void;
  onViewResults: (quiz: Quiz) => void;
  onPreviewQuiz: (publicCode: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onCreateNew,
  onViewResults,
  onPreviewQuiz,
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'published' | 'draft' | 'closed'>('ALL');
  const [selectedShareQuiz, setSelectedShareQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadQuizzes();
    }
  }, [currentUser]);

  const loadQuizzes = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const list = await getTeacherQuizzes(currentUser.uid);
      setQuizzes(list);
    } catch (err: any) {
      console.error('Error fetching teacher quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    const newStatus = quiz.status === 'published' ? 'closed' : 'published';
    const actionLabel = newStatus === 'published' ? 'phát hành lại' : 'đóng đề (ngừng nhận bài)';
    if (!window.confirm(`Thầy/cô có muốn ${actionLabel} cho đề "${quiz.title}"?`)) return;

    try {
      await setQuizStatus(quiz.id, newStatus);
      setQuizzes(prev =>
        prev.map(q => (q.id === quiz.id ? { ...q, status: newStatus } : q))
      );
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái đề: ' + err.message);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Thầy/cô có chắc chắn muốn xóa đề thi này? Hành động này sẽ xóa cả danh sách câu hỏi và kết quả thi liên quan.')) {
      return;
    }
    try {
      await deleteQuiz(quizId);
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (err: any) {
      alert('Không thể xóa đề: ' + err.message);
    }
  };

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(q => {
    if (activeTab === 'ALL') return true;
    return q.status === activeTab;
  });

  const publishedCount = quizzes.filter(q => q.status === 'published').length;
  const draftCount = quizzes.filter(q => q.status === 'draft').length;
  const closedCount = quizzes.filter(q => q.status === 'closed').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight block">QUIZ PRO</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider -mt-1 block">
                Cổng quản lý giáo viên
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-slate-800 block">
                {userProfile?.displayName || currentUser?.displayName || 'Thầy/Cô'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                {currentUser?.email}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Đăng xuất"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
        {/* Banner with Stats and Create Button */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              EdTech Giáo dục 4.0
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tạo đề trắc nghiệm nhanh từ file Word
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Tự động nhận diện câu hỏi, cài đặt mật khẩu, bảo mật đáp án theo ngưỡng điểm và tổ chức thi trực tuyến không cần học sinh tạo tài khoản.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer text-sm shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Tạo đề thi mới</span>
          </button>
        </div>

        {/* Dashboard Tabs & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tất cả đề ({quizzes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('published')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'published'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Đang mở thi ({publishedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('draft')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'draft'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Bản nháp ({draftCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('closed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'closed'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Đã đóng ({closedCount})
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Mỗi giáo viên chỉ quản lý các đề thi thuộc sở hữu của mình
          </span>
        </div>

        {/* Quizzes Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Đang tải danh sách đề thi từ Firebase Firestore...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Chưa có đề thi nào trong mục này</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thầy/cô có thể tải file Word (.docx) chứa câu hỏi trắc nghiệm để hệ thống tự động bóc tách và tạo đề trong vòng 30 giây!
            </p>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề đầu tiên ngay</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Card Top */}
                <div className="p-5 pb-4 flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        quiz.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : quiz.status === 'closed'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {quiz.status === 'published' && 'Đang mở thi'}
                      {quiz.status === 'closed' && 'Đã đóng'}
                      {quiz.status === 'draft' && 'Bản nháp'}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {quiz.publicCode}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {quiz.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span>Môn: <strong className="text-slate-800">{quiz.subject || 'Chung'}</strong></span>
                    <span>Lớp: <strong className="text-slate-800">{quiz.grade || 'Tất cả'}</strong></span>
                    <span>{quiz.questionCount} câu hỏi</span>
                    <span>{quiz.durationMinutes > 0 ? `${quiz.durationMinutes} phút` : 'Tự do'}</span>
                  </div>

                  {quiz.hasPassword && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Có mật khẩu làm bài</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onViewResults(quiz)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Xem kết quả</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {quiz.status === 'published' && (
                      <button
                        type="button"
                        onClick={() => setSelectedShareQuiz(quiz)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition cursor-pointer"
                        title="Chia sẻ link & mã QR"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onPreviewQuiz(quiz.publicCode)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
                      title="Mở thi thử nghiệm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(quiz)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition cursor-pointer text-xs font-semibold"
                      title={quiz.status === 'published' ? 'Đóng đề thi' : 'Mở phát hành'}
                    >
                      {quiz.status === 'published' ? (
                        <Lock className="w-4 h-4 text-slate-400 hover:text-amber-600" />
                      ) : (
                        <Send className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(quiz.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                      title="Xóa đề thi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Share Modal */}
      <ShareQuizModal
        quiz={selectedShareQuiz}
        isOpen={Boolean(selectedShareQuiz)}
        onClose={() => setSelectedShareQuiz(null)}
      />
    </div>
  );
};
