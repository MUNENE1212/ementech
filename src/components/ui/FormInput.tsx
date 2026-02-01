import React, { forwardRef, useId } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Form input component with validation states
 * WCAG 2.2 AA compliant with proper ARIA attributes
 * Touch target minimum 48px height
 *
 * @param label - Accessible label for the input
 * @param error - Error message to display
 * @param success - Show success state
 * @param helperText - Additional guidance text
 * @param leftIcon - Icon inside left side of input
 * @param rightIcon - Icon inside right side of input
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, success, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-dark-200 dark:text-dark-300 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 rounded-lg border transition-all duration-200
              ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              ${hasSuccess ? 'border-accent-500 focus:ring-accent-500 focus:border-accent-500' : ''}
              ${!hasError && !hasSuccess ? 'border-dark-700 focus:ring-primary-500 focus:border-primary-500' : ''}
              bg-dark-800
              text-dark-100
              placeholder-dark-400
              focus:outline-none focus:ring-2
              min-h-[48px]
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-required={props.required ? 'true' : 'false'}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : success ? `${inputId}-success` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-dark-400">
              {rightIcon}
            </div>
          )}

          {hasSuccess && !rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-accent-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {hasError && (
          <p id={`${inputId}-error`} className="mt-2 text-sm text-red-500 flex items-center" role="alert">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {hasSuccess && !hasError && (
          <p id={`${inputId}-success`} className="mt-2 text-sm text-accent-500 flex items-center" role="status">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            This field is valid
          </p>
        )}

        {helperText && !hasError && !hasSuccess && (
          <p id={`${inputId}-helper`} className="mt-2 text-sm text-dark-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
