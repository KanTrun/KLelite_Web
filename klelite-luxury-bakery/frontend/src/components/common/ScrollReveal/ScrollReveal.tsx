import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { fadeInUp, fadeInLeft, fadeInRight } from '@/utils/animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import styles from './ScrollReveal.module.scss';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight';
  delay?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = 'fadeInUp',
  delay = 0,
  className = '',
  threshold = 0.2,
  once = true
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: threshold, once });
  const reducedMotion = useReducedMotion();

  // Select variant based on prop
  const getVariant = () => {
    switch (variant) {
      case 'fadeInLeft': return fadeInLeft;
      case 'fadeInRight': return fadeInRight;
      default: return fadeInUp;
    }
  };

  // If reduced motion is enabled, render without animation or simplified
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const selectedVariant = getVariant();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={selectedVariant}
      transition={{
        delay: delay,
        duration: 0.6,
        ease: "easeOut"
      }}
      className={`${styles.scrollReveal} ${className}`}
    >
      {children}
    </motion.div>
  );
};
