'use client'
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    onRightIconClick,
    className = '',
    ...props 
  }, ref) => {
    const hasError = !!error;
    const hasSuccess = !!success;

    const inputClasses = `
      block w-full px-4 py-3 rounded-lg
      bg-gray-800/50 border backdrop-blur-sm
      text-white placeholder-gray-400
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
      ${hasError 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
        : hasSuccess
          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
          : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'
      }
      ${leftIcon ? 'pl-12' : ''}
      ${rightIcon ? 'pr-12' : ''}
      ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `.trim();

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
          
          {rightIcon && (
            <div 
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'
              }`}
              onClick={onRightIconClick}
            >
              <span className="text-gray-400 hover:text-gray-300 transition-colors">
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {(error || success || helperText) && (
          <div className="text-sm">
            {error && (
              <p className="text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </p>
            )}
            {helperText && !error && !success && (
              <p className="text-gray-400">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;