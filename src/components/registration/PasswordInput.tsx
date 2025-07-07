import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
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
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full px-4 py-3 text-base md:text-lg rounded-lg border-2 pr-12 
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
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2
            text-gray-500 hover:text-purple-600 transition-colors"
        >
          {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
        </button>
      </div>

      {error && (
        <p className="text-sm md:text-base text-red-600 mt-1 font-medium">{error}</p>
      )}

      {isFocused && (
        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-100 shadow-sm">
          <h4 className="text-sm md:text-base font-medium text-gray-900 mb-3">
            Password Requirements:
          </h4>
          <ul className="space-y-2">
            {passwordRequirements.map((requirement, index) => (
              <li
                key={index}
                className="flex items-center text-sm md:text-base"
              >
                {requirement.test(value) ? (
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                ) : (
                  <X className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
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