import React, { useState } from 'react';
import { QuizSettings, RevealMode } from '../../types/quiz';
import { EyeToggleButton } from '../common/EyeToggleButton';
import { Settings, Lock, Clock, Award, Shuffle, Eye, HelpCircle } from 'lucide-react';

interface QuizSettingsFormProps {
  settings: QuizSettings;
  onChange: (updated: QuizSettings) => void;
}

export const QuizSettingsForm: React.FC<QuizSettingsFormProps> = ({ settings, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  const update = (partial: Partial<QuizSettings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <Settings className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-slate-800">Cài đặt đề thi &amp; Điều kiện làm bài</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Title */}
        <div className="md:col-span-3">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" htmlFor="quiz-title">
            Tên đề thi / Bài kiểm tra <span className="text-red-500">*</span>
          </label>
          <input
            id="quiz-title"
            type="text"
            required
            value={settings.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Ví dụ: Kiểm tra 1 tiết - Giữa Học Kỳ II - Môn Toán 12"
            className="w-full px-4 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" htmlFor="quiz-subject">
            Môn học
          </label>
          <input
            id="quiz-subject"
            type="text"
            value={settings.subject}
            onChange={(e) => update({ subject: e.target.value })}
            placeholder="Toán, Vật lý, Tiếng Anh, Hóa..."
            className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Grade */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" htmlFor="quiz-grade">
            Khối lớp
          </label>
          <select
            id="quiz-grade"
            value={settings.grade}
            onChange={(e) => update({ grade: e.target.value })}
            className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Chọn khối lớp</option>
            <option value="Lớp 6">Lớp 6</option>
            <option value="Lớp 7">Lớp 7</option>
            <option value="Lớp 8">Lớp 8</option>
            <option value="Lớp 9">Lớp 9</option>
            <option value="Lớp 10">Lớp 10</option>
            <option value="Lớp 11">Lớp 11</option>
            <option value="Lớp 12">Lớp 12</option>
            <option value="Khác">Khác / Ôn tập chung</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" htmlFor="quiz-duration">
            Thời gian làm bài (Phút)
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="quiz-duration"
              type="number"
              min={0}
              max={300}
              value={settings.durationMinutes}
              onChange={(e) => update({ durationMinutes: parseInt(e.target.value, 10) || 0 })}
              className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Nhập 0 nếu không giới hạn thời gian</span>
        </div>
      </div>

      {/* Password Setting with Eye Toggle */}
      <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">Cài đặt mật khẩu đề thi</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hasPassword}
              onChange={(e) => update({ hasPassword: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.hasPassword && (
          <div className="pt-2 animate-fadeIn">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="quiz-password">
              Mật khẩu bắt buộc học sinh phải nhập để vào làm bài
            </label>
            <div className="relative max-w-sm rounded-xl">
              <input
                id="quiz-password"
                type={showPassword ? 'text' : 'password'}
                value={settings.password || ''}
                onChange={(e) => update({ password: e.target.value })}
                placeholder="Ví dụ: thi2026 hoặc ktr_12a1"
                className="w-full pr-12 pl-4 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
                <EyeToggleButton
                  isVisible={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  fieldLabel="mật khẩu đề thi"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Chỉ những học sinh được thầy/cô cung cấp mật khẩu này mới có thể mở đề thi.
            </p>
          </div>
        )}
      </div>

      {/* Answer & Explanation Reveal Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-blue-50/40 border border-blue-100 rounded-2xl">
        {/* Reveal Answers */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-blue-900 uppercase">
            Chế độ công bố đáp án đúng
          </label>
          <select
            value={settings.revealAnswersMode}
            onChange={(e) => update({ revealAnswersMode: e.target.value as RevealMode })}
            className="w-full px-3 py-2 text-xs font-semibold bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="none">1. Không công bố đáp án</option>
            <option value="always">2. Công bố ngay sau khi nộp bài</option>
            <option value="score_threshold">3. Chỉ công bố khi đạt ngưỡng điểm tối thiểu</option>
          </select>

          {settings.revealAnswersMode === 'score_threshold' && (
            <div className="animate-fadeIn p-3 bg-white rounded-xl border border-blue-200">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Điểm tối thiểu để mở đáp án (Thang 10):
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={10}
                value={settings.minScoreToRevealAnswers}
                onChange={(e) => update({ minScoreToRevealAnswers: parseFloat(e.target.value) || 0 })}
                className="w-32 px-3 py-1.5 text-sm font-bold text-blue-700 border border-slate-300 rounded-lg"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Học sinh phải đạt từ <strong>{settings.minScoreToRevealAnswers} điểm</strong> trở lên mới được xem đáp án.
              </span>
            </div>
          )}
        </div>

        {/* Reveal Explanations */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-blue-900 uppercase">
            Chế độ công bố hướng dẫn giải chi tiết
          </label>
          <select
            value={settings.revealExplanationsMode}
            onChange={(e) => update({ revealExplanationsMode: e.target.value as RevealMode })}
            className="w-full px-3 py-2 text-xs font-semibold bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="none">1. Không công bố hướng dẫn giải</option>
            <option value="always">2. Công bố ngay sau khi nộp bài</option>
            <option value="score_threshold">3. Chỉ công bố khi đạt ngưỡng điểm riêng</option>
          </select>

          {settings.revealExplanationsMode === 'score_threshold' && (
            <div className="animate-fadeIn p-3 bg-white rounded-xl border border-blue-200">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Điểm tối thiểu để mở lời giải (Thang 10):
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={10}
                value={settings.minScoreToRevealExplanations}
                onChange={(e) => update({ minScoreToRevealExplanations: parseFloat(e.target.value) || 0 })}
                className="w-32 px-3 py-1.5 text-sm font-bold text-indigo-700 border border-slate-300 rounded-lg"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Học sinh phải đạt từ <strong>{settings.minScoreToRevealExplanations} điểm</strong> trở lên mới được xem lời giải chi tiết.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Toggles: Shuffle & Attempts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
          <input
            type="checkbox"
            checked={settings.shuffleQuestions}
            onChange={(e) => update({ shuffleQuestions: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-700">Trộn thứ tự câu hỏi</span>
        </label>

        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
          <input
            type="checkbox"
            checked={settings.shuffleOptions}
            onChange={(e) => update({ shuffleOptions: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-700">Trộn thứ tự phương án (A, B, C, D)</span>
        </label>

        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
          <input
            type="checkbox"
            checked={settings.allowRetake}
            onChange={(e) => update({ allowRetake: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-700">Cho phép học sinh làm lại bài</span>
        </label>
      </div>
    </div>
  );
};
