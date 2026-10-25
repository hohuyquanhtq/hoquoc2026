import React, { useState, useRef } from 'react';
import { extractTextFromDocx, parseExamContent, ParseResult, SAMPLE_EXAM_TEXT } from '../../services/parserService';
import { FileUp, FileText, Sparkles, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface WordUploaderProps {
  onParsed: (result: ParseResult) => void;
}

export const WordUploader: React.FC<WordUploaderProps> = ({ onParsed }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [lastStats, setLastStats] = useState<ParseResult['stats'] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processText = (text: string) => {
    setErrorMsg(null);
    try {
      const result = parseExamContent(text);
      if (!result.success || result.questions.length === 0) {
        setErrorMsg('Không tìm thấy câu hỏi hợp lệ trong nội dung. Vui lòng đảm bảo các câu hỏi bắt đầu bằng "Câu 1.", "Câu 2." và có các phương án "A.", "B.", "C.", "D."');
        return;
      }
      setLastStats(result.stats);
      onParsed(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi phân tích nội dung câu hỏi.');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.txt')) {
      setErrorMsg('Vui lòng chọn file định dạng Microsoft Word (.docx) hoặc file văn bản (.txt).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (file.name.toLowerCase().endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const extractedText = await extractTextFromDocx(arrayBuffer);
        processText(extractedText);
      } else {
        const text = await file.text();
        processText(text);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể trích xuất nội dung từ file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleUseSample = () => {
    setPastedText(SAMPLE_EXAM_TEXT);
    processText(SAMPLE_EXAM_TEXT);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileUp className="w-5 h-5 text-blue-600" />
            <span>Tải đề thi từ file Word (.docx)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Hỗ trợ cấu trúc chuẩn: Câu 1, phương án A, B, C, D, Đáp án, Hướng dẫn giải
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseSample}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto border border-indigo-200/60"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Thử ngay với Đề thi mẫu</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'upload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Tải file Word (.docx)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'paste'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Dán nội dung văn bản
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: Upload File */}
      {activeTab === 'upload' && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".docx,.txt"
            className="hidden"
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/70'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-700">Đang trích xuất câu hỏi từ file Word...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-blue-100/70 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    Kéo thả file <span className="text-blue-600">.docx</span> vào đây hoặc{' '}
                    <span className="text-blue-600 underline">chọn từ máy tính</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hỗ trợ định dạng đề thi THCS, THPT chuẩn bộ Giáo dục &amp; Đào tạo
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Paste Text */}
      {activeTab === 'paste' && (
        <div className="space-y-4">
          <textarea
            rows={10}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`Dán nội dung đề thi vào đây, ví dụ:\n\nCâu 1. Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. TP. Hồ Chí Minh\nC. Đà Nẵng\nD. Hải Phòng\nĐáp án: A\nHướng dẫn giải: Hà Nội là thủ đô của Việt Nam.`}
            className="w-full p-4 border border-slate-200 rounded-xl font-mono text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => processText(pastedText)}
              disabled={!pastedText.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition cursor-pointer shadow-sm"
            >
              Phân tích câu hỏi
            </button>
          </div>
        </div>
      )}

      {/* Stats summary of parsed questions */}
      {lastStats && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-800 font-bold mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Đã phân tích thành công {lastStats.total} câu hỏi!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Đơn chọn (1 ĐA):</span>
              <strong className="text-slate-800 text-sm">{lastStats.singleChoice}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Đa chọn (Nhiều ĐA):</span>
              <strong className="text-slate-800 text-sm">{lastStats.multipleChoice}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Đúng / Sai:</span>
              <strong className="text-slate-800 text-sm">{lastStats.trueFalse}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Trả lời ngắn:</span>
              <strong className="text-slate-800 text-sm">{lastStats.shortAnswer}</strong>
            </div>
            <div className={`bg-white p-2.5 rounded-xl border ${lastStats.missingAnswer > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-emerald-100'}`}>
              <span className="text-slate-500 block">Chưa có đáp án:</span>
              <strong className={`text-sm ${lastStats.missingAnswer > 0 ? 'text-amber-600 font-bold' : 'text-slate-800'}`}>
                {lastStats.missingAnswer} câu
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Formatting Guide Info */}
      <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 space-y-2 border border-slate-200/60">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Quy cách cấu trúc đề thi được hỗ trợ tối ưu:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Bắt đầu câu hỏi:</strong> <code>Câu 1.</code> hoặc <code>Câu 1:</code>, <code>Bài 1.</code></li>
          <li><strong>Các phương án:</strong> <code>A.</code>, <code>B.</code>, <code>C.</code>, <code>D.</code> mỗi phương án trên 1 dòng riêng.</li>
          <li><strong>Đáp án:</strong> <code>Đáp án: B</code> hoặc <code>Đáp án đúng: A, C</code> hoặc <code>Đáp án: a) Đ; b) S; c) Đ; d) Đ</code></li>
          <li><strong>Lời giải chi tiết:</strong> <code>Hướng dẫn giải:</code> hoặc <code>Lời giải:</code> đặt ở cuối câu hỏi.</li>
        </ul>
      </div>
    </div>
  );
};
