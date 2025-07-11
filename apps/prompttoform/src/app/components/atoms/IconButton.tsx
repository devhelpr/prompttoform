import type { ReactNode } from 'react'

export interface IconButtonProps {
  children: ReactNode;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'subtle';
  as?: 'button' | 'div';
}

export function IconButton({ 
  children, 
  icon, 
  onClick, 
  disabled = false,
  variant = 'default',
  as: Component = 'button'
}: IconButtonProps) {
  const baseClasses = "inline-flex items-center gap-2 transition-all duration-300";
  const variantClasses = variant === 'default' 
    ? "px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
    : "px-4 py-2 rounded-lg text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-600";

  return (
    <Component
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses}`}
    >
      {icon}
      {children}
    </Component>
  );
} 