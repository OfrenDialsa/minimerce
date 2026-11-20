"use client";

import React, { useState, forwardRef } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  isPassword?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      isPassword = false,
      type = "text",
      className = "",
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    let stateStyles =
      "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-gray-900";
    if (error) {
      stateStyles =
        "border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900 pr-10";
    } else if (success) {
      stateStyles =
        "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-900 pr-10";
    }

    if (isPassword && (error || success)) {
      stateStyles += " pr-16";
    } else if (isPassword) {
      stateStyles += " pr-10";
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            aria-invalid={!!error}
            className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${stateStyles} ${className}`}
            {...props}
          />

          <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
            {error && (
              <AlertCircle
                className="h-5 w-5 text-red-500 pointer-events-none"
                aria-hidden="true"
              />
            )}

            {!error && success && (
              <CheckCircle2
                className="h-5 w-5 text-emerald-500 pointer-events-none"
                aria-hidden="true"
              />
            )}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={disabled}
                className="text-gray-400 hover:text-gray-600 focus:outline-none disabled:cursor-not-allowed"
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {error ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : success ? (
          <p className="text-xs font-medium text-emerald-600">{success}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
