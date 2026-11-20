import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-600 hover:bg-orange-700 text-white border border-transparent shadow-sm focus:ring-4 focus:ring-orange-500/25 disabled:bg-orange-300",
  secondary:
    "bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-200 focus:ring-4 focus:ring-orange-500/15 disabled:bg-orange-50 disabled:text-orange-400",
  outline:
    "bg-white hover:bg-orange-50 text-orange-600 border border-orange-300 focus:ring-4 focus:ring-orange-500/15 disabled:border-orange-200 disabled:text-orange-300",
  ghost:
    "bg-transparent hover:bg-orange-50 text-orange-700 border border-transparent focus:ring-4 focus:ring-orange-500/15 disabled:text-orange-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "py-1.5 px-3 text-xs rounded-lg",
  md: "py-2.5 px-4 text-sm rounded-lg",
  lg: "py-3 px-5 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    >
      {isLoading && (
        <svg
          className="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
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
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      <span>{isLoading ? (loadingText ?? children) : children}</span>
    </button>
  );
}
