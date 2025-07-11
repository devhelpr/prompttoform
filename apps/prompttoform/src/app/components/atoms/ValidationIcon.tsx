interface ValidationIconProps {
  isValid: boolean;
  className?: string;
}

export function ValidationIcon({ isValid, className = '' }: ValidationIconProps) {
  if (isValid) {
    return (
      <svg className={`w-8 h-8 text-teal-500 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  return (
    <svg className={`w-8 h-8 text-rose-500 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
} 