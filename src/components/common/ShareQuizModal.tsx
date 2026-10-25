import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Quiz } from '../../types/quiz';
import { X, Copy, Check, QrCode, Share2, KeyRound, ExternalLink } from 'lucide-react';

interface ShareQuizModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareQuizModal: React.FC<ShareQuizModalProps> = ({ quiz, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!isOpen || !quiz) return null;

  const currentOrigin = window.location.origin;
  const examUrl = `${currentOrigin}/#quiz=${quiz.publicCode}`;

  useEffect(() => {
    if (examUrl) {
      QRCode.toDataURL(examUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [examUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(examUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPassword = () => {
    if (quiz.password) {
      navigator.clipboard.writeText(quiz.password);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleCopyNotice = () => {
    const noticeText = `📢 THÔNG BÁO BÀI KIỂM TRA TRỰC TUYẾN
📝 Đề thi: ${quiz.title}
📚 Môn: ${quiz.subject || 'Chung'} | Lớp: ${quiz.grade || 'Tất cả'}
⏱ Thời gian làm bài: ${quiz.durationMinutes > 0 ? `${quiz.durationMinutes} phút` : 'Tự do'}
🔗 Đường link vào thi: ${examUrl}
🔑 Mã đề thi: ${quiz.publicCode}
${quiz.hasPassword && quiz.password ? `🔐 Mật khẩu làm bài: ${quiz.password}\n` : ''}
👉 Các em học sinh nhấp vào đường link trên máy tính hoặc điện thoại, khai báo Họ tên, Lớp và làm bài nghiêm túc! Chúc các em đạt kết quả cao!`;

    navigator.clipboard.writeText(noticeText);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Share2 className="w-5 h-5" />
            <span>Phát hành đề thi cho học sinh</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Quiz summary info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-base mb-1">{quiz.title}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
              <span>Môn: <strong className="text-slate-800">{quiz.subject || 'Chung'}</strong></span>
              <span>Lớp: <strong className="text-slate-800">{quiz.grade || 'Tất cả'}</strong></span>
              <span>Số câu: <strong className="text-slate-800">{quiz.questionCount} câu</strong></span>
              <span>Thời gian: <strong className="text-slate-800">{quiz.durationMinutes > 0 ? `${quiz.durationMinutes} phút` : 'Tự do'}</strong></span>
            </div>
          </div>

          {/* QR Code and link */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
            {qrDataUrl && (
              <div className="bg-white p-2.5 rounded-xl shadow-xs border border-blue-100 shrink-0 text-center">
                <img src={qrDataUrl} alt="QR Code đề thi" className="w-36 h-36 mx-auto rounded-lg" />
                <span className="text-[11px] font-semibold text-blue-700 mt-1 block">Quét bằng camera điện thoại</span>
              </div>
            )}
            <div className="space-y-3 flex-1 w-full">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Đường link thi trực tuyến
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={examUrl}
                    className="flex-1 text-xs font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {quiz.hasPassword && quiz.password && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Mật khẩu làm bài
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="flex-1 font-mono text-sm font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-blue-700">
                      {quiz.password}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition cursor-pointer shrink-0"
                    >
                      {copiedPass ? <Check className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
                      <span>{copiedPass ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Broadcast message copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-800">
                Tin nhắn mẫu gửi phụ huynh / học sinh
              </label>
              <button
                type="button"
                onClick={handleCopyNotice}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                {copiedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Đã sao chép toàn bộ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép toàn bộ</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-line select-all">
              {`📢 THÔNG BÁO BÀI KIỂM TRA TRỰC TUYẾN
📝 Đề thi: ${quiz.title}
📚 Môn: ${quiz.subject || 'Chung'} | Lớp: ${quiz.grade || 'Tất cả'}
⏱ Thời gian làm bài: ${quiz.durationMinutes > 0 ? `${quiz.durationMinutes} phút` : 'Tự do'}
🔗 Đường link vào thi: ${examUrl}
🔑 Mã đề thi: ${quiz.publicCode}
${quiz.hasPassword && quiz.password ? `🔐 Mật khẩu làm bài: ${quiz.password}\n` : ''}👉 Các em học sinh nhấp vào link để làm bài!`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <a
            href={examUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>Mở trang thi thử nghiệm</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
