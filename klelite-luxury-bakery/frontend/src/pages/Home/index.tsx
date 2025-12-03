import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiStar, FiTruck, FiHeart, FiAward } from 'react-icons/fi';
import styles from './Home.module.scss';

// Animation variants following claudekit-engineer timing (200-500ms)
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94], // ease-out
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay,
      ease: [0.34, 1.56, 0.64, 1], // bounce
    },
  }),
};

// Sample featured products (would come from API)
const featuredProducts = [
  {
    id: '1',
    name: 'Royal Chocolate Dream',
    slug: 'royal-chocolate-dream',
    category: 'Bánh Sinh Nhật',
    price: 850000,
    originalPrice: 1000000,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
    rating: 4.9,
    reviewCount: 128,
    isNew: true,
  },
  {
    id: '2',
    name: 'Tiramisu Classic',
    slug: 'tiramisu-classic',
    category: 'Bánh Ngọt',
    price: 650000,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
    rating: 4.8,
    reviewCount: 96,
    isBestseller: true,
  },
  {
    id: '3',
    name: 'Wedding Elegance',
    slug: 'wedding-elegance',
    category: 'Bánh Cưới',
    price: 2500000,
    image: 'https://images.unsplash.com/photo-1535254973040-607b474d7f5b?w=600',
    rating: 5.0,
    reviewCount: 42,
    isFeatured: true,
  },
  {
    id: '4',
    name: 'Fruit Paradise',
    slug: 'fruit-paradise',
    category: 'Bánh Trái Cây',
    price: 750000,
    originalPrice: 850000,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
    rating: 4.7,
    reviewCount: 84,
    isSale: true,
  },
];

const categories = [
  {
    name: 'Bánh Sinh Nhật',
    description: 'Làm rạng ngời ngày đặc biệt',
    image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800',
    slug: 'banh-sinh-nhat',
    count: 45,
  },
  {
    name: 'Bánh Cưới',
    description: 'Hoàn hảo cho ngày trọng đại',
    image: 'https://images.unsplash.com/photo-1535254973040-607b474d7f5b?w=800',
    slug: 'banh-cuoi',
    count: 28,
  },
  {
    name: 'Bánh Ngọt',
    description: 'Hương vị tinh tế mỗi ngày',
    image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800',
    slug: 'banh-ngot',
    count: 62,
  },
  {
    name: 'Bánh Mì Artisan',
    description: 'Nghệ thuật từ lò nướng',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    slug: 'banh-mi',
    count: 35,
  },
];

const features = [
  {
    icon: <FiStar />,
    title: 'Nguyên Liệu Cao Cấp',
    description: 'Sử dụng 100% nguyên liệu tươi ngon, được chọn lọc kỹ lưỡng từ các nhà cung cấp uy tín nhất.',
  },
  {
    icon: <FiAward />,
    title: 'Đầu Bếp Chuyên Nghiệp',
    description: 'Đội ngũ Pastry Chef được đào tạo bài bản từ các học viện ẩm thực hàng đầu châu Âu.',
  },
  {
    icon: <FiTruck />,
    title: 'Giao Hàng Tận Tâm',
    description: 'Giao hàng trong ngày với xe chuyên dụng, đảm bảo bánh luôn hoàn hảo khi đến tay bạn.',
  },
  {
    icon: <FiHeart />,
    title: 'Thiết Kế Theo Yêu Cầu',
    description: 'Tùy chỉnh mẫu mã, hương vị và thông điệp theo mong muốn của từng khách hàng.',
  },
];

