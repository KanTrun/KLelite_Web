import React from 'react';
import { motion } from 'framer-motion';
import { buttonTap, buttonHover } from '@/utils/animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import styles from './Button.module.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isFullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    isFullWidth ? styles.fullWidth : '',
    isLoading ? styles.loading : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || isLoading}
      whileHover={shouldReduceMotion || disabled || isLoading ? {} : buttonHover}
      whileTap={shouldReduceMotion || disabled || isLoading ? {} : buttonTap}
      {...props as any}
    >
      {isLoading && (
        <span className={styles.spinner}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {!isLoading && leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      <span className={styles.text}>{children}</span>
      {!isLoading && rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </motion.button>
  );
};

export default Button;

