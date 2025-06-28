import React from "react";
import "./loading.css"; // Import the CSS file for styling

interface LoadingProps {
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'chain' | 'pulse';
  text?: string;
}

const Loading = ({ isLoading, size = 'md', variant = 'chain', text }: LoadingProps) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md', 
    lg: 'loading-lg'
  };

  const variantClasses = {
    default: 'loading-circle',
    chain: 'loading-chain',
    pulse: 'loading-pulse'
  };

  return (
    <div className="loading-container">
      <div className={`loading-wrapper ${sizeClasses[size]}`}>
        {variant === 'chain' ? (
          <div className="chain-loading">
            <div className="chain-link chain-link-1"></div>
            <div className="chain-link chain-link-2"></div>
            <div className="chain-link chain-link-3"></div>
            <div className="chain-connector"></div>
          </div>
        ) : variant === 'pulse' ? (
          <div className="pulse-loading">
            <div className="pulse-dot pulse-dot-1"></div>
            <div className="pulse-dot pulse-dot-2"></div>
            <div className="pulse-dot pulse-dot-3"></div>
          </div>
        ) : (
          <div className={variantClasses[variant]}></div>
        )}
        {text && <div className="loading-text">{text}</div>}
      </div>
    </div>
  );
};

export default Loading;