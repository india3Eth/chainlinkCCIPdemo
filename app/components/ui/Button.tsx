'use client'
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '', 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
      disabled:opacity-50 disabled:cursor-not-allowed
      active:transform active:scale-95
      ${fullWidth ? 'w-full' : ''}
    `;

    const variantClasses = {
      primary: `
        bg-gradient-primary text-white shadow-lg
        hover:shadow-xl hover:scale-105
        focus:ring-blue-500
      `,
      secondary: `
        bg-gray-800 text-gray-100 border border-gray-700
        hover:bg-gray-700 hover:border-gray-600
        focus:ring-gray-500
      `,
      success: `
        bg-gradient-success text-white shadow-lg
        hover:shadow-xl hover:scale-105
        focus:ring-green-500
      `,
      warning: `
        bg-gradient-warning text-white shadow-lg
        hover:shadow-xl hover:scale-105
        focus:ring-yellow-500
      `,
      error: `
        bg-gradient-error text-white shadow-lg
        hover:shadow-xl hover:scale-105
        focus:ring-red-500
      `,
      ghost: `
        text-gray-300 hover:text-white hover:bg-gray-800
        focus:ring-gray-500
      `
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const combinedClasses = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `.trim();

    return (
      <button
        ref={ref}
        className={combinedClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className={`animate-spin -ml-1 mr-2 h-4 w-4`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        
        {children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;