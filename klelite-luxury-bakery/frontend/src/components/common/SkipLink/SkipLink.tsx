import React from 'react';
import styles from './SkipLink.module.scss';

export const SkipLink: React.FC = () => {
  return (
    <a href="#main-content" className={styles.skipLink}>
      Nhảy tới nội dung chính
    </a>
  );
};
