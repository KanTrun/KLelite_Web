import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  FiArrowRight,
  FiStar,
  FiTruck,
  FiHeart,
  FiAward,
  FiClock,
  FiShield,
  FiGift,
} from 'react-icons/fi';
import styles from './Home.module.scss';

// ============================================
// Animation Variants - Professional Timing
// Following claudekit-engineer: 200-500ms for smooth feel
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1], // custom ease-out
    },
  }),
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ============================================
// Data - Featured Products & Categories
// ============================================
const featuredProducts = [
  {
    id: '1',
    name: 'Royal Chocolate Symphony',
    slug: 'royal-chocolate-symphony',
    category: 'Signature Collection',
    price: 1250000,
    originalPrice: 1500000,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
    rating: 5.0,
    reviewCount: 156,
    isNew: true,
    badge: 'Chef\'s Choice',
  },
  {
    id: '2',
    name: 'Tiramisu Royale',
    slug: 'tiramisu-royale',
    category: 'Italian Collection',
    price: 850000,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
    rating: 4.9,
    reviewCount: 128,
    isBestseller: true,
    badge: 'Bestseller',
  },
  {
    id: '3',
    name: 'Wedding Elegance',
    slug: 'wedding-elegance',
    category: 'Wedding Collection',
    price: 3500000,
    image: 'https://images.unsplash.com/photo-1535254973040-607b474d7f5b?w=600',
    rating: 5.0,
    reviewCount: 89,
    isFeatured: true,
    badge: 'Premium',
  },
  {
    id: '4',
    name: 'Fruit Paradise Deluxe',
    slug: 'fruit-paradise-deluxe',
    category: 'Fresh Collection',
    price: 950000,
    originalPrice: 1100000,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
    rating: 4.8,
    reviewCount: 103,
    badge: 'Sale',
  },
];

const categories = [
  {
    name: 'Signature Cakes',
    description: 'Tuyệt phẩm từ bậc thầy',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
    slug: 'signature-cakes',
    count: 45,
    highlight: 'Bestseller',
  },
  {
    name: 'Wedding Collection',
    description: 'Hoàn hảo cho ngày trọng đại',
    image: 'https://images.unsplash.com/photo-1535254973040-607b474d7f5b?w=800',
    slug: 'wedding-collection',
    count: 32,
    highlight: 'Premium',
  },
  {
    name: 'French Pastries',
    description: 'Nghệ thuật bánh Pháp',
    image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800',
    slug: 'french-pastries',
    count: 58,
    highlight: 'Popular',
  },
  {
    name: 'Artisan Breads',
    description: 'Hương vị thủ công',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    slug: 'artisan-breads',
    count: 28,
    highlight: 'New',
  },
];

const luxuryFeatures = [
  {
    icon: <FiAward />,
    title: 'Premium Ingredients',
    description: 'Nguyên liệu nhập khẩu từ Pháp, Bỉ & Thụy Sĩ. Chocolate Valrhona, bơ Échiré, cream tươi hàng ngày.',
    highlight: '100% Authentic',
  },
  {
    icon: <FiStar />,
    title: 'Master Pastry Chefs',
    description: 'Đội ngũ đầu bếp được đào tạo tại Le Cordon Bleu Paris, với hơn 15 năm kinh nghiệm.',
    highlight: 'World-Class',
  },
  {
    icon: <FiClock />,
    title: 'Fresh Daily',
    description: 'Mỗi chiếc bánh được làm mới mỗi ngày, đảm bảo hương vị tươi ngon nhất.',
    highlight: 'Daily Made',
  },
  {
    icon: <FiTruck />,
    title: 'White Glove Delivery',
    description: 'Giao hàng bằng xe chuyên dụng có điều hòa, đảm bảo bánh luôn hoàn hảo.',
    highlight: 'Premium Service',
  },
  {
    icon: <FiHeart />,
    title: 'Bespoke Creations',
    description: 'Thiết kế riêng theo yêu cầu của bạn, mang đến sự độc đáo cho mỗi dịp.',
    highlight: 'Customizable',
  },
  {
    icon: <FiShield />,
    title: 'Quality Guarantee',
    description: 'Cam kết hoàn tiền 100% nếu bạn không hài lòng với sản phẩm.',
    highlight: '100% Guaranteed',
  },
];

