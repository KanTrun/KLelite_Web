import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '@/contexts';
import styles from './ThemeToggle.module.scss';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className={`${styles.toggle} ${className || ''}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
    >
      <span className={`${styles.iconWrapper} ${isDark ? styles.dark : styles.light}`}>
        <FiSun className={styles.sunIcon} />
        <FiMoon className={styles.moonIcon} />
      </span>
    </button>
  );
};

export default ThemeToggle;
