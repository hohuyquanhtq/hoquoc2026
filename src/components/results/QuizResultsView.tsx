import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt, Question } from '../../types/quiz';
import { getQuizAttempts, getQuizQuestions, deleteAttempt } from '../../services/quizService';
import {
  ArrowLeft,
  Users,
  Search,
  Download,
  Trash2,
  Eye,
  BarChart2,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface QuizResultsViewProps {
  quiz: Quiz;
  onBack: () => void;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({ quiz, onBack }) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedScoreRange, setSelectedScoreRange] = useState('ALL');
  const [inspectAttempt, setInspectAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    loadData();
  }, [quiz.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [atts, qs] = await Promise.all([
        getQuizAttempts(quiz.id),
        getQuizQuestions(quiz.id),
      ]);
      setAttempts(atts);
      setQuestions(qs);
    } catch (err: any) {
      console.error('Error loading attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!window.confirm('Thầy/cô có chắc muốn xóa kết quả làm bài của học sinh này?')) return;
    try {
      await deleteAttempt(quiz.id, attemptId);
      setAttempts(prev => prev.filter(a => a.id !== attemptId));
    } catch (err: any) {
      alert('Không thể xóa kết quả: ' + err.message);
    }
  };

  // Unique classes for filter
  const classList = Array.from(new Set(attempts.map(a => a.studentClass))).filter(Boolean);

  // Filtered attempts
  const filteredAttempts = attempts.filter(att => {
    const matchesSearch =
      att.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.studentClass.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'ALL' || att.studentClass === selectedClass;

    let matchesScore = true;
    if (selectedScoreRange === 'GIOI') matchesScore = att.score >= 8.0;
    else if (selectedScoreRange === 'KHA') matchesScore = att.score >= 6.5 && att.score < 8.0;
    else if (selectedScoreRange === 'TB') matchesScore = att.score >= 5.0 && att.score < 6.5;
    else if (selectedScoreRange === 'YEU') matchesScore = att.score < 5.0;

    return matchesSearch && matchesClass && matchesScore;
  });

  // Calculate statistics
  const total = attempts.length;
  const avgScore = total > 0
    ? (attempts.reduce((sum, a) => sum + a.score, 0) / total).toFixed(1)
    : '0';
  const maxScore = total > 0
    ? Math.max(...attempts.map(a => a.score)).toFixed(1)
    : '0';
  const minScore = total > 0
    ? Math.min(...attempts.map(a => a.score)).toFixed(1)
    : '0';
  const passCount = attempts.filter(a => a.score >= 5.0).length;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

  // Export to CSV with UTF-8 BOM for Microsoft Excel
  const exportToCSV = () => {
    if (attempts.length === 0) {
      alert('Chưa có dữ liệu bài làm để xuất file.');
      return;
    }

    const headers = [
      'STT',
      'Họ và tên',
      'Lớp',
      'Trường học',
      'Điểm số',
      'Thang điểm',
      'Số câu đúng',
      'Số câu sai',
      'Chưa làm',
      'Thời gian làm bài (giây)',
      'Thời điểm nộp bài',
    ];

    const rows = attempts.map((a, idx) => [
      idx + 1,
      `"${a.studentName.replace(/"/g, '""')}"`,
      `"${a.studentClass.replace(/"/g, '""')}"`,
      `"${(a.schoolName || '').replace(/"/g, '""')}"`,
      a.score,
      a.maxScore,
      a.correctCount,
      a.incorrectCount,
      a.unansweredCount,
      a.timeSpentSeconds,
      `"${new Date(a.submittedAt).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ket_qua_${quiz.title.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
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
            <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
            <p className="text-xs text-slate-500">
              Quản lý kết quả thi &amp; Thống kê điểm số học sinh
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportToCSV}
          disabled={attempts.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Excel / CSV</span>
        </button>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Tổng lượt thi</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-slate-900">{total}</strong>
            <span className="text-xs text-slate-400">bài</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 block mb-1">Điểm trung bình</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-blue-600">{avgScore}</strong>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 block mb-1">Điểm cao nhất</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-emerald-600">{maxScore}</strong>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 block mb-1">Điểm thấp nhất</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-rose-600">{minScore}</strong>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
          <span className="text-xs font-semibold text-indigo-600 block mb-1">Tỷ lệ đạt (≥ 5.0)</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-indigo-600">{passRate}%</strong>
            <span className="text-xs text-slate-400">({passCount} hs)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo họ tên hoặc lớp..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-1 sm:flex-none"
          >
            <option value="ALL">Tất cả các lớp</option>
            {classList.map(c => (
              <option key={c} value={c}>Lớp {c}</option>
            ))}
          </select>

          {/* Score Range Filter */}
          <select
            value={selectedScoreRange}
            onChange={(e) => setSelectedScoreRange(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-1 sm:flex-none"
          >
            <option value="ALL">Mọi mức điểm</option>
            <option value="GIOI">Giỏi (≥ 8.0)</option>
            <option value="KHA">Khá (6.5 - 7.9)</option>
            <option value="TB">Trung bình (5.0 - 6.4)</option>
            <option value="YEU">Yếu / Chưa đạt (&lt; 5.0)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Đang tải danh sách bài làm...</p>
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {attempts.length === 0
              ? 'Chưa có học sinh nào nộp bài cho đề thi này.'
              : 'Không tìm thấy kết quả phù hợp với điều kiện lọc.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Điểm số</th>
                  <th className="py-3 px-4">Đúng / Sai</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Thời điểm nộp</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.map((att, idx) => {
                  const isPass = att.score >= 5.0;
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{att.studentName}</span>
                        {att.schoolName && (
                          <span className="text-[11px] text-slate-400 block">{att.schoolName}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 font-semibold text-slate-700 rounded-md">
                          {att.studentClass}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-black text-sm ${
                            att.score >= 8
                              ? 'bg-emerald-100 text-emerald-800'
                              : att.score >= 5
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {att.score} / {att.maxScore}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="text-emerald-600 font-bold">{att.correctCount}</span>
                        {' / '}
                        <span className="text-rose-600 font-bold">{att.incorrectCount}</span>
                        {att.unansweredCount > 0 && (
                          <span className="text-slate-400 text-[11px] ml-1">
                            ({att.unansweredCount} bỏ trống)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {formatSeconds(att.timeSpentSeconds)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(att.submittedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        - {new Date(att.submittedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectAttempt(att)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Xem chi tiết bài làm"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttempt(att.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Xóa bài làm này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Student Answer Sheet Modal */}
      {inspectAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Chi tiết bài làm: {inspectAttempt.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Lớp: {inspectAttempt.studentClass} | Điểm: <strong>{inspectAttempt.score}/10</strong> | Đúng:{' '}
                  {inspectAttempt.correctCount} câu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectAttempt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {questions.map((q, idx) => {
                const studentAns = inspectAttempt.answers[q.id];
                const correctAns = q.correctAnswer;
                const isCorrect =
                  studentAns !== undefined &&
                  JSON.stringify(studentAns) === JSON.stringify(correctAns);

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-800">Câu {idx + 1}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                    </div>

                    <p className="text-slate-900 font-medium whitespace-pre-line">{q.content}</p>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Học sinh chọn:</span>
                        <strong className="text-slate-900">
                          {studentAns !== undefined ? String(studentAns) : '(Không trả lời)'}
                        </strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-200">
                        <span className="text-emerald-700 block text-[10px]">Đáp án đúng:</span>
                        <strong className="text-emerald-900">{String(correctAns)}</strong>
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100 text-blue-900 text-[11px]">
                        <strong>Hướng dẫn giải:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectAttempt(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
