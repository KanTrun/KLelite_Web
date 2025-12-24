// ============================================
// ProductList Skeleton Loading Component
// Matches the ProductCard grid layout
// ============================================

import React from 'react';
import { Skeleton } from '../Skeleton';
import styles from './ProductListSkeleton.module.scss';

export interface ProductListSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export const ProductListSkeleton: React.FC<ProductListSkeletonProps> = ({
  count = 8,
  viewMode = 'grid',
}) => {
  return (
    <div className={`${styles.skeletonGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className={styles.skeletonCard}>
          {/* Image */}
          <div className={styles.imageWrapper}>
            <Skeleton variant="rectangular" width="100%" height="100%" animation="shimmer" />
          </div>

          {/* Content */}
          <div className={styles.content}>
            {/* Category */}
            <Skeleton variant="text" width="30%" height={12} className={styles.category} />

            {/* Title */}
            <Skeleton variant="text" width="80%" height={20} className={styles.title} />

            {/* Rating */}
            <div className={styles.ratingRow}>
              <Skeleton variant="rounded" width={80} height={14} />
              <Skeleton variant="text" width={60} height={12} />
            </div>

            {/* Price */}
            <div className={styles.priceRow}>
              <Skeleton variant="text" width={100} height={24} />
              <Skeleton variant="text" width={60} height={14} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default ProductListSkeleton;
