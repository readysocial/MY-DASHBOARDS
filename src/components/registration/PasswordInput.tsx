import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  confirmPassword?: string;
  onConfirmChange?: (value: string) => void;
  error?: string;
  confirmError?: string;
  showConfirm?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (value: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    test: (value) => value.length >= 8,
  },
  {
    label: 'Contains uppercase letter',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    label: 'Contains lowercase letter',
    test: (value) => /[a-z]/.test(value),
  },
  {
    label: 'Contains number',
    test: (value) => /[0-9]/.test(value),
  },
  {
    label: 'Contains special character',
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
  },
];

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  confirmPassword = '',
  onConfirmChange,
  error,
  confirmError,
  showConfirm = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border-2 pr-10 sm:pr-12 
            transition-all duration-200 bg-white text-gray-900 placeholder-gray-500
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
              : 'border-purple-200 focus:border-purple-500 focus:ring-purple-200'
            }
            focus:outline-none focus:ring-4 shadow-sm
            hover:border-purple-300`}
          placeholder="Enter your password"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2
            text-gray-500 hover:text-purple-600 transition-colors"
        >
          {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
        </button>
      </div>

      {error && (
        <p className="text-xs sm:text-sm text-red-600 mt-1 font-medium">{error}</p>
      )}

      {showConfirm && (
        <div className="relative mt-2 sm:mt-3">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onConfirmChange?.(e.target.value)}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border-2 pr-10 sm:pr-12 
              transition-all duration-200 bg-white text-gray-900 placeholder-gray-500
              ${confirmError 
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                : 'border-purple-200 focus:border-purple-500 focus:ring-purple-200'
              }
              focus:outline-none focus:ring-4 shadow-sm
              hover:border-purple-300`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2
              text-gray-500 hover:text-purple-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      )}

      {confirmError && (
        <p className="text-xs sm:text-sm text-red-600 mt-1 font-medium">{confirmError}</p>
      )}

      {isFocused && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white rounded-lg border-2 border-purple-100 shadow-sm">
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">
            Password Requirements:
          </h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {passwordRequirements.map((requirement, index) => (
              <li
                key={index}
                className="flex items-center text-xs sm:text-sm"
              >
                {requirement.test(value) ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-1.5 sm:mr-2 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-1.5 sm:mr-2 flex-shrink-0" />
                )}
                <span className={`${
                  requirement.test(value) 
                    ? 'text-green-700 font-medium' 
                    : 'text-gray-700'
                }`}>
                  {requirement.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 