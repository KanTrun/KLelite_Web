import React from 'react';
import ProductCard from '@/components/common/ProductCard';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import styles from './Recommendations.module.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export const RecentlyViewed: React.FC = () => {
  const { recentProducts } = useRecentlyViewed();

  if (recentProducts.length === 0) return null;

  return (
    <section className={styles.recommendationSection}>
      <h2 className={styles.title}>Đã xem gần đây</h2>

      <div className={styles.productList}>
        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          breakpoints={{
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className={styles.swiper}
        >
          {recentProducts.map((product) => (
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
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};
