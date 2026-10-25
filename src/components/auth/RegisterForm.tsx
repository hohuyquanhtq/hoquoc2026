import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EyeToggleButton } from '../common/EyeToggleButton';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const { registerTeacher, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Họ và tên không được để trống.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Địa chỉ email không đúng định dạng.';
    }
    if (password.length < 8) {
      return 'Mật khẩu phải có tối thiểu 8 ký tự.';
    }
    if (password !== confirmPassword) {
      return 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLoading(true);
    try {
      await registerTeacher(name.trim(), email.trim(), password);
      setSuccessMessage('Đăng ký tài khoản giáo viên thành công! Đang chuyển hướng...');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      // Error is set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-3 backdrop-blur-xs">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">ĐĂNG KÝ TÀI KHOẢN GIÁO VIÊN</h2>
        <p className="text-blue-100 text-sm mt-1">
          Tạo tài khoản miễn phí để biên soạn và quản lý kỳ thi trắc nghiệm
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {displayError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 leading-relaxed">
              <span>{displayError}</span>
              {displayError.includes('Firebase Console') && (
                <div className="mt-2 text-xs text-red-600 font-medium">
                  Gợi ý: Thầy/cô có thể nhấn quay lại Đăng nhập và chọn <strong>Đăng nhập bằng Google</strong> để sử dụng ngay mà không cần cấu hình email.
                </div>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="register-name">
              Họ và tên giáo viên <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="register-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Thầy/Cô: Nguyễn Văn A"
                className="block w-full pl-11 pr-4 py-2.5 text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="register-email">
              Địa chỉ email <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@truong.edu.vn"
                className="block w-full pl-11 pr-4 py-2.5 text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
              />
            </div>
          </div>

          {/* Password with Eye Toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="register-password">
              Mật khẩu (tối thiểu 8 ký tự) <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tạo mật khẩu an toàn"
                className="block w-full pl-11 pr-12 py-2.5 text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
              />
              <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
                <EyeToggleButton
                  isVisible={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  fieldLabel="mật khẩu"
                />
              </div>
            </div>
          </div>

          {/* Confirm Password with separate Eye Toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="register-confirm-password">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại chính xác mật khẩu trên"
                className="block w-full pl-11 pr-12 py-2.5 text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
              />
              <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
                <EyeToggleButton
                  isVisible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  fieldLabel="mật khẩu xác nhận"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Tạo tài khoản</span>
              </>
            )}
          </button>
        </form>

        {/* Footer switch back to login */}
        <div className="mt-8 text-center pt-5 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
