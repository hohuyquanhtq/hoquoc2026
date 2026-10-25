import React from 'react';
import { Question, QuestionOption, QuestionType } from '../../types/quiz';
import { Trash2, ArrowUp, ArrowDown, Plus, AlertCircle, Check, HelpCircle } from 'lucide-react';

interface QuestionItemEditorProps {
  question: Question;
  index: number;
  totalQuestions: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const QuestionItemEditor: React.FC<QuestionItemEditorProps> = ({
  question,
  index,
  totalQuestions,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const isMissingAnswer =
    !question.correctAnswer ||
    (Array.isArray(question.correctAnswer) && question.correctAnswer.length === 0) ||
    question.correctAnswer === '';

  const handleTypeChange = (newType: QuestionType) => {
    let newOptions = question.options;
    let newAns: any = '';

    if (newType === 'single_choice' || newType === 'multiple_choice') {
      if (newOptions.length === 0) {
        newOptions = [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ];
      }
      newAns = newType === 'single_choice' ? 'A' : ['A'];
    } else if (newType === 'true_false') {
      newOptions = [
        { id: 'a', text: 'Ý kiến a' },
        { id: 'b', text: 'Ý kiến b' },
        { id: 'c', text: 'Ý kiến c' },
        { id: 'd', text: 'Ý kiến d' },
      ];
      newAns = 'a) Đ; b) S; c) Đ; d) S';
    } else if (newType === 'short_answer') {
      newOptions = [];
      newAns = '';
    }

    onChange({
      ...question,
      type: newType,
      options: newOptions,
      correctAnswer: newAns,
    });
  };

  const handleOptionTextChange = (optId: string, text: string) => {
    const updatedOptions = question.options.map(opt =>
      opt.id === optId ? { ...opt, text } : opt
    );
    onChange({ ...question, options: updatedOptions });
  };

  const handleAddOption = () => {
    const nextLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextId = nextLetters[question.options.length] || `OPT${question.options.length + 1}`;
    onChange({
      ...question,
      options: [...question.options, { id: nextId, text: '' }],
    });
  };

  const handleRemoveOption = (optId: string) => {
    const updatedOptions = question.options.filter(opt => opt.id !== optId);
    let updatedAns = question.correctAnswer;
    if (question.type === 'single_choice' && updatedAns === optId) {
      updatedAns = updatedOptions[0]?.id || '';
    } else if (question.type === 'multiple_choice' && Array.isArray(updatedAns)) {
      updatedAns = updatedAns.filter(a => a !== optId);
    }
    onChange({
      ...question,
      options: updatedOptions,
      correctAnswer: updatedAns,
    });
  };

  const toggleSingleChoiceAnswer = (optId: string) => {
    onChange({ ...question, correctAnswer: optId });
  };

  const toggleMultipleChoiceAnswer = (optId: string) => {
    const current = Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : [];
    const exists = current.includes(optId);
    const updated = exists ? current.filter(x => x !== optId) : [...current, optId];
    onChange({ ...question, correctAnswer: updated });
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
        isMissingAnswer
          ? 'border-amber-300 ring-2 ring-amber-100'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Question Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm">
            {index + 1}
          </span>
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="single_choice">Trắc nghiệm 1 đáp án</option>
            <option value="multiple_choice">Trắc nghiệm nhiều đáp án</option>
            <option value="true_false">Đúng / Sai 4 ý (a, b, c, d)</option>
            <option value="short_answer">Điền khuyết / Trả lời ngắn</option>
          </select>

          {isMissingAnswer && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Chưa chọn đáp án đúng
            </span>
          )}
        </div>

        {/* Action buttons: Move, Delete */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            title="Di chuyển lên"
            className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={index === totalQuestions - 1}
            onClick={onMoveDown}
            title="Di chuyển xuống"
            className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Xóa câu hỏi này"
            className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition cursor-pointer ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Content Input */}
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
            Nội dung câu hỏi <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={question.content}
            onChange={(e) => onChange({ ...question, content: e.target.value })}
            placeholder="Nhập nội dung câu hỏi..."
            className="w-full p-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Options for Single and Multiple choice */}
        {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Các phương án lựa chọn (Nhấn vào chữ cái để chọn đáp án đúng):</span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm phương án
              </button>
            </div>

            <div className="space-y-2">
              {question.options.map((opt) => {
                const isSelected =
                  question.type === 'single_choice'
                    ? question.correctAnswer === opt.id
                    : Array.isArray(question.correctAnswer) && question.correctAnswer.includes(opt.id);

                return (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        question.type === 'single_choice'
                          ? toggleSingleChoiceAnswer(opt.id)
                          : toggleMultipleChoiceAnswer(opt.id)
                      }
                      title={`Đánh dấu ${opt.id} là đáp án đúng`}
                      className={`w-9 h-9 shrink-0 rounded-xl font-bold text-sm flex items-center justify-center transition cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : opt.id}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                      placeholder={`Nội dung phương án ${opt.id}...`}
                      className={`flex-1 px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        isSelected ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-white'
                      }`}
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Xóa phương án này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* True/False format */}
        {question.type === 'true_false' && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block">
              Các mệnh đề Đúng / Sai và Đáp án chuẩn:
            </span>
            <div className="space-y-2">
              {question.options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="w-7 text-center font-bold text-slate-600 text-sm">{opt.id})</span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                    placeholder={`Nội dung mệnh đề ${opt.id}...`}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Đáp án chuẩn dạng text:
              </label>
              <input
                type="text"
                value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                placeholder="Ví dụ: a) Đ; b) S; c) Đ; d) Đ"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        )}

        {/* Short answer format */}
        {question.type === 'short_answer' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Đáp án chuẩn (Chính xác để chấm điểm tự động) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
              onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
              placeholder="Nhập giá trị đáp án chính xác (ví dụ: 12.5 hoặc Hà Nội)..."
              className="w-full px-3.5 py-2 text-sm font-semibold text-emerald-800 border border-emerald-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Explanation guidance */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
            Hướng dẫn giải chi tiết (Chỉ học sinh đạt điều kiện mới được xem)
          </label>
          <textarea
            rows={2}
            value={question.explanation || ''}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            placeholder="Lời giải chi tiết hoặc giải thích phương án đúng..."
            className="w-full p-2.5 text-xs text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
