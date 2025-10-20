import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  className = '',
  ...props
}) => {
  const inputClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm text-sm
    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
    ${error 
      ? 'border-red-300 text-red-900 placeholder-red-300' 
      : 'border-gray-300 text-gray-900 placeholder-gray-400'
    }
    ${className}
  `;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};