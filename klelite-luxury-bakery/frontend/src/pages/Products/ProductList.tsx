import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGrid, FiList, FiFilter, FiX, FiStar, 
  FiShoppingCart, FiHeart, FiChevronDown,
  FiSearch, FiSliders
} from 'react-icons/fi';
import { fetchProducts, fetchCategories, setFilters } from '@/store/slices/productSlice';
import { addToCart } from '@/store/slices/cartSlice';
import { userService } from '@/services/userService';
import { AppDispatch, RootState } from '@/store';
import { formatCurrency } from '@/utils/formatters';
import Loading from '@/components/common/Loading';
import styles from './Products.module.scss';

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
      {/* Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className={styles.heroLabel}>Bộ Sưu Tập</span>
            <h1>{activeCategory?.name || 'Tất Cả Sản Phẩm'}</h1>
            <p>
              {activeCategory?.description ||
                'Khám phá những chiếc bánh thủ công cao cấp được chế tác từ nguyên liệu tuyển chọn'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.productsLayout}>
          {/* Sidebar Filters - Desktop */}
          <aside className={styles.sidebar}>
            {hasActiveFilters && (
              <button className={styles.clearFiltersBtn} onClick={handleClearFilters}>
                <FiX /> Xóa bộ lọc
              </button>
            )}

            <div className={styles.filterSection}>
              <h3>Danh Mục</h3>
              <ul className={styles.categoryList}>
                <li>
                  <button
                    className={!categorySlug ? styles.active : ''}
                    onClick={() => handleCategoryChange(null)}
                  >
                    Tất cả
                    <span>{paginationData.total}</span>
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
              <h3>Khoảng Giá</h3>
              <ul className={styles.priceRanges}>
                {priceRanges.map((range) => (
                  <li key={range.id}>
                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={selectedPriceRange === range.id}
                        onChange={() => handlePriceRangeChange(range.id)}
                      />
                      <span className={styles.checkmark}></span>
                      <span>{range.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.filterSection}>
              <h3>Đánh Giá</h3>
              <ul className={styles.ratingFilter}>
                {[5, 4, 3, 2, 1].map((ratingValue) => (
                  <li key={ratingValue}>
                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={selectedRating === ratingValue}
                        onChange={() => handleRatingChange(ratingValue)}
                      />
                      <span className={styles.checkmark}></span>
                      <span className={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={i < ratingValue ? styles.filled : ''}
                          />
                        ))}
                        <span>& trở lên</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
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
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
              </div>

              <div className={styles.toolbarRight}>
                <span className={styles.resultCount}>
                  {paginationData.total} sản phẩm
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
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className={styles.loadingWrapper}>
                <Loading />
              </div>
            ) : productList.length === 0 ? (
              <div className={styles.emptyState}>
                <img src="/images/empty-products.svg" alt="No products" />
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                <button onClick={() => handleCategoryChange(null)}>
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : (
              <motion.div
                className={`${styles.productsGrid} ${viewMode === 'list' ? styles.listView : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence>
                  {productList.map((product, index) => (
                    <motion.article
                      key={product._id}
                      className={styles.productCard}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/products/${product.slug}`}
                        className={styles.productImage}
                      >
                        <img
                          src={product.mainImage || (product.images[0]?.url) || '/images/placeholder-product.png'}
                          alt={product.name}
                          loading="lazy"
                        />
                        {product.discount && product.discount > 0 && (
                          <span className={styles.badge}>-{product.discount}%</span>
                        )}
                        {(product.isFeatured || product.featured) && (
                          <span className={`${styles.badge} ${styles.featuredBadge}`}>
                            Hot
                          </span>
                        )}
                        <div className={styles.productActions}>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product._id);
                            }}
                            title="Thêm vào giỏ"
                          >
                            <FiShoppingCart />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${wishlistIds.includes(product._id) ? styles.wishlisted : ''}`}
                            onClick={(e) => handleToggleWishlist(product._id, e)}
                            disabled={addingToWishlist === product._id}
                            title={wishlistIds.includes(product._id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                          >
                            <FiHeart />
                          </button>
                        </div>
                      </Link>

                      <div className={styles.productInfo}>
                        <span className={styles.productCategory}>
                          {typeof product.category === 'object'
                            ? product.category.name
                            : 'Bánh'}
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
                          <span>({product.numReviews || product.reviewCount || 0})</span>
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
                          <button
                            className={styles.addToCartBtn}
                            onClick={() => handleAddToCart(product._id)}
                          >
                            <FiShoppingCart />
                            Thêm vào giỏ
                          </button>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Pagination */}
            {paginationData.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Trước
                </button>

                {[...Array(paginationData.totalPages)].map((_, index) => {
                  const page = index + 1;
                  const showPage =
                    page === 1 ||
                    page === paginationData.totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!showPage) {
                    if (page === 2 || page === paginationData.totalPages - 1) {
                      return <span key={page} className={styles.ellipsis}>...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      className={page === currentPage ? styles.active : ''}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === paginationData.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Sau
                </button>
              </div>
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
              transition={{ type: 'tween' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.mobileFilterHeader}>
                <h3>Bộ lọc</h3>
                <button onClick={() => setShowMobileFilter(false)}>
                  <FiX />
                </button>
              </div>

              <div className={styles.mobileFilterContent}>
                <div className={styles.filterSection}>
                  <h4>Danh Mục</h4>
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
                  <h4>Khoảng Giá</h4>
                  <ul className={styles.priceRanges}>
                    {priceRanges.map((range) => (
                      <li key={range.id}>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            checked={selectedPriceRange === range.id}
                            onChange={() => handlePriceRangeChange(range.id)}
                          />
                          <span className={styles.checkmark}></span>
                          <span>{range.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.filterSection}>
                  <h4>Đánh Giá</h4>
                  <ul className={styles.ratingFilter}>
                    {[5, 4, 3, 2, 1].map((ratingValue) => (
                      <li key={ratingValue}>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            checked={selectedRating === ratingValue}
                            onChange={() => handleRatingChange(ratingValue)}
                          />
                          <span className={styles.checkmark}></span>
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
                  <button className={styles.clearFiltersBtnMobile} onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </button>
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
