import React, { useEffect, useState } from 'react';
import { Product } from '@/types/product.types';
import ProductCard from '@/components/common/ProductCard';
import { recommendationService } from '@/services/recommendationService';
import styles from './Recommendations.module.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface SimilarProductsProps {
  productId: string;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({ productId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      setLoading(true);
      const data = await recommendationService.getSimilarProducts(productId);
      setProducts(data);
      setLoading(false);
    };

    if (productId) {
      fetchSimilar();
    }
  }, [productId]);

  if (loading || products.length === 0) return null;

  return (
    <section className={styles.recommendationSection}>
      <h2 className={styles.title}>Có thể bạn sẽ thích</h2>

      <div className={styles.productList}>
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
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
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default SimilarProducts;
