import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cardHover, imageZoom } from '@/utils/animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import styles from './ProductCard.module.scss';

// Icons (using inline SVGs for independence)
const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  isLimited?: boolean;
  isSale?: boolean;
  isOutOfStock?: boolean;
  isFeatured?: boolean;
  isWishlisted?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'vertical' | 'horizontal';
  onAddToCart?: (id: string) => void;
  onToggleWishlist?: (id: string) => void;
  onQuickView?: (id: string) => void;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  slug,
  category,
  description,
  price,
  originalPrice,
  discount,
  image,
  rating = 0,
  reviewCount = 0,
  isNew = false,
  isBestseller = false,
  isLimited = false,
  isSale = false,
  isOutOfStock = false,
  isFeatured = false,
  isWishlisted = false,
  size = 'medium',
  variant = 'vertical',
  onAddToCart,
  onToggleWishlist,
  onQuickView,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const cardClasses = [
    styles.card,
    size === 'small' && styles.cardSmall,
    size === 'large' && styles.cardLarge,
    variant === 'horizontal' && styles.cardHorizontal,
    isOutOfStock && styles.outOfStock,
    isFeatured && styles.featured,
  ]
    .filter(Boolean)
    .join(' ');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && onAddToCart) {
      onAddToCart(id);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(id);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(id);
    }
  };

  // Calculate discount percentage if not provided
  const discountPercent =
    discount || (originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  // Render stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon key={i} filled />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <StarIcon key={i} filled />
        );
      } else {
        stars.push(
          <StarIcon key={i} />
        );
      }
    }
    return stars;
  };

  return (
    <motion.article
      className={cardClasses}
      whileHover={shouldReduceMotion ? {} : cardHover}
    >
      {/* Image Section */}
      <div className={styles.imageWrapper}>
        <Link to={`/products/${slug}`} className={styles.image}>
          <motion.img
            src={image}
            alt={name}
            loading="lazy"
            whileHover={shouldReduceMotion ? {} : imageZoom}
          />
        </Link>


        {/* Overlay */}
        <div className={styles.overlay} />

        {/* Badges */}
        <div className={styles.badges}>
          {isNew && <span className={`${styles.badge} ${styles.new}`}>Mới</span>}
          {isSale && discountPercent > 0 && (
            <span className={`${styles.badge} ${styles.sale}`}>-{discountPercent}%</span>
          )}
          {isBestseller && <span className={`${styles.badge} ${styles.bestseller}`}>Bán chạy</span>}
          {isLimited && <span className={`${styles.badge} ${styles.limited}`}>Giới hạn</span>}
        </div>

        {/* Wishlist Button */}
        <button
          className={`${styles.wishlistButton} ${isWishlisted ? styles.active : ''}`}
          onClick={handleToggleWishlist}
          aria-label={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          <HeartIcon filled={isWishlisted} />
        </button>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <button
            className={styles.quickAction}
            onClick={handleQuickView}
            aria-label="Xem nhanh"
          >
            <EyeIcon />
          </button>
          <button
            className={styles.quickAction}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label="Thêm vào giỏ hàng"
          >
            <CartIcon />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {category && <span className={styles.category}>{category}</span>}

        <h3 className={styles.name}>
          <Link to={`/products/${slug}`}>{name}</Link>
        </h3>

        {description && size !== 'small' && (
          <p className={styles.description}>{description}</p>
        )}

        {/* Rating */}
        {rating > 0 && (
          <div className={styles.rating}>
            <div className={styles.stars}>{renderStars()}</div>
            {reviewCount > 0 && (
              <span className={styles.ratingCount}>({reviewCount})</span>
            )}
          </div>
        )}

        {/* Price Section */}
        <div className={styles.priceSection}>
          <div className={styles.prices}>
            <span className={styles.currentPrice}>{formatPrice(price)}</span>
            {originalPrice && originalPrice > price && (
              <span className={styles.originalPrice}>{formatPrice(originalPrice)}</span>
            )}
          </div>

          {size !== 'small' && (
            <button
              className={styles.addToCartButton}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <CartIcon />
              <span>{isOutOfStock ? 'Hết hàng' : 'Mua ngay'}</span>
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
};

// Skeleton Loading Component
export const ProductCardSkeleton: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({
  size = 'medium',
}) => {
  const cardClasses = [
    styles.card,
    styles.skeleton,
    size === 'small' && styles.cardSmall,
    size === 'large' && styles.cardLarge,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClasses}>
      <div className={styles.imageWrapper} />
      <div className={styles.content}>
        <div className={`${styles.skeletonText} ${styles.short}`} style={{ marginBottom: '0.5rem' }} />
        <div className={`${styles.skeletonText} ${styles.long}`} style={{ marginBottom: '0.25rem' }} />
        <div className={`${styles.skeletonText} ${styles.medium}`} style={{ marginBottom: '1rem' }} />
        <div className={`${styles.skeletonText} ${styles.short}`} />
      </div>
    </article>
  );
};

export default ProductCard;
