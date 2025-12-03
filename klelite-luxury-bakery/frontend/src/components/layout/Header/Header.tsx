import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiHeart, FiChevronDown } from 'react-icons/fi';
import { useAuth, useCart } from '@/hooks';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItemsCount } = useCart();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: 'Trang chủ' },
    { path: '/products', label: 'Sản phẩm' },
    { path: '/about', label: 'Giới thiệu' },
    { path: '/contact', label: 'Liên hệ' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoText}>KL'élite</span>
          <span className={styles.logoSubtext}>Luxury Bakery</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Search */}
          <button 
            className={styles.iconButton}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Tìm kiếm"
          >
            <FiSearch />
          </button>

          {/* Wishlist */}
          {isAuthenticated && (
            <Link to="/wishlist" className={styles.iconButton} aria-label="Yêu thích">
              <FiHeart />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className={styles.iconButton} aria-label="Giỏ hàng">
            <FiShoppingCart />
            {cartItemsCount > 0 && (
              <span className={styles.badge}>{cartItemsCount}</span>
            )}
          </Link>

          {/* User */}
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button 
                className={styles.userButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
              >
                <FiUser />
                <span>{user?.firstName}</span>
                <FiChevronDown className={isDropdownOpen ? styles.rotated : ''} />
              </button>
              <div className={`${styles.dropdown} ${isDropdownOpen ? styles.open : ''}`}>
                <Link to="/profile" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>Tài khoản</Link>
                <Link to="/orders" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>Đơn hàng</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>Quản trị</Link>
                )}
                <div className={styles.dropdownDivider} />
                <button onClick={() => { handleLogout(); setIsDropdownOpen(false); }} className={`${styles.dropdownItem} ${styles.danger}`}>
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className={styles.loginButton}>
              Đăng nhập
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className={styles.menuToggle}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className={styles.searchBar}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            <button type="submit" className={styles.searchButton}>
              <FiSearch />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link to="/login" className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                  Đăng nhập
                </Link>
                <Link to="/register" className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
