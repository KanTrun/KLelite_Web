import React, { useEffect, useState } from 'react';
import { Product } from '@/types/product.types';
import ProductCard from '@/components/common/ProductCard';
import { recommendationService } from '@/services/recommendationService';
import styles from './Recommendations.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const ForYou: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForYou = async () => {
      setLoading(true);
      const data = await recommendationService.getForYou();
      setProducts(data);
      setLoading(false);
    };

    if (isAuthenticated) {
      fetchForYou();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || loading || products.length === 0) return null;

  return (
    <section className={styles.recommendationSection}>
      <h2 className={styles.title}>Dành riêng cho bạn</h2>

      <div className={styles.productGrid}>
        {products.map((product) => (
          <ProductCard
            key={product._id}
            id={product._id}
            name={product.name}
            slug={product.slug}
            price={product.price}
            image={product.images[0]?.url}
            rating={product.rating}
            reviewCount={product.numReviews}
            category={typeof product.category === 'object' ? product.category.name : undefined}
            isOutOfStock={!product.isAvailable}
          />
        ))}
      </div>
    </section>
  );
};

export default ForYou;
