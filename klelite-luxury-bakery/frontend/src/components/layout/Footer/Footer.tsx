import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import styles from './Footer.module.scss';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
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
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
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
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </li>
              <li>
                <FiPhone />
                <a href="tel:0123456789">0123 456 789</a>
              </li>
              <li>
                <FiMail />
                <a href="mailto:contact@klelite.com">contact@klelite.com</a>
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
