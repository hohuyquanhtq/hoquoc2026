import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EyeToggleButton } from '../common/EyeToggleButton';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onOpenForgotPassword: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onOpenForgotPassword,
  onSuccess,
}) => {
  const { loginTeacher, loginWithGoogle, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Vui lòng nhập địa chỉ email giáo viên.');
      return;
    }
    if (!password) {
      setLocalError('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await loginTeacher(email.trim(), password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    setLocalError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Error handled in context
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
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">ĐĂNG NHẬP GIÁO VIÊN</h2>
        <p className="text-blue-100 text-sm mt-1">
          Hệ thống QUIZ PRO – Quản lý ngân hàng đề &amp; tổ chức thi trực tuyến
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
                  Gợi ý: Thầy/cô có thể đăng nhập tức thì bằng nút <strong>Đăng nhập với Google</strong> bên dưới trong khi chờ bật Email/Password.
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="login-email">
              Email công tác / cá nhân <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="thayco@truong.edu.vn"
                className="block w-full pl-11 pr-4 py-2.5 text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
              />
            </div>
          </div>

          {/* Password field with Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="login-password">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của thầy/cô"
                className="block w-full pl-11 pr-12 py-2.5 text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
              />
              <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
                <EyeToggleButton
                  isVisible={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  fieldLabel="mật khẩu đăng nhập"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-medium">Hoặc tiếp tục với</span>
          </div>
        </div>

        {/* Google Login button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Đăng nhập nhanh với Google</span>
        </button>

        {/* Footer switch to register */}
        <div className="mt-8 text-center pt-5 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Đăng ký ngay <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
