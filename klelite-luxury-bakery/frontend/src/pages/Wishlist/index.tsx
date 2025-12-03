import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart,
  FiShoppingCart,
  FiTrash2,
  FiShare2,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';
import { RootState, AppDispatch } from '@/store';
import { addToCart } from '@/store/slices/cartSlice';
import { userService } from '@/services/userService';
import { productService } from '@/services/productService';
import { formatCurrency } from '@/utils/formatters';
import Loading from '@/components/common/Loading';
import type { WishlistItem, Product } from '@/types';
import styles from './Wishlist.module.scss';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getWishlist();
      setWishlistItems(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const { products } = await productService.getProducts({ limit: 4, featured: true });
      setRecommendedProducts(products);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/wishlist' } });
      return;
    }
    fetchWishlist();
    fetchRecommendations();
  }, [isAuthenticated, navigate, fetchWishlist, fetchRecommendations]);

  const handleRemoveItem = async (productId: string) => {
    try {
      setRemoving(productId);
      await userService.removeFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item.product._id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      setAddingToCart(product._id);
      await dispatch(addToCart({ 
        productId: product._id, 
        quantity: 1 
      })).unwrap();
      // Optional: Remove from wishlist after adding to cart
      // await handleRemoveItem(product._id);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm yêu thích?')) {
      return;
    }
    try {
      setLoading(true);
      // Remove all items one by one (could be optimized with batch API)
      await Promise.all(
        wishlistItems.map((item) => userService.removeFromWishlist(item.product._id))
      );
      setWishlistItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (product: any) => {
    const shareData = {
      title: product.name,
      text: `Xem sản phẩm ${product.name} tại KL'élite`,
      url: `${window.location.origin}/products/${product.slug}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Đã sao chép link sản phẩm!');
      }
    } catch (error) {
      console.log('Share cancelled');
    }
  };

  const getProductImage = (product: any): string => {
    if (product.mainImage) return product.mainImage;
    if (product.images && product.images.length > 0) {
      if (typeof product.images[0] === 'string') return product.images[0];
      return product.images[0]?.url || '/images/placeholder-product.png';
    }
    return '/images/placeholder-product.png';
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.wishlistPage}>
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wishlistPage}>
      <div className={styles.container}>
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerContent}>
            <h1>
              <FiHeart /> Sản phẩm yêu thích
            </h1>
            <p>{wishlistItems.length} sản phẩm</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.refreshBtn} onClick={fetchWishlist} title="Làm mới">
              <FiRefreshCw />
            </button>
            {wishlistItems.length > 0 && (
              <button className={styles.clearAllBtn} onClick={handleClearAll}>
                <FiTrash2 /> Xóa tất cả
              </button>
            )}
          </div>
        </motion.div>

        {wishlistItems.length === 0 ? (
          <motion.div
            className={styles.emptyWishlist}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.emptyIcon}>
              <FiHeart />
            </div>
            <h2>Danh sách yêu thích trống</h2>
            <p>Hãy thêm những sản phẩm bạn yêu thích để theo dõi và mua sau</p>
            <Link to="/products" className={styles.shopNowBtn}>
              Khám phá sản phẩm
              <FiArrowRight />
            </Link>
          </motion.div>
        ) : (
          <div className={styles.wishlistGrid}>
            <AnimatePresence>
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={item._id}
                  className={styles.wishlistCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={styles.cardImage}>
                    <Link to={`/products/${item.product.slug}`}>
                      <img 
                        src={getProductImage(item.product)} 
                        alt={item.product.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
                        }}
                      />
                    </Link>
                    {item.product.comparePrice && item.product.comparePrice > item.product.price && (
                      <span className={styles.saleBadge}>
                        -
                        {Math.round(
                          ((item.product.comparePrice - item.product.price) /
                            item.product.comparePrice) *
                            100
                        )}
                        %
                      </span>
                    )}
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemoveItem(item.product._id)}
                      disabled={removing === item.product._id}
                      title="Xóa khỏi yêu thích"
                    >
                      {removing === item.product._id ? (
                        <FiRefreshCw className={styles.spinning} />
                      ) : (
                        <FiTrash2 />
                      )}
                    </button>
                  </div>

                  <div className={styles.cardContent}>
                    <Link to={`/products/${item.product.slug}`} className={styles.productName}>
                      {item.product.name}
                    </Link>

                    <div className={styles.priceSection}>
                      <span className={styles.currentPrice}>
                        {formatCurrency(item.product.price)}
                      </span>
                      {item.product.comparePrice && item.product.comparePrice > item.product.price && (
                        <span className={styles.originalPrice}>
                          {formatCurrency(item.product.comparePrice)}
                        </span>
                      )}
                    </div>

                    <div className={styles.stockInfo}>
                      {item.product.stock > 0 ? (
                        <span className={styles.inStock}>Còn {item.product.stock} sản phẩm</span>
                      ) : (
                        <span className={styles.outOfStock}>Hết hàng</span>
                      )}
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.addToCartBtn}
                        onClick={() => handleAddToCart(item.product)}
                        disabled={item.product.stock === 0 || addingToCart === item.product._id}
                      >
                        {addingToCart === item.product._id ? (
                          <FiRefreshCw className={styles.spinning} />
                        ) : (
                          <FiShoppingCart />
                        )}
                        {item.product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </button>
                      <button 
                        className={styles.shareBtn}
                        onClick={() => handleShare(item.product)}
                        title="Chia sẻ"
                      >
                        <FiShare2 />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Recommendations */}
        {recommendedProducts.length > 0 && (
          <section className={styles.recommendations}>
            <h2>Có thể bạn cũng thích</h2>
            <div className={styles.recoGrid}>
              {recommendedProducts.map((product) => (
                <Link 
                  key={product._id} 
                  to={`/products/${product.slug}`}
                  className={styles.recoCard}
                >
                  <div className={styles.recoImage}>
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
                      }}
                    />
                  </div>
                  <div className={styles.recoContent}>
                    <h4>{product.name}</h4>
                    <span>{formatCurrency(product.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