const testimonials = [
  {
    name: 'Nguyễn Minh Châu',
    role: 'CEO, Luxury Events',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content: 'KL\'élite đã biến đám cưới của tôi thành một tác phẩm nghệ thuật. Mỗi chi tiết trên chiếc bánh đều hoàn hảo đến từng milimet.',
    rating: 5,
    featured: true,
  },
  {
    name: 'Trần Đức Hùng',
    role: 'Wedding Planner',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    content: 'Đối tác tin cậy cho mọi sự kiện cao cấp. Chất lượng nhất quán và dịch vụ chuyên nghiệp vượt mọi kỳ vọng.',
    rating: 5,
  },
  {
    name: 'Lê Thị Hương Giang',
    role: 'Food Critic',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    content: 'Đây là định nghĩa của luxury bakery tại Việt Nam. Hương vị tinh tế, thiết kế đẳng cấp quốc tế.',
    rating: 5,
  },
];

const instagramPosts = [
  { id: 1, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', likes: 2345 },
  { id: 2, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', likes: 1892 },
  { id: 3, image: 'https://images.unsplash.com/photo-1535254973040-607b474d7f5b?w=400', likes: 3156 },
  { id: 4, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', likes: 2789 },
  { id: 5, image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=400', likes: 1654 },
  { id: 6, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', likes: 2103 },
];

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

// ============================================
// Home Component - Royal Luxury Design
// ============================================
const Home: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  return (
    <div className={styles.home}>
      {/* ============================================ */}
      {/* Hero Section - Royal First Impression */}
      {/* ============================================ */}
      <section className={styles.hero} ref={heroRef}>
        {/* Parallax Background */}
        <motion.div className={styles.heroBackground} style={{ y: heroY, scale: heroScale }}>
          <div className={styles.heroOverlay} />
          <img
            src="https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1920"
            alt="Luxury Bakery Ambiance"
            className={styles.heroBgImage}
          />
        </motion.div>

        {/* Decorative Elements */}
        <div className={styles.heroDecorations}>
          <div className={styles.heroGoldLine} />
          <div className={styles.heroGoldLineRight} />
          <motion.div
            className={styles.heroFloatingBadge}
            animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span>Est. 2020</span>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          className={styles.heroContent}
          style={{ opacity: heroOpacity }}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className={styles.heroTaglineWrapper} variants={fadeInUp} custom={0}>
            <div className={styles.heroTaglineLine} />
            <span className={styles.heroTagline}>The Art of Luxury Pastry</span>
            <div className={styles.heroTaglineLine} />
          </motion.div>

          <motion.h1 className={styles.heroTitle} variants={fadeInUp} custom={0.1}>
            <span className={styles.heroTitleMain}>KL'élite</span>
            <span className={styles.heroTitleSub}>Luxury Bakery</span>
          </motion.h1>

          <motion.p className={styles.heroDescription} variants={fadeInUp} custom={0.2}>
            Nơi nghệ thuật bánh ngọt gặp gỡ sự hoàn hảo. <br />
            Mỗi tác phẩm là một câu chuyện, mỗi hương vị là một kỷ niệm.
          </motion.p>

          <motion.div className={styles.heroActions} variants={fadeInUp} custom={0.3}>
            <Link to="/products" className={styles.heroPrimaryBtn}>
              <span>Khám Phá Bộ Sưu Tập</span>
              <FiArrowRight />
            </Link>
            <Link to="/about" className={styles.heroSecondaryBtn}>
              <span>Câu Chuyện Của Chúng Tôi</span>
            </Link>
          </motion.div>

          <motion.div className={styles.heroStats} variants={fadeInUp} custom={0.4}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>10K+</span>
              <span className={styles.heroStatLabel}>Khách hàng hài lòng</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>200+</span>
              <span className={styles.heroStatLabel}>Tác phẩm độc đáo</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>5.0</span>
              <span className={styles.heroStatLabel}>Đánh giá trung bình</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className={styles.scrollIndicator}
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>Cuộn để khám phá</span>
          <div className={styles.scrollLine}>
            <motion.div
              className={styles.scrollDot}
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ============================================ */}
      {/* Marquee Section - Luxury Brands */}
      {/* ============================================ */}
      <section className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          <div className={styles.marqueeContent}>
            {['Valrhona Chocolate', '✦', 'Échiré Butter', '✦', 'Madagascar Vanilla', '✦', 'Belgian Cream', '✦', 'French Flour', '✦', 'Swiss Precision', '✦'].map((item, index) => (
              <span key={index} className={item === '✦' ? styles.marqueeSymbol : styles.marqueeText}>
                {item}
              </span>
            ))}
            {['Valrhona Chocolate', '✦', 'Échiré Butter', '✦', 'Madagascar Vanilla', '✦', 'Belgian Cream', '✦', 'French Flour', '✦', 'Swiss Precision', '✦'].map((item, index) => (
              <span key={`dup-${index}`} className={item === '✦' ? styles.marqueeSymbol : styles.marqueeText}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* About Brief Section */}
      {/* ============================================ */}
      <section className={styles.aboutBrief}>
        <div className={styles.container}>
          <motion.div
            className={styles.aboutBriefContent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.div className={styles.aboutBriefLeft} variants={slideInLeft}>
              <span className={styles.sectionLabel}>Về Chúng Tôi</span>
              <h2 className={styles.aboutBriefTitle}>
                Nghệ Thuật <br />
                <span className={styles.titleAccent}>Hoàng Gia</span>
              </h2>
              <p className={styles.aboutBriefText}>
                KL'élite ra đời từ niềm đam mê cháy bỏng với nghệ thuật làm bánh và khát vọng
                mang đến trải nghiệm ẩm thực đỉnh cao cho người Việt. Mỗi chiếc bánh tại
                KL'élite đều được chế tác bởi những nghệ nhân hàng đầu, kết hợp giữa kỹ thuật
                Pháp truyền thống và sự sáng tạo đương đại.
              </p>
              <Link to="/about" className={styles.aboutBriefLink}>
                <span>Tìm hiểu thêm</span>
                <FiArrowRight />
              </Link>
            </motion.div>

            <motion.div className={styles.aboutBriefRight} variants={slideInRight}>
              <div className={styles.aboutBriefImageWrapper}>
                <img
                  src="https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800"
                  alt="KL'élite Master Pastry Chef"
                />
                <div className={styles.aboutBriefImageOverlay} />
                <motion.div
                  className={styles.aboutBriefFloatingCard}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <FiAward className={styles.floatingCardIcon} />
                  <div>
                    <span className={styles.floatingCardTitle}>Award Winning</span>
                    <span className={styles.floatingCardText}>Best Luxury Bakery 2024</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Categories Section - Elegant Grid */}
      {/* ============================================ */}
      <section className={styles.categories}>
        <div className={styles.categoriesBg} />
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <span className={styles.sectionLabel}>Bộ Sưu Tập</span>
            <h2 className={styles.sectionTitle}>Danh Mục Nổi Bật</h2>
            <p className={styles.sectionSubtitle}>
              Khám phá những bộ sưu tập bánh cao cấp được chế tác dành riêng cho những dịp đặc biệt
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
              <motion.div key={category.slug} variants={fadeInScale} custom={index * 0.1}>
                <Link to={`/products?category=${category.slug}`} className={styles.categoryCard}>
                  <div className={styles.categoryImageWrapper}>
                    <img src={category.image} alt={category.name} />
                    <div className={styles.categoryOverlay} />
                    <div className={styles.categoryShine} />
                  </div>
                  <div className={styles.categoryContent}>
                    <span className={styles.categoryHighlight}>{category.highlight}</span>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    <p className={styles.categoryDescription}>{category.description}</p>
                    <div className={styles.categoryFooter}>
                      <span className={styles.categoryCount}>{category.count} sản phẩm</span>
                      <span className={styles.categoryLink}>
                        Xem ngay <FiArrowRight />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Features Section - Luxury Highlights */}
      {/* ============================================ */}
      <section className={styles.features}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <span className={styles.sectionLabel}>Tại Sao Chọn Chúng Tôi</span>
            <h2 className={styles.sectionTitle}>Trải Nghiệm Đẳng Cấp</h2>
            <p className={styles.sectionSubtitle}>
              Mỗi chi tiết đều được chăm chút tỉ mỉ để mang đến sự hoàn hảo tuyệt đối
            </p>
          </motion.div>

          <motion.div
            className={styles.featureGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            {luxuryFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={styles.featureCard}
                variants={fadeInUp}
                custom={index * 0.08}
              >
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>{feature.icon}</div>
                  <span className={styles.featureHighlight}>{feature.highlight}</span>
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Featured Products Section */}
      {/* ============================================ */}
      <section className={styles.featured}>
        <div className={styles.featuredBg} />
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <span className={styles.sectionLabel}>Sản Phẩm Nổi Bật</span>
            <h2 className={styles.sectionTitle}>Tuyển Tập Tinh Hoa</h2>
            <p className={styles.sectionSubtitle}>
              Những tác phẩm được yêu thích và đánh giá cao nhất từ bộ sưu tập của chúng tôi
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
                variants={fadeInScale}
                custom={index * 0.1}
              >
                <Link to={`/products/${product.slug}`} className={styles.productImageWrapper}>
                  <img src={product.image} alt={product.name} />
                  <div className={styles.productOverlay} />
                  <div className={styles.productBadge}>{product.badge}</div>
                  <div className={styles.productQuickView}>
                    <FiGift />
                    <span>Xem chi tiết</span>
                  </div>
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
                    <span className={styles.productReviews}>({product.reviewCount} đánh giá)</span>
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to="/products" className={styles.viewAllBtn}>
              <span>Xem Tất Cả Sản Phẩm</span>
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
            <span className={styles.sectionLabel}>Khách Hàng Nói Gì</span>
            <h2 className={styles.sectionTitle}>Đánh Giá & Nhận Xét</h2>
            <p className={styles.sectionSubtitle}>
              Sự hài lòng của khách hàng là thước đo thành công của chúng tôi
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
                className={`${styles.testimonialCard} ${testimonial.featured ? styles.testimonialFeatured : ''}`}
                variants={fadeInUp}
                custom={index * 0.12}
              >
                <div className={styles.testimonialQuote}>"</div>
                <p className={styles.testimonialContent}>{testimonial.content}</p>
                <div className={styles.testimonialStars}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className={styles.starFilled} />
                  ))}
                </div>
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
      {/* Instagram Section */}
      {/* ============================================ */}
      <section className={styles.instagram}>
        <div className={styles.container}>
          <motion.div
            className={styles.instagramHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2>@klelite.bakery</h2>
            <p>Theo dõi chúng tôi trên Instagram</p>
          </motion.div>

          <motion.div
            className={styles.instagramGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {instagramPosts.map((post, index) => (
              <motion.a
                key={post.id}
                href="https://instagram.com/klelite.bakery"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.instagramItem}
                variants={fadeInScale}
                custom={index * 0.08}
              >
                <img src={post.image} alt={`Instagram post ${post.id}`} />
                <div className={styles.instagramOverlay}>
                  <FiHeart />
                  <span>{post.likes.toLocaleString()}</span>
                </div>
              </motion.a>
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
            alt="Luxury Bakery Interior"
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
            <motion.div className={styles.ctaBadge} variants={fadeInUp}>
              <FiGift />
              <span>Ưu Đãi Đặc Biệt</span>
            </motion.div>

            <motion.h2 className={styles.ctaTitle} variants={fadeInUp} custom={0.1}>
              Trở Thành Thành Viên <br />
              <span className={styles.ctaTitleAccent}>KL'élite Club</span>
            </motion.h2>

            <motion.p className={styles.ctaDescription} variants={fadeInUp} custom={0.2}>
              Đăng ký ngay để nhận ưu đãi <strong>giảm 15%</strong> cho đơn hàng đầu tiên <br />
              cùng nhiều đặc quyền dành riêng cho thành viên
            </motion.p>

            <motion.div className={styles.ctaActions} variants={fadeInUp} custom={0.3}>
              <Link to="/register" className={styles.ctaPrimaryBtn}>
                <span>Đăng Ký Ngay</span>
                <FiArrowRight />
              </Link>
              <Link to="/contact" className={styles.ctaSecondaryBtn}>
                <span>Liên Hệ Tư Vấn</span>
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
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className={styles.newsletterText}>
              <h3>Nhận Thông Tin Ưu Đãi</h3>
              <p>Đăng ký để cập nhật sản phẩm mới và khuyến mãi độc quyền</p>
            </div>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <div className={styles.newsletterInputWrapper}>
                <input type="email" placeholder="Nhập email của bạn..." />
              </div>
              <button type="submit" className={styles.newsletterBtn}>
                <span>Đăng Ký</span>
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
