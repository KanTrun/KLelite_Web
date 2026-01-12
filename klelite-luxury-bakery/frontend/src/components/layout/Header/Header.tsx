import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiHeart, FiChevronDown } from 'react-icons/fi';
import { useAuth, useCart } from '@/hooks';
import { AppDispatch, RootState } from '@/store';
import { fetchCurrentTheme } from '@/store/slices/themeSlice';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { SearchBar } from '@/components/common/SearchBar';
import NotificationBell from '@/components/Notifications/NotificationBell';
import { SnowfallEffect, FireworksEffect, ValentineEffect } from '@/components/common/SeasonalEffects';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentTheme } = useSelector((state: RootState) => state.theme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();
  const { cartItemsCount } = useCart();

  useEffect(() => {
    dispatch(fetchCurrentTheme());
  }, [dispatch]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Build header class based on theme type
  const getHeaderClass = () => {
    const classes = [styles.header];
    if (isScrolled) classes.push(styles.scrolled);
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
        return <FireworksEffect intensity="medium" />;
      case 'valentine':
        return <ValentineEffect intensity="light" />;
      default:
        return null;
    }
  };

  return (
    <header className={getHeaderClass()}>
      {/* Seasonal Effect Overlay - wrapped in container to not affect dropdowns */}
      <div className={styles.seasonalEffectsWrapper}>
        {renderSeasonalEffect()}
      </div>
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
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Search */}
          <button
            className={styles.iconButton}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Tìm kiếm sản phẩm"
            aria-expanded={isSearchOpen}
            aria-controls="search-panel"
          >
            <FiSearch aria-hidden="true" />
          </button>

          {/* Wishlist */}
          {isAuthenticated && (
            <Link to="/wishlist" className={styles.iconButton} aria-label="Danh sách yêu thích">
              <FiHeart aria-hidden="true" />
            </Link>
          )}

          {/* Notifications */}
          {isAuthenticated && <NotificationBell />}

          {/* Cart */}
          <Link to="/cart" className={styles.iconButton} aria-label={`Giỏ hàng: ${cartItemsCount} sản phẩm`}>
            <FiShoppingCart aria-hidden="true" />
            {cartItemsCount > 0 && (
              <span className={styles.badge} aria-hidden="true">{cartItemsCount}</span>
            )}
          </Link>

          {/* User */}
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.userButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                aria-label="Menu tài khoản"
              >
                <FiUser aria-hidden="true" />
                <span>{user?.firstName}</span>
                <FiChevronDown className={isDropdownOpen ? styles.rotated : ''} aria-hidden="true" />
              </button>
              <div
                className={`${styles.dropdown} ${isDropdownOpen ? styles.open : ''}`}
                role="menu"
                aria-orientation="vertical"
              >
                <Link to="/profile" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)} role="menuitem">Tài khoản</Link>
                <Link to="/orders" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)} role="menuitem">Đơn hàng</Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)} role="menuitem">Quản trị</Link>
                )}
                <div className={styles.dropdownDivider} role="separator" />
                <button
                  onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                  className={`${styles.dropdownItem} ${styles.danger}`}
                  role="menuitem"
                >
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

      {/* Search Bar with Auto-suggestions */}
      {isSearchOpen && (
        <div className={styles.searchPanel} id="search-panel">
          <SearchBar
            onClose={() => setIsSearchOpen(false)}
            autoFocus
            className={styles.searchBarComponent}
          />
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
