import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart,
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiShare2,
  FiCheck,
  FiStar,
  FiChevronRight,
  FiTruck,
  FiShield,
  FiClock,
  FiPackage,
  FiAward,
  FiGift,
} from 'react-icons/fi';
import { AppDispatch, RootState } from '@/store';
import { fetchProductBySlug } from '@/store/slices/productSlice';
import { addToCart } from '@/store/slices/cartSlice';
import { formatCurrency } from '@/utils/formatters';
import Loading from '@/components/common/Loading';
import styles from './ProductDetail.module.scss';

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { currentProduct: product, isLoading, error } = useSelector(
    (state: RootState) => state.product
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'reviews'>('description');
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (slug) {
      dispatch(fetchProductBySlug(slug));
    }
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, [dispatch, slug]);

  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[0].name);
    }
  }, [product, selectedSize]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 99)) {
      setQuantity(newQuantity);
    }
  };

  const getCurrentPrice = () => {
    if (selectedSize && product?.sizes) {
      const size = product.sizes.find((s) => s.name === selectedSize);
      return size?.price || product.price;
    }
    return product?.price || 0;
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }

    try {
      await dispatch(
        addToCart({
          productId: product._id,
          quantity,
          size: selectedSize || undefined,
        })
      ).unwrap();
      
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.shortDescription,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.productDetailPage}>
        <div className={styles.loadingWrapper}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p>Đang tải sản phẩm...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.productDetailPage}>
        <div className={styles.container}>
          <motion.div 
            className={styles.errorState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.errorIcon}>😔</div>
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/products" className={styles.backBtn}>
              <FiChevronRight className={styles.rotateIcon} />
              Quay lại danh sách sản phẩm
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images.map((img) => (typeof img === 'string' ? img : img.url))
    : ['/images/placeholder-product.png'];

  const discountPercent = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <FiStar key={i} className={i < Math.floor(rating) ? styles.filled : ''} />
    ));
  };

  return (
    <div className={styles.productDetailPage}>
      {/* Decorative Background Elements */}
      <div className={styles.bgDecoration}>
        <div className={styles.bgCircle1}></div>
        <div className={styles.bgCircle2}></div>
      </div>

      <div className={styles.container}>
        {/* Elegant Breadcrumb */}
        <motion.nav 
          className={styles.breadcrumb}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/">Trang chủ</Link>
          <span className={styles.separator}>/</span>
          <Link to="/products">Bộ sưu tập</Link>
          <span className={styles.separator}>/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${typeof product.category === 'object' ? product.category._id : product.category}`}>
                {typeof product.category === 'object' ? product.category.name : 'Danh mục'}
              </Link>
              <span className={styles.separator}>/</span>
            </>
          )}
          <span className={styles.current}>{product.name}</span>
        </motion.nav>

        <div className={styles.productDetailGrid}>
          {/* Image Gallery - Left Side */}
          <motion.div
            className={styles.gallerySection}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main Image */}
            <div 
              className={`${styles.mainImageWrapper} ${isZoomed ? styles.zoomed : ''}`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <div className={styles.imageFrame}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={images[selectedImage]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className={styles.mainImage}
                  />
                </AnimatePresence>
                
                {/* Badges */}
                <div className={styles.badgesContainer}>
                  {discountPercent > 0 && (
                    <motion.span 
                      className={styles.discountBadge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      -{discountPercent}%
                    </motion.span>
                  )}
                  {product.isNewProduct && (
                    <motion.span 
                      className={styles.newBadge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      Mới
                    </motion.span>
                  )}
                  {product.isFeatured && (
                    <motion.span 
                      className={styles.featuredBadge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <FiAward /> Best Seller
                    </motion.span>
                  )}
                </div>

                {/* Image Zoom Hint */}
                <div className={styles.zoomHint}>
                  <span>Click để {isZoomed ? 'thu nhỏ' : 'phóng to'}</span>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className={styles.thumbnailsWrapper}>
                <div className={styles.thumbnails}>
                  {images.map((img, index) => (
                    <motion.button
                      key={index}
                      className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                      onClick={() => setSelectedImage(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img src={img} alt={`${product.name} ${index + 1}`} />
                      {selectedImage === index && <div className={styles.activeIndicator}></div>}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Product Info - Right Side */}
          <motion.div
            className={styles.infoSection}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Category Tag */}
            {product.category && (
              <motion.span 
                className={styles.categoryTag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {typeof product.category === 'object' ? product.category.name : 'Premium Collection'}
              </motion.span>
            )}

            {/* Product Title */}
            <motion.h1 
              className={styles.productTitle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {product.name}
            </motion.h1>

            {/* Rating & Reviews */}
            <motion.div 
              className={styles.ratingSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className={styles.starsWrapper}>
                {renderStars(product.rating || 0)}
              </div>
              <span className={styles.ratingValue}>{product.rating?.toFixed(1) || '0.0'}</span>
              <span className={styles.reviewCount}>({product.numReviews || 0} đánh giá)</span>
              <span className={styles.divider}>|</span>
              <span className={styles.soldCount}>Đã bán: {product.soldCount || 0}</span>
            </motion.div>

            {/* Price Section */}
            <motion.div 
              className={styles.priceSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className={styles.priceWrapper}>
                <span className={styles.currentPrice}>{formatCurrency(getCurrentPrice())}</span>
                {product.comparePrice && product.comparePrice > getCurrentPrice() && (
                  <span className={styles.originalPrice}>{formatCurrency(product.comparePrice)}</span>
                )}
              </div>
              {discountPercent > 0 && (
                <span className={styles.savingText}>
                  Tiết kiệm {formatCurrency(product.comparePrice! - getCurrentPrice())}
                </span>
              )}
            </motion.div>

            {/* Short Description */}
            <motion.p 
              className={styles.shortDescription}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {product.shortDescription || product.description?.substring(0, 200)}
            </motion.p>

            {/* Divider */}
            <div className={styles.elegantDivider}>
              <span></span>
              <FiGift />
              <span></span>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <motion.div 
                className={styles.optionGroup}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <label className={styles.optionLabel}>
                  <span>Kích thước</span>
                  <span className={styles.selectedOption}>{selectedSize}</span>
                </label>
                <div className={styles.sizeOptions}>
                  {product.sizes.map((size) => (
                    <motion.button
                      key={size.name}
                      className={`${styles.sizeBtn} ${selectedSize === size.name ? styles.active : ''}`}
                      onClick={() => setSelectedSize(size.name)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={styles.sizeName}>{size.name}</span>
                      <span className={styles.sizePrice}>{formatCurrency(size.price)}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quantity Selection */}
            <motion.div 
              className={styles.optionGroup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className={styles.optionLabel}>
                <span>Số lượng</span>
                <span className={styles.stockStatus}>
                  {product.stock > 0 ? (
                    <><span className={styles.inStock}></span> Còn {product.stock} sản phẩm</>
                  ) : (
                    <><span className={styles.outOfStock}></span> Hết hàng</>
                  )}
                </span>
              </label>
              <div className={styles.quantitySelector}>
                <motion.button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  whileTap={{ scale: 0.9 }}
                  className={styles.qtyBtn}
                >
                  <FiMinus />
                </motion.button>
                <span className={styles.qtyValue}>{quantity}</span>
                <motion.button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stock || 99)}
                  whileTap={{ scale: 0.9 }}
                  className={styles.qtyBtn}
                >
                  <FiPlus />
                </motion.button>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className={styles.actionButtons}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <motion.button
                className={`${styles.addToCartBtn} ${addedToCart ? styles.added : ''}`}
                onClick={handleAddToCart}
                disabled={!product.stock || product.stock === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {addedToCart ? (
                  <>
                    <FiCheck className={styles.btnIcon} />
                    <span>Đã thêm vào giỏ</span>
                  </>
                ) : (
                  <>
                    <FiShoppingCart className={styles.btnIcon} />
                    <span>Thêm vào giỏ hàng</span>
                  </>
                )}
              </motion.button>

              <motion.button
                className={`${styles.wishlistBtn} ${isWishlisted ? styles.active : ''}`}
                onClick={handleWishlist}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiHeart />
              </motion.button>

              <motion.button
                className={styles.shareBtn}
                onClick={handleShare}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiShare2 />
              </motion.button>
            </motion.div>

            {/* Features Grid */}
            <motion.div 
              className={styles.featuresGrid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FiTruck />
                </div>
                <div className={styles.featureContent}>
                  <strong>Giao hàng miễn phí</strong>
                  <span>Đơn từ 500.000đ</span>
                </div>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FiShield />
                </div>
                <div className={styles.featureContent}>
                  <strong>Cam kết chất lượng</strong>
                  <span>Nguyên liệu cao cấp</span>
                </div>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FiClock />
                </div>
                <div className={styles.featureContent}>
                  <strong>Làm tươi mỗi ngày</strong>
                  <span>Sản xuất trong ngày</span>
                </div>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FiPackage />
                </div>
                <div className={styles.featureContent}>
                  <strong>Đóng gói sang trọng</strong>
                  <span>Hộp quà cao cấp</span>
                </div>
              </div>
            </motion.div>

            {/* SKU & Meta */}
            <motion.div 
              className={styles.metaInfo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
            >
              <span>SKU: <strong>{product.sku}</strong></span>
              {product.category && (
                <span>Danh mục: <Link to={`/products?category=${typeof product.category === 'object' ? product.category._id : product.category}`}>
                  {typeof product.category === 'object' ? product.category.name : 'Xem thêm'}
                </Link></span>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Product Tabs Section */}
        <motion.div 
          className={styles.tabsSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className={styles.tabHeaders}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'description' ? styles.active : ''}`}
              onClick={() => setActiveTab('description')}
            >
              <span>Mô tả sản phẩm</span>
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'ingredients' ? styles.active : ''}`}
              onClick={() => setActiveTab('ingredients')}
            >
              <span>Thành phần & Dinh dưỡng</span>
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.active : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <span>Đánh giá ({product.numReviews || 0})</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              className={styles.tabContent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'description' && (
                <div className={styles.descriptionTab}>
                  <div
                    className={styles.descriptionContent}
                    dangerouslySetInnerHTML={{ __html: product.description || '<p>Mô tả sản phẩm đang được cập nhật...</p>' }}
                  />
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div className={styles.ingredientsTab}>
                  {product.ingredients && product.ingredients.length > 0 ? (
                    <>
                      <div className={styles.ingredientSection}>
                        <h4>🥧 Thành phần chính</h4>
                        <ul className={styles.ingredientList}>
                          {product.ingredients.map((ing, idx) => (
                            <li key={idx}>
                              <FiCheck className={styles.checkIcon} />
                              <span>{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {product.allergens && product.allergens.length > 0 && (
                        <div className={styles.allergenSection}>
                          <h4>⚠️ Thông tin dị ứng</h4>
                          <p className={styles.allergenText}>
                            Sản phẩm có chứa: <strong>{product.allergens.join(', ')}</strong>
                          </p>
                        </div>
                      )}

                      {product.nutrition && (
                        <div className={styles.nutritionSection}>
                          <h4>📊 Giá trị dinh dưỡng (mỗi khẩu phần)</h4>
                          <div className={styles.nutritionGrid}>
                            {product.nutrition.calories && (
                              <div className={styles.nutritionItem}>
                                <span className={styles.nutritionValue}>{product.nutrition.calories}</span>
                                <span className={styles.nutritionLabel}>Calories (kcal)</span>
                              </div>
                            )}
                            {product.nutrition.protein && (
                              <div className={styles.nutritionItem}>
                                <span className={styles.nutritionValue}>{product.nutrition.protein}g</span>
                                <span className={styles.nutritionLabel}>Protein</span>
                              </div>
                            )}
                            {product.nutrition.carbs && (
                              <div className={styles.nutritionItem}>
                                <span className={styles.nutritionValue}>{product.nutrition.carbs}g</span>
                                <span className={styles.nutritionLabel}>Carbs</span>
                              </div>
                            )}
                            {product.nutrition.fat && (
                              <div className={styles.nutritionItem}>
                                <span className={styles.nutritionValue}>{product.nutrition.fat}g</span>
                                <span className={styles.nutritionLabel}>Fat</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.emptyContent}>
                      <p>Thông tin thành phần đang được cập nhật...</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className={styles.reviewsTab}>
                  {product.reviews && product.reviews.length > 0 ? (
                    <>
                      {/* Review Summary */}
                      <div className={styles.reviewSummary}>
                        <div className={styles.overallRating}>
                          <span className={styles.bigRating}>{product.rating?.toFixed(1) || '0.0'}</span>
                          <div className={styles.starsWrapper}>
                            {renderStars(product.rating || 0)}
                          </div>
                          <span className={styles.totalReviews}>{product.numReviews} đánh giá</span>
                        </div>
                      </div>

                      {/* Reviews List */}
                      <div className={styles.reviewsList}>
                        {product.reviews.map((review, index) => (
                          <motion.div 
                            key={review._id.toString()} 
                            className={styles.reviewCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className={styles.reviewHeader}>
                              <div className={styles.reviewerAvatar}>
                                {(review.user as { name?: string })?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className={styles.reviewerInfo}>
                                <strong>{(review.user as { name?: string })?.name || 'Người dùng'}</strong>
                                <span className={styles.reviewDate}>
                                  {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className={styles.reviewRating}>
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            <p className={styles.reviewComment}>{review.comment}</p>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={styles.noReviews}>
                      <div className={styles.noReviewsIcon}>⭐</div>
                      <h4>Chưa có đánh giá</h4>
                      <p>Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                      <button className={styles.writeReviewBtn}>Viết đánh giá</button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
