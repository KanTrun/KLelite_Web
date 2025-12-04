import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  FiGrid, FiList, FiFilter, FiX, FiStar, 
  FiShoppingCart, FiHeart, FiChevronDown,
  FiSearch, FiSliders, FiEye, FiArrowRight,
  FiAward, FiCheckCircle
} from 'react-icons/fi';
import { fetchProducts, fetchCategories, setFilters } from '@/store/slices/productSlice';
import { addToCart } from '@/store/slices/cartSlice';
import { userService } from '@/services/userService';
import { AppDispatch, RootState } from '@/store';
import { formatCurrency } from '@/utils/formatters';
import Loading from '@/components/common/Loading';
import styles from './Products.module.scss';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const shimmer = {
  hidden: { x: '-100%' },
  visible: { 
    x: '100%',
    transition: { duration: 2, repeat: Infinity, repeatDelay: 3 }
  }
};

const sortOptions = [
  { value: 'createdAt-desc', label: 'Mới nhất' },
  { value: 'createdAt-asc', label: 'Cũ nhất' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
  { value: 'rating-desc', label: 'Đánh giá cao nhất' },
  { value: 'name-asc', label: 'Tên A-Z' },
];

const priceRanges = [
  { min: 0, max: 200000, label: 'Dưới 200.000₫', id: 'price-0-200k' },
  { min: 200000, max: 500000, label: '200.000₫ - 500.000₫', id: 'price-200k-500k' },
  { min: 500000, max: 1000000, label: '500.000₫ - 1.000.000₫', id: 'price-500k-1m' },
  { min: 1000000, max: null, label: 'Trên 1.000.000₫', id: 'price-1m+' },
];

const ProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, pagination, isLoading, filters } = useSelector(
    (state: RootState) => state.product
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Hero parallax
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);

  // Ensure products, categories and pagination have default values
  const productList = products || [];
  const categoryList = categories || [];
  const paginationData = pagination || { total: 0, page: 1, limit: 12, totalPages: 0 };

  // Parse URL params
  const categorySlug = searchParams.get('category');
  const currentSort = searchParams.get('sort') || 'createdAt-desc';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  const rating = searchParams.get('rating');

  // Load wishlist IDs
  const fetchWishlistIds = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const wishlist = await userService.getWishlist();
      setWishlistIds(wishlist.map(item => item.product._id));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Sync URL params with filter state
  useEffect(() => {
    // Set selected price range from URL
    if (priceMin || priceMax) {
      const matchedRange = priceRanges.find(
        r => r.min === Number(priceMin) && (r.max === Number(priceMax) || (r.max === null && !priceMax))
      );
      setSelectedPriceRange(matchedRange?.id || null);
    } else {
      setSelectedPriceRange(null);
    }
    
    // Set selected rating from URL
    setSelectedRating(rating ? Number(rating) : null);
  }, [priceMin, priceMax, rating]);

  useEffect(() => {
    const [sortBy, sortOrder] = currentSort.split('-');
    const newFilters: any = {
      ...filters,
      category: categorySlug || undefined,
      sortBy: sortBy as 'price' | 'rating' | 'createdAt' | 'name',
      sortOrder: sortOrder as 'asc' | 'desc',
      page: currentPage,
      search: searchTerm || undefined,
    };

    // Add price filters
    if (priceMin) newFilters.minPrice = Number(priceMin);
    if (priceMax) newFilters.maxPrice = Number(priceMax);
    if (rating) newFilters.rating = Number(rating);

    dispatch(setFilters(newFilters));
    dispatch(fetchProducts(newFilters));
  }, [dispatch, categorySlug, currentSort, currentPage, searchTerm, priceMin, priceMax, rating]);

  const handleSortChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set('sort', value);
      prev.set('page', '1');
      return prev;
    });
  };

  const handleCategoryChange = (slug: string | null) => {
    setSearchParams((prev) => {
      if (slug) {
        prev.set('category', slug);
      } else {
        prev.delete('category');
      }
      prev.set('page', '1');
      return prev;
    });
    setShowMobileFilter(false);
  };

  const handlePriceRangeChange = (rangeId: string) => {
    const range = priceRanges.find(r => r.id === rangeId);
    
    setSearchParams((prev) => {
      if (selectedPriceRange === rangeId) {
        // Deselect
        prev.delete('priceMin');
        prev.delete('priceMax');
      } else if (range) {
        // Select
        prev.set('priceMin', String(range.min));
        if (range.max !== null) {
          prev.set('priceMax', String(range.max));
        } else {
          prev.delete('priceMax');
        }
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handleRatingChange = (ratingValue: number) => {
    setSearchParams((prev) => {
      if (selectedRating === ratingValue) {
        // Deselect
        prev.delete('rating');
      } else {
        // Select
        prev.set('rating', String(ratingValue));
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handleClearFilters = () => {
    setSearchParams((prev) => {
      prev.delete('category');
      prev.delete('priceMin');
      prev.delete('priceMax');
      prev.delete('rating');
      prev.set('page', '1');
      return prev;
    });
    setSearchTerm('');
    setShowMobileFilter(false);
  };

  const hasActiveFilters = categorySlug || priceMin || priceMax || rating;

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(page));
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const [sortBy, sortOrder] = currentSort.split('-');
    dispatch(fetchProducts({ 
      ...filters, 
      search: searchTerm, 
      page: 1,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    }));
  };

  const handleAddToCart = (productId: string) => {
    dispatch(addToCart({ productId, quantity: 1 }));
  };

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    try {
      setAddingToWishlist(productId);
      if (wishlistIds.includes(productId)) {
        await userService.removeFromWishlist(productId);
        setWishlistIds(prev => prev.filter(id => id !== productId));
      } else {
        await userService.addToWishlist(productId);
        setWishlistIds(prev => [...prev, productId]);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setAddingToWishlist(null);
    }
  };

  const activeCategory = useMemo(() => {
    return categoryList.find((cat) => cat.slug === categorySlug);
  }, [categoryList, categorySlug]);

  return (
    <div className={styles.productsPage}>
      {/* Hero Banner - Royal Luxury Style */}
      <section className={styles.heroBanner} ref={heroRef}>
        <motion.div 
          className={styles.heroBackground}
          style={{ y: heroY }}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroPattern} />
        
        {/* Floating Elements */}
        <motion.div 
          className={styles.floatingCrown}
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <FiAward />
        </motion.div>
        
        <div className={styles.container}>
          <motion.div
            className={styles.heroContent}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ opacity: heroOpacity }}
          >
            <motion.div className={styles.royalBadge} variants={fadeInUp}>
              <span className={styles.badgeIcon}>✦</span>
              <span>Bộ Sưu Tập Hoàng Gia</span>
              <span className={styles.badgeIcon}>✦</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp}>
              <span className={styles.titleAccent}>
                {activeCategory?.name || 'Nghệ Thuật'}
              </span>
              <span className={styles.titleMain}>Bánh Thượng Lưu</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp}>
              {activeCategory?.description ||
                'Khám phá những tuyệt phẩm bánh được chế tác bởi nghệ nhân hàng đầu, từ nguyên liệu quý hiếm nhập khẩu từ Pháp, Bỉ và Thụy Sĩ'}
            </motion.p>
            
            <motion.div className={styles.heroStats} variants={fadeInUp}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{paginationData.total}+</span>
                <span className={styles.statLabel}>Tuyệt Phẩm</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{categoryList.length}</span>
                <span className={styles.statLabel}>Bộ Sưu Tập</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>5★</span>
                <span className={styles.statLabel}>Đánh Giá</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className={styles.scrollIndicator}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>Khám phá</span>
          <FiChevronDown />
        </motion.div>
      </section>

      <div className={styles.container}>
        <div className={styles.productsLayout}>
          {/* Sidebar Filters - Desktop */}
          <aside className={styles.sidebar}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.sidebarHeader}>
                <h3>
                  <FiSliders />
                  <span>Bộ Lọc Tinh Tế</span>
                </h3>
              </div>

              {hasActiveFilters && (
                <motion.button 
                  className={styles.clearFiltersBtn} 
                  onClick={handleClearFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiX /> Xóa tất cả bộ lọc
                </motion.button>
              )}

              <div className={styles.filterSection}>
                <h4>
                  <span className={styles.filterIcon}>✦</span>
                  Danh Mục Cao Cấp
                </h4>
                <ul className={styles.categoryList}>
                  <li>
                    <button
                      className={!categorySlug ? styles.active : ''}
                      onClick={() => handleCategoryChange(null)}
                    >
                      <span className={styles.catName}>Tất cả</span>
                      <span className={styles.catCount}>{paginationData.total}</span>
                    </button>
                  </li>
                  {categoryList.map((category) => (
                    <li key={category._id}>
                      <button
                        className={categorySlug === category.slug ? styles.active : ''}
                        onClick={() => handleCategoryChange(category.slug)}
                      >
                        <span className={styles.catName}>{category.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.filterSection}>
                <h4>
                  <span className={styles.filterIcon}>◆</span>
                  Phân Khúc Giá
                </h4>
                <ul className={styles.priceRanges}>
                  {priceRanges.map((range) => (
                    <li key={range.id}>
                      <label className={styles.luxuryCheckbox}>
                        <input 
                          type="checkbox" 
                          checked={selectedPriceRange === range.id}
                          onChange={() => handlePriceRangeChange(range.id)}
                        />
                        <span className={styles.checkmark}>
                          <FiCheckCircle />
                        </span>
                        <span className={styles.labelText}>{range.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.filterSection}>
                <h4>
                  <span className={styles.filterIcon}>★</span>
                  Đánh Giá
                </h4>
                <ul className={styles.ratingFilter}>
                  {[5, 4, 3, 2, 1].map((ratingValue) => (
                    <li key={ratingValue}>
                      <label className={styles.luxuryCheckbox}>
                        <input 
                          type="checkbox" 
                          checked={selectedRating === ratingValue}
                          onChange={() => handleRatingChange(ratingValue)}
                        />
                        <span className={styles.checkmark}>
                          <FiCheckCircle />
                        </span>
                        <span className={styles.stars}>
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={i < ratingValue ? styles.filled : ''}
                            />
                          ))}
                          <span className={styles.ratingText}>& trở lên</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Sidebar CTA */}
              <div className={styles.sidebarCta}>
                <div className={styles.ctaIcon}>
                  <FiAward />
                </div>
                <h5>Đặt Hàng Riêng</h5>
                <p>Thiết kế bánh theo yêu cầu đặc biệt của bạn</p>
                <Link to="/contact" className={styles.ctaBtn}>
                  Liên hệ ngay
                </Link>
              </div>
            </motion.div>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Toolbar */}
            <motion.div 
              className={styles.toolbar}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className={styles.toolbarLeft}>
                <button
                  className={styles.mobileFilterBtn}
                  onClick={() => setShowMobileFilter(true)}
                >
                  <FiSliders />
                  <span>Bộ lọc</span>
                </button>
                
                <form onSubmit={handleSearch} className={styles.searchForm}>
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tuyệt phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
              </div>

              <div className={styles.toolbarRight}>
                <span className={styles.resultCount}>
                  <span className={styles.countNumber}>{paginationData.total}</span> tuyệt phẩm
                </span>

                <div className={styles.sortSelect}>
                  <select value={currentSort} onChange={(e) => handleSortChange(e.target.value)}>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown />
                </div>

                <div className={styles.viewToggle}>
                  <button
                    className={viewMode === 'grid' ? styles.active : ''}
                    onClick={() => setViewMode('grid')}
                    title="Dạng lưới"
                  >
                    <FiGrid />
                  </button>
                  <button
                    className={viewMode === 'list' ? styles.active : ''}
                    onClick={() => setViewMode('list')}
                    title="Dạng danh sách"
                  >
                    <FiList />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Products Grid */}
            {isLoading ? (
              <div className={styles.loadingWrapper}>
                <div className={styles.luxuryLoader}>
                  <div className={styles.loaderInner} />
                  <span>Đang tải...</span>
                </div>
              </div>
            ) : productList.length === 0 ? (
              <motion.div 
                className={styles.emptyState}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className={styles.emptyIcon}>
                  <FiSearch />
                </div>
                <h3>Không tìm thấy tuyệt phẩm</h3>
                <p>Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                <motion.button 
                  onClick={() => handleCategoryChange(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Xem tất cả sản phẩm</span>
                  <FiArrowRight />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                className={`${styles.productsGrid} ${viewMode === 'list' ? styles.listView : ''}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="wait">
                  {productList.map((product, index) => (
                    <motion.article
                      key={product._id}
                      className={styles.productCard}
                      variants={cardVariant}
                      layout
                      whileHover={{ y: -8 }}
                    >
                      {/* Card Glow Effect */}
                      <div className={styles.cardGlow} />
                      
                      <Link
                        to={`/products/${product.slug}`}
                        className={styles.productImage}
                      >
                        <div className={styles.imageWrapper}>
                          <img
                            src={product.mainImage || (product.images[0]?.url) || '/images/placeholder-product.png'}
                            alt={product.name}
                            loading="lazy"
                          />
                          <div className={styles.imageOverlay} />
                        </div>
                        
                        {/* Badges */}
                        <div className={styles.badgeContainer}>
                          {product.discount && product.discount > 0 && (
                            <span className={styles.discountBadge}>-{product.discount}%</span>
                          )}
                          {(product.isFeatured || product.featured) && (
                            <span className={styles.featuredBadge}>
                              <FiAward /> Premium
                            </span>
                          )}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className={styles.productActions}>
                          <motion.button
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product._id);
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Thêm vào giỏ"
                          >
                            <FiShoppingCart />
                          </motion.button>
                          <motion.button
                            className={`${styles.actionBtn} ${wishlistIds.includes(product._id) ? styles.wishlisted : ''}`}
                            onClick={(e) => handleToggleWishlist(product._id, e)}
                            disabled={addingToWishlist === product._id}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title={wishlistIds.includes(product._id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                          >
                            <FiHeart />
                          </motion.button>
                          <motion.button
                            className={styles.actionBtn}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Xem nhanh"
                          >
                            <FiEye />
                          </motion.button>
                        </div>
                      </Link>

                      <div className={styles.productInfo}>
                        <span className={styles.productCategory}>
                          {typeof product.category === 'object'
                            ? product.category.name
                            : 'Bánh Cao Cấp'}
                        </span>
                        
                        <h3>
                          <Link to={`/products/${product.slug}`}>{product.name}</Link>
                        </h3>

                        {viewMode === 'list' && product.shortDescription && (
                          <p className={styles.productDescription}>
                            {product.shortDescription}
                          </p>
                        )}

                        <div className={styles.productRating}>
                          <div className={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={
                                  i < Math.floor(product.rating) ? styles.filled : ''
                                }
                              />
                            ))}
                          </div>
                          <span className={styles.reviewCount}>
                            ({product.numReviews || product.reviewCount || 0} đánh giá)
                          </span>
                        </div>

                        <div className={styles.productPricing}>
                          <span className={styles.price}>{formatCurrency(product.price)}</span>
                          {(product.comparePrice || product.originalPrice) && (product.comparePrice || product.originalPrice)! > product.price && (
                            <span className={styles.originalPrice}>
                              {formatCurrency(product.comparePrice || product.originalPrice!)}
                            </span>
                          )}
                        </div>

                        {viewMode === 'list' && (
                          <motion.button
                            className={styles.addToCartBtn}
                            onClick={() => handleAddToCart(product._id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiShoppingCart />
                            <span>Thêm vào giỏ hàng</span>
                          </motion.button>
                        )}
                      </div>
                      
                      {/* Shimmer Effect */}
                      <motion.div 
                        className={styles.shimmer}
                        variants={shimmer}
                      />
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Pagination */}
            {paginationData.totalPages > 1 && (
              <motion.div 
                className={styles.pagination}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={styles.pageNav}
                >
                  <FiArrowRight style={{ transform: 'rotate(180deg)' }} />
                  <span>Trước</span>
                </motion.button>

                <div className={styles.pageNumbers}>
                  {[...Array(paginationData.totalPages)].map((_, index) => {
                    const page = index + 1;
                    const showPage =
                      page === 1 ||
                      page === paginationData.totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    if (!showPage) {
                      if (page === 2 || page === paginationData.totalPages - 1) {
                        return <span key={page} className={styles.ellipsis}>···</span>;
                      }
                      return null;
                    }

                    return (
                      <motion.button
                        key={page}
                        className={page === currentPage ? styles.active : ''}
                        onClick={() => handlePageChange(page)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {page}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  disabled={currentPage === paginationData.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={styles.pageNav}
                >
                  <span>Sau</span>
                  <FiArrowRight />
                </motion.button>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {showMobileFilter && (
          <motion.div
            className={styles.mobileFilterOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilter(false)}
          >
            <motion.div
              className={styles.mobileFilterPanel}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.mobileFilterHeader}>
                <h3>
                  <FiSliders />
                  <span>Bộ Lọc Tinh Tế</span>
                </h3>
                <button onClick={() => setShowMobileFilter(false)}>
                  <FiX />
                </button>
              </div>

              <div className={styles.mobileFilterContent}>
                <div className={styles.filterSection}>
                  <h4>
                    <span className={styles.filterIcon}>✦</span>
                    Danh Mục
                  </h4>
                  <ul className={styles.categoryList}>
                    <li>
                      <button
                        className={!categorySlug ? styles.active : ''}
                        onClick={() => handleCategoryChange(null)}
                      >
                        Tất cả
                      </button>
                    </li>
                    {categoryList.map((category) => (
                      <li key={category._id}>
                        <button
                          className={categorySlug === category.slug ? styles.active : ''}
                          onClick={() => handleCategoryChange(category.slug)}
                        >
                          {category.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.filterSection}>
                  <h4>
                    <span className={styles.filterIcon}>◆</span>
                    Khoảng Giá
                  </h4>
                  <ul className={styles.priceRanges}>
                    {priceRanges.map((range) => (
                      <li key={range.id}>
                        <label className={styles.luxuryCheckbox}>
                          <input 
                            type="checkbox" 
                            checked={selectedPriceRange === range.id}
                            onChange={() => handlePriceRangeChange(range.id)}
                          />
                          <span className={styles.checkmark}>
                            <FiCheckCircle />
                          </span>
                          <span className={styles.labelText}>{range.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.filterSection}>
                  <h4>
                    <span className={styles.filterIcon}>★</span>
                    Đánh Giá
                  </h4>
                  <ul className={styles.ratingFilter}>
                    {[5, 4, 3, 2, 1].map((ratingValue) => (
                      <li key={ratingValue}>
                        <label className={styles.luxuryCheckbox}>
                          <input 
                            type="checkbox" 
                            checked={selectedRating === ratingValue}
                            onChange={() => handleRatingChange(ratingValue)}
                          />
                          <span className={styles.checkmark}>
                            <FiCheckCircle />
                          </span>
                          <span className={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={i < ratingValue ? styles.filled : ''}
                              />
                            ))}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasActiveFilters && (
                  <motion.button 
                    className={styles.clearFiltersBtnMobile} 
                    onClick={handleClearFilters}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiX />
                    Xóa tất cả bộ lọc
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductList;
