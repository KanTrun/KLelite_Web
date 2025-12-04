import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiTrendingUp,
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiGrid,
  FiHome,
  FiLogOut,
} from 'react-icons/fi';
import { RootState, AppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import styles from './Admin.module.scss';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, actions }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const navItems = [
    { path: '/admin', icon: <FiTrendingUp />, label: 'Dashboard', badge: null as string | null },
    { path: '/admin/orders', icon: <FiShoppingBag />, label: 'Đơn hàng', badge: null as string | null },
    { path: '/admin/products', icon: <FiPackage />, label: 'Sản phẩm', badge: null as string | null },
    { path: '/admin/categories', icon: <FiGrid />, label: 'Danh mục', badge: null as string | null },
    { path: '/admin/users', icon: <FiUsers />, label: 'Tài khoản', badge: null as string | null },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Get display name
  const displayName = (user as any)?.fullName || (user as any)?.firstName ? 
    `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() : 
    'Admin';
  const initials = displayName.charAt(0).toUpperCase() || 'A';

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.adminSidebar}>
        <div className={styles.sidebarLogo}>
          <Link to="/">KL'<span>élite</span></Link>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={isActive(item.path) ? styles.active : ''}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className={styles.sidebarBottom}>
          <Link to="/" className={styles.backToSite}>
            <FiHome />
            <span>Về trang chủ</span>
          </Link>
          
          <div className={styles.sidebarUser}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {initials}
              </div>
              <div>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
              </div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Đăng xuất">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.adminMain}>
        {/* Page Header - only show if title provided */}
        {title && (
          <div className={styles.pageHeader}>
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className={styles.headerActions}>{actions}</div>}
          </div>
        )}

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
