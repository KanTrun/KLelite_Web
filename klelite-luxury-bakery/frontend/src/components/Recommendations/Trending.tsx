import React, { useEffect, useState, useRef } from 'react';
import { Product } from '@/types/product.types';
import ProductCard from '@/components/common/ProductCard';
import { recommendationService } from '@/services/recommendationService';
import styles from './Recommendations.module.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Trending: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<SwiperType>();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      const data = await recommendationService.getTrending();
      setProducts(data);
      setLoading(false);
    };

    fetchTrending();
  }, []);

  const handleAddToCart = (id: string) => {
    addToCart(id, 1);
    toast.success('Đã thêm vào giỏ hàng');
  };

  const handleAction = () => {
    toast('Tính năng đang phát triển', { icon: '🚧' });
  };

  if (loading || products.length === 0) return null;

  return (
    <section className={styles.recommendationSection}>
      <h2 className={styles.title}>Xu hướng tuần này</h2>

      <div className={styles.productList}>
        <div className={styles.navigationContainer}>
          <button
            className={`${styles.swiperNavButton} ${styles.prev}`}
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous slide"
          >
            <FiChevronLeft />
          </button>

          <button
            className={`${styles.swiperNavButton} ${styles.next}`}
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next slide"
          >
            <FiChevronRight />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation={false}
            pagination={{ clickable: true, el: `.${styles.swiperPagination}` }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            onBeforeInit={(swiper) => {
              swiperRef.current = swiper;
            }}
            breakpoints={{
              480: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
            className={styles.swiper}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  image={product.images[0]?.url || '/placeholder.png'}
                  rating={product.rating ? Number(product.rating) : 0}
                  reviewCount={product.numReviews}
                  category={typeof product.category === 'object' ? product.category.name : undefined}
                  isOutOfStock={!product.isAvailable}
                  isBestseller
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleAction}
                  onQuickView={handleAction}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className={styles.swiperPagination} />
        </div>
      </div>
    </section>
  );
};

export default Trending;