const testimonials = [
  {
    name: 'Nguyễn Minh Anh',
    role: 'Khách hàng thân thiết',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content: 'Bánh của KL\'élite luôn vượt qua mọi kỳ vọng. Hương vị tinh tế, thiết kế sang trọng - hoàn hảo cho mọi dịp lễ của gia đình tôi.',
    rating: 5,
  },
  {
    name: 'Trần Đức Hùng',
    role: 'Wedding Planner',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    content: 'Đối tác tin cậy cho mọi đám cưới tôi tổ chức. Chất lượng nhất quán, dịch vụ chuyên nghiệp và luôn đúng hẹn.',
    rating: 5,
  },
  {
    name: 'Lê Thị Hương',
    role: 'Food Blogger',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    content: 'Từng miếng bánh là một tác phẩm nghệ thuật. KL\'élite xứng đáng với danh hiệu "Luxury Bakery" mà họ theo đuổi.',
    rating: 5,
  },
];

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      {/* ============================================ */}
      {/* Hero Section - Storytelling First Impression */}
      {/* ============================================ */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroOverlay} />
          <img
            src="https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=1920"
            alt="Luxury Bakery Background"
            className={styles.heroBgImage}
          />
        </div>

        <div className={styles.heroContainer}>
          <motion.div
            className={styles.heroContent}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span className={styles.heroTagline} variants={fadeInUp} custom={0}>
              ✨ Nghệ Thuật Ẩm Thực Đỉnh Cao
            </motion.span>

            <motion.h1 className={styles.heroTitle} variants={fadeInUp} custom={0.1}>
              Bánh Cao Cấp
              <span className={styles.heroTitleAccent}>Cho Khoảnh Khắc</span>
              <span className={styles.heroTitleHighlight}>Đặc Biệt</span>
            </motion.h1>

            <motion.p className={styles.heroDescription} variants={fadeInUp} custom={0.2}>
              Khám phá bộ sưu tập bánh thủ công được chế tác từ những nguyên liệu premium nhất,
              mang đến trải nghiệm ẩm thực độc đáo và sang trọng cho mọi dịp.
            </motion.p>

            <motion.div className={styles.heroActions} variants={fadeInUp} custom={0.3}>
              <Link to="/products" className={styles.heroPrimaryBtn}>
                <span>Khám Phá Ngay</span>
                <FiArrowRight />
              </Link>
              <Link to="/about" className={styles.heroSecondaryBtn}>
                Câu Chuyện Của Chúng Tôi
              </Link>
            </motion.div>

            <motion.div className={styles.heroStats} variants={fadeInUp} custom={0.4}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>5000+</span>
                <span className={styles.heroStatLabel}>Khách hàng</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>150+</span>
                <span className={styles.heroStatLabel}>Loại bánh</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>4.9</span>
                <span className={styles.heroStatLabel}>Đánh giá</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.heroImageWrapper}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className={styles.heroImageMain}>
              <img
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"
                alt="Luxury Chocolate Cake"
              />
            </div>
            <motion.div
              className={styles.heroImageFloat1}
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img
                src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=400"
                alt="Pastry"
              />
            </motion.div>
            <motion.div
              className={styles.heroImageFloat2}
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <img
                src="https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400"
                alt="Fruit Cake"
              />
            </motion.div>
            <div className={styles.heroDecoration}>
              <span className={styles.heroDecorationText}>Premium Quality</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className={styles.scrollIndicator}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>Cuộn xuống</span>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollWheel} />
          </div>
        </motion.div>
      </section>

      {/* ============================================ */}
      {/* Features Section - Trust Building */}
      {/* ============================================ */}
      <section className={styles.features}>
        <div className={styles.container}>
          <motion.div
            className={styles.featureGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={styles.featureCard}
                variants={scaleIn}
                custom={index * 0.1}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Categories Section - Navigation */}
      {/* ============================================ */}
      <section className={styles.categories}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <span className={styles.sectionLabel}>Danh Mục</span>
            <h2 className={styles.sectionTitle}>Khám Phá Bộ Sưu Tập</h2>
            <p className={styles.sectionSubtitle}>
              Từ bánh sinh nhật độc đáo đến bánh cưới sang trọng, chúng tôi mang đến sự hoàn hảo cho mọi dịp
            </p>
          </motion.div>

          <motion.div
            className={styles.categoryGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            {categories.map((category, index) => (
              <motion.div key={category.slug} variants={fadeInUp} custom={index * 0.1}>
                <Link to={`/products?category=${category.slug}`} className={styles.categoryCard}>
                  <div className={styles.categoryImageWrapper}>
                    <img src={category.image} alt={category.name} />
                    <div className={styles.categoryOverlay} />
                  </div>
                  <div className={styles.categoryContent}>
                    <span className={styles.categoryCount}>{category.count} sản phẩm</span>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    <p className={styles.categoryDescription}>{category.description}</p>
                    <span className={styles.categoryLink}>
                      Xem thêm <FiArrowRight />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Featured Products Section */}
      {/* ============================================ */}
      <section className={styles.featured}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <span className={styles.sectionLabel}>Nổi Bật</span>
            <h2 className={styles.sectionTitle}>Sản Phẩm Được Yêu Thích</h2>
            <p className={styles.sectionSubtitle}>
              Những tác phẩm được khách hàng đánh giá cao nhất
            </p>
          </motion.div>

          <motion.div
            className={styles.productGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            {featuredProducts.map((product, index) => (
              <motion.article
                key={product.id}
                className={styles.productCard}
                variants={fadeInUp}
                custom={index * 0.1}
              >
                <Link to={`/products/${product.slug}`} className={styles.productImageWrapper}>
                  <img src={product.image} alt={product.name} />
                  <div className={styles.productOverlay} />
                  {product.isNew && <span className={styles.productBadgeNew}>Mới</span>}
                  {product.isBestseller && (
                    <span className={styles.productBadgeBest}>Bán chạy</span>
                  )}
                  {product.originalPrice && (
                    <span className={styles.productBadgeSale}>
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  )}
                </Link>

                <div className={styles.productContent}>
                  <span className={styles.productCategory}>{product.category}</span>
                  <h3 className={styles.productName}>
                    <Link to={`/products/${product.slug}`}>{product.name}</Link>
                  </h3>

                  <div className={styles.productRating}>
                    <div className={styles.productStars}>
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={i < Math.floor(product.rating) ? styles.starFilled : ''}
                        />
                      ))}
                    </div>
                    <span>({product.reviewCount})</span>
                  </div>

                  <div className={styles.productPricing}>
                    <span className={styles.productPrice}>{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className={styles.productOriginalPrice}>
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>

          <motion.div
            className={styles.viewAllWrapper}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/products" className={styles.viewAllBtn}>
              Xem Tất Cả Sản Phẩm
              <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Testimonials Section - Social Proof */}
      {/* ============================================ */}
      <section className={styles.testimonials}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <span className={styles.sectionLabel}>Đánh Giá</span>
            <h2 className={styles.sectionTitle}>Khách Hàng Nói Gì?</h2>
            <p className={styles.sectionSubtitle}>
              Niềm tin và sự hài lòng của khách hàng là thước đo thành công của chúng tôi
            </p>
          </motion.div>

          <motion.div
            className={styles.testimonialGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className={styles.testimonialCard}
                variants={fadeInUp}
                custom={index * 0.1}
              >
                <div className={styles.testimonialStars}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className={styles.starFilled} />
                  ))}
                </div>
                <p className={styles.testimonialContent}>"{testimonial.content}"</p>
                <div className={styles.testimonialAuthor}>
                  <img src={testimonial.avatar} alt={testimonial.name} />
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA Section - Conversion */}
      {/* ============================================ */}
      <section className={styles.cta}>
        <div className={styles.ctaBackground}>
          <img
            src="https://images.unsplash.com/photo-1517433670267-30f41c09c0a0?w=1920"
            alt="Bakery Interior"
          />
          <div className={styles.ctaOverlay} />
        </div>

        <div className={styles.container}>
          <motion.div
            className={styles.ctaContent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.span className={styles.ctaLabel} variants={fadeInUp}>
              Ưu Đãi Đặc Biệt
            </motion.span>
            <motion.h2 className={styles.ctaTitle} variants={fadeInUp} custom={0.1}>
              Đặt Bánh Ngay Hôm Nay
            </motion.h2>
            <motion.p className={styles.ctaDescription} variants={fadeInUp} custom={0.2}>
              Nhận ngay ưu đãi giảm <strong>15%</strong> cho đơn hàng đầu tiên <br />
              khi đăng ký thành viên KL'élite Club
            </motion.p>
            <motion.div className={styles.ctaActions} variants={fadeInUp} custom={0.3}>
              <Link to="/register" className={styles.ctaPrimaryBtn}>
                Đăng Ký Ngay
                <FiArrowRight />
              </Link>
              <Link to="/contact" className={styles.ctaSecondaryBtn}>
                Liên Hệ Tư Vấn
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Newsletter Section */}
      {/* ============================================ */}
      <section className={styles.newsletter}>
        <div className={styles.container}>
          <motion.div
            className={styles.newsletterContent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <div className={styles.newsletterText}>
              <h3>Nhận Ưu Đãi Độc Quyền</h3>
              <p>Đăng ký để nhận thông tin về sản phẩm mới và khuyến mãi đặc biệt</p>
            </div>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Nhập email của bạn..." />
              <button type="submit">
                Đăng Ký
                <FiArrowRight />
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
