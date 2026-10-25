import React, { useState } from 'react';
import { EyeToggleButton } from '../common/EyeToggleButton';
import { StudentQuestion } from '../../types/quiz';
import { BookOpen, Clock, FileCheck, Lock, User, School, AlertCircle, Play } from 'lucide-react';

interface StudentQuizEntryProps {
  publicCode: string;
  onEnterExam: (data: {
    quiz: any;
    questions: StudentQuestion[];
    studentName: string;
    studentClass: string;
    schoolName: string;
    password?: string;
  }) => void;
}

export const StudentQuizEntry: React.FC<StudentQuizEntryProps> = ({ publicCode, onEnterExam }) => {
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!studentName.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Họ và tên học sinh.');
      return;
    }
    if (!studentClass.trim()) {
      setErrorMsg('Vui lòng nhập tên Lớp (ví dụ: 12A1, 9/2).');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/quizzes/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicCode: publicCode.trim().toUpperCase(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Không thể truy cập đề thi. Vui lòng kiểm tra lại mật khẩu.');
        return;
      }

      onEnterExam({
        quiz: data.quiz,
        questions: data.questions,
        studentName: studentName.trim(),
        studentClass: studentClass.trim(),
        schoolName: schoolName.trim(),
        password: password.trim(),
      });
    } catch (err: any) {
      console.error('Access check error:', err);
      setErrorMsg('Lỗi kết nối máy chủ khi xác thực đề thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-3 backdrop-blur-xs">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PHÒNG THI TRỰC TUYẾN</h1>
          <p className="text-blue-100 text-xs mt-1 font-mono uppercase tracking-wider">
            MÃ ĐỀ THI: <span className="font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-md">{publicCode}</span>
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800 text-sm">Hướng dẫn làm bài:</p>
            <p>1. Học sinh không cần đăng ký tài khoản, chỉ cần khai báo Họ tên và Lớp.</p>
            <p>2. Nếu đề thi có cài đặt mật khẩu, vui lòng nhập mật khẩu do giáo viên cung cấp.</p>
            <p>3. Không làm tươi (F5) trang khi đang thi để tránh gián đoạn.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" htmlFor="student-name">
                Họ và tên học sinh <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="student-name"
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Bảo"
                  className="block w-full pl-11 pr-4 py-2.5 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" htmlFor="student-class">
                Lớp <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <input
                  id="student-class"
                  type="text"
                  required
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="Ví dụ: 12A1 hoặc 9/3"
                  className="block w-full pl-11 pr-4 py-2.5 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                />
              </div>
            </div>

            {/* School Name (optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" htmlFor="student-school">
                Trường học (Tùy chọn)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <School className="w-5 h-5" />
                </div>
                <input
                  id="student-school"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ví dụ: THPT Chuyên Lê Hồng Phong"
                  className="block w-full pl-11 pr-4 py-2.5 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Exam Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" htmlFor="student-exam-password">
                Mật khẩu đề thi (Nếu giáo viên yêu cầu)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="student-exam-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu do giáo viên cấp"
                  className="block w-full pl-11 pr-12 py-2.5 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
                  <EyeToggleButton
                    isVisible={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    fieldLabel="mật khẩu đề thi"
                  />
                </div>
              </div>
            </div>

            {/* Enter Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 cursor-pointer text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Vào làm bài ngay</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
