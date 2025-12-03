import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiTrendingUp,
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiGrid,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi';
import { RootState } from '@/store';
import styles from './Admin.module.scss';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, actions }) => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const navItems = [
    { path: '/admin', icon: <FiTrendingUp />, label: 'Dashboard' },
    { path: '/admin/orders', icon: <FiShoppingBag />, label: 'Đơn hàng', badge: null },
    { path: '/admin/products', icon: <FiPackage />, label: 'Sản phẩm' },
    { path: '/admin/categories', icon: <FiGrid />, label: 'Danh mục' },
    { path: '/admin/users', icon: <FiUsers />, label: 'Tài khoản' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminSidebar}>
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

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.fullName || 'Admin'}</span>
              <span className={styles.userRole}>{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
            </div>
          </div>
          <Link to="/" className={styles.logoutBtn} title="Về trang chủ">
            <FiLogOut />
          </Link>
        </div>
      </div>

      <main className={styles.adminMain}>
        <div className={styles.adminHeader}>
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className={styles.headerActions}>{actions}</div>}
        </div>

        <div className={styles.adminContent}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
