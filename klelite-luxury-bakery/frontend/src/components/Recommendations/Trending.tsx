import React, { useEffect, useState } from 'react';
import { Product } from '@/types/product.types';
import ProductCard from '@/components/common/ProductCard';
import { recommendationService } from '@/services/recommendationService';
import styles from './Recommendations.module.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Trending: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      const data = await recommendationService.getTrending();
      setProducts(data);
      setLoading(false);
    };

    fetchTrending();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className={styles.recommendationSection}>
      <h2 className={styles.title}>Xu hướng tuần này</h2>

      <div className={styles.productList}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className={styles.swiper}
        >
          {products.map((product) => (
            <SwiperSlide key={product._id}>
              <ProductCard
                id={product._id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                image={product.images[0]?.url}
                rating={product.rating}
                reviewCount={product.numReviews}
                category={typeof product.category === 'object' ? product.category.name : undefined}
                isOutOfStock={!product.isAvailable}
                isBestseller
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Trending;
