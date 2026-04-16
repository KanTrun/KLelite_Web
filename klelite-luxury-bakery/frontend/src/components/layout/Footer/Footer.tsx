import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiFacebook, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { RootState } from '@/store';
import { SnowfallEffect, FireworksEffect, ValentineEffect } from '@/components/common/SeasonalEffects';
import styles from './Footer.module.scss';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { currentTheme } = useSelector((state: RootState) => state.theme);

  // Build footer class based on theme type
  const getFooterClass = () => {
    const classes = [styles.footer];
    if (currentTheme?.type === 'christmas') classes.push(styles.christmas);
    if (currentTheme?.type === 'tet') classes.push(styles.tet);
    if (currentTheme?.type === 'valentine') classes.push(styles.valentine);
    return classes.join(' ');
  };

  // Render seasonal effect based on theme type
  const renderSeasonalEffect = () => {
    if (!currentTheme) return null;
    
    switch (currentTheme.type) {
      case 'christmas':
        return <SnowfallEffect intensity="light" />;
      case 'tet':
        return <FireworksEffect intensity="light" />;
      case 'valentine':
        return <ValentineEffect intensity="light" />;
      default:
        return null;
    }
  };

  return (
    <footer className={getFooterClass()}>
      {/* Seasonal Effect Overlay */}
      <div className={styles.seasonalEffectsWrapper}>
        {renderSeasonalEffect()}
      </div>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoText}>KL'élite</span>
              <span className={styles.logoSubtext}>Luxury Bakery</span>
            </Link>
            <p className={styles.description}>
              Tiệm bánh cao cấp với những sản phẩm được làm từ nguyên liệu tươi ngon, 
              mang đến trải nghiệm ẩm thực tuyệt vời cho khách hàng.
            </p>
            <div className={styles.social}>
              <a href="https://www.facebook.com/kan.trun.204" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FiFacebook />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FiInstagram />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.column}>
            <h4>Liên kết nhanh</h4>
            <ul>
              <li><Link to="/products">Sản phẩm</Link></li>
              <li><Link to="/about">Giới thiệu</Link></li>
              <li><Link to="/contact">Liên hệ</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className={styles.column}>
            <h4>Hỗ trợ khách hàng</h4>
            <ul>
              <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
              <li><Link to="/shipping">Chính sách vận chuyển</Link></li>
              <li><Link to="/returns">Chính sách đổi trả</Link></li>
              <li><Link to="/privacy">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.column}>
            <h4>Liên hệ</h4>
            <ul className={styles.contact}>
              <li>
                <FiMapPin />
                <span>206/23 Xô Viết Nghệ Tĩnh, phường Thạnh Mỹ Tây, TP.HCM</span>
              </li>
              <li>
                <FiPhone />
                <a href="tel:0909073847">0909073847</a>
              </li>
              <li>
                <FiMail />
                <a href="mailto:khangtruongminh.work@gmail.com">khangtruongminh.work@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; {currentYear} KL'élite Luxury Bakery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
