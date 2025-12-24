// ============================================
// ProductDetail Skeleton Loading Component
// Matches the ProductDetail page layout
// ============================================

import React from 'react';
import { Skeleton } from '../Skeleton';
import styles from './ProductDetailSkeleton.module.scss';

export interface ProductDetailSkeletonProps {
  className?: string;
}

export const ProductDetailSkeleton: React.FC<ProductDetailSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div className={`${styles.skeletonWrapper} ${className}`}>
      {/* Breadcrumb Skeleton */}
      <div className={styles.breadcrumbSkeleton}>
        <Skeleton variant="text" width={60} height={14} />
        <span className={styles.separator}>/</span>
        <Skeleton variant="text" width={80} height={14} />
        <span className={styles.separator}>/</span>
        <Skeleton variant="text" width={120} height={14} />
      </div>

      <div className={styles.productGrid}>
        {/* Gallery Section */}
        <div className={styles.gallerySection}>
          {/* Main Image */}
          <div className={styles.mainImage}>
            <Skeleton variant="rectangular" width="100%" height="100%" animation="shimmer" />
          </div>

          {/* Thumbnails */}
          <div className={styles.thumbnails}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                width={80}
                height={80}
                animation="shimmer"
              />
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          {/* Category Tag */}
          <Skeleton variant="rounded" width={120} height={24} className={styles.categoryTag} />

          {/* Title */}
          <Skeleton variant="text" width="80%" height={36} className={styles.title} />

          {/* Rating */}
          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} variant="circular" width={18} height={18} />
              ))}
            </div>
            <Skeleton variant="text" width={40} height={16} />
            <Skeleton variant="text" width={80} height={16} />
          </div>

          {/* Price */}
          <div className={styles.priceSection}>
            <Skeleton variant="text" width={140} height={40} />
            <Skeleton variant="text" width={90} height={20} />
          </div>

          {/* Description */}
          <div className={styles.description}>
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="90%" height={16} />
            <Skeleton variant="text" width="75%" height={16} />
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <Skeleton variant="text" width="100%" height={1} />
          </div>

          {/* Size Options */}
          <div className={styles.optionGroup}>
            <Skeleton variant="text" width={80} height={16} className={styles.label} />
            <div className={styles.sizeOptions}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" width={100} height={48} />
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className={styles.optionGroup}>
            <Skeleton variant="text" width={60} height={16} className={styles.label} />
            <div className={styles.quantitySelector}>
              <Skeleton variant="rounded" width={120} height={44} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Skeleton variant="rounded" width="70%" height={52} />
            <Skeleton variant="circular" width={52} height={52} />
            <Skeleton variant="circular" width={52} height={52} />
          </div>

          {/* Features Grid */}
          <div className={styles.featuresGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.featureCard}>
                <Skeleton variant="circular" width={40} height={40} />
                <div className={styles.featureContent}>
                  <Skeleton variant="text" width={100} height={14} />
                  <Skeleton variant="text" width={80} height={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className={styles.tabsSection}>
        <div className={styles.tabHeaders}>
          <Skeleton variant="rounded" width={140} height={40} />
          <Skeleton variant="rounded" width={180} height={40} />
          <Skeleton variant="rounded" width={120} height={40} />
        </div>
        <div className={styles.tabContent}>
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="95%" height={16} />
          <Skeleton variant="text" width="85%" height={16} />
          <Skeleton variant="text" width="90%" height={16} />
          <Skeleton variant="text" width="70%" height={16} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
