// ============================================
// KL'élite Skeleton Loading Component
// Reusable skeleton with shimmer animation
// ============================================

import React from 'react';
import styles from './Skeleton.module.scss';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

export interface SkeletonProps {
  /** Width of the skeleton (CSS value or number for pixels) */
  width?: string | number;
  /** Height of the skeleton (CSS value or number for pixels) */
  height?: string | number;
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Animation type */
  animation?: 'shimmer' | 'pulse' | 'none';
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton lines to render (for text variant) */
  count?: number;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

const formatDimension = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  animation = 'shimmer',
  className = '',
  count = 1,
  style,
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return styles.circular;
      case 'rectangular':
        return styles.rectangular;
      case 'rounded':
        return styles.rounded;
      case 'text':
      default:
        return styles.text;
    }
  };

  const getAnimationClass = () => {
    switch (animation) {
      case 'pulse':
        return styles.pulse;
      case 'none':
        return '';
      case 'shimmer':
      default:
        return styles.shimmer;
    }
  };

  const skeletonStyle: React.CSSProperties = {
    width: formatDimension(width),
    height: formatDimension(height),
    ...style,
  };

  const classes = [
    styles.skeleton,
    getVariantClass(),
    getAnimationClass(),
    className,
  ].filter(Boolean).join(' ');

  if (count > 1) {
    return (
      <div className={styles.group}>
        {Array.from({ length: count }).map((_, index) => (
          <span
            key={index}
            className={classes}
            style={{
              ...skeletonStyle,
              // Vary the last line width for more natural look
              width: index === count - 1 ? '60%' : skeletonStyle.width,
            }}
          />
        ))}
      </div>
    );
  }

  return <span className={classes} style={skeletonStyle} />;
};

// ============================================
// Preset Skeleton Components
// ============================================

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className }) => (
  <Skeleton variant="text" count={lines} className={className} />
);

export interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 40, className }) => (
  <Skeleton variant="circular" width={size} height={size} className={className} />
);

export interface SkeletonImageProps {
  width?: string | number;
  height?: string | number;
  aspectRatio?: string;
  className?: string;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width = '100%',
  height,
  aspectRatio,
  className,
}) => (
  <Skeleton
    variant="rounded"
    width={width}
    height={height}
    className={className}
    style={aspectRatio ? { aspectRatio } : undefined}
  />
);

export interface SkeletonButtonProps {
  width?: string | number;
  height?: number;
  className?: string;
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  width = 100,
  height = 40,
  className,
}) => (
  <Skeleton variant="rounded" width={width} height={height} className={className} />
);

export default Skeleton;
