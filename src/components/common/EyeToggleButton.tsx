import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface EyeToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
  fieldLabel?: string;
}

export const EyeToggleButton: React.FC<EyeToggleButtonProps> = ({
  isVisible,
  onToggle,
  className = '',
  fieldLabel = 'mật khẩu',
}) => {
  const ariaLabel = isVisible ? `Ẩn ${fieldLabel}` : `Hiện ${fieldLabel}`;
  const title = isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';

  return (
    <button
      type="button"
      onClick={(e) => {
        // Prevent form submission or losing input focus
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={ariaLabel}
      title={title}
      className={`p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-indigo-600 transition-colors rounded-md ${className}`}
    >
      {isVisible ? (
        <EyeOff className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Eye className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
};
