'use client'
import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'md',
    dot = false,
    className = '', 
    ...props 
  }, ref) => {
    const baseClasses = `
      inline-flex items-center font-medium rounded-full
      transition-all duration-200
    `;

    const variantClasses = {
      default: `
        bg-gray-700 text-gray-200
      `,
      success: `
        bg-green-500/20 text-green-400 border border-green-500/30
      `,
      warning: `
        bg-yellow-500/20 text-yellow-400 border border-yellow-500/30
      `,
      error: `
        bg-red-500/20 text-red-400 border border-red-500/30
      `,
      info: `
        bg-blue-500/20 text-blue-400 border border-blue-500/30
      `
    };

    const sizeClasses = {
      sm: dot ? 'w-2 h-2' : 'px-2 py-1 text-xs',
      md: dot ? 'w-3 h-3' : 'px-3 py-1 text-sm',
      lg: dot ? 'w-4 h-4' : 'px-4 py-2 text-base'
    };

    const combinedClasses = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `.trim();

    if (dot) {
      return (
        <span
          ref={ref}
          className={combinedClasses}
          {...props}
        />
      );
    }

    return (
      <span
        ref={ref}
        className={combinedClasses}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;