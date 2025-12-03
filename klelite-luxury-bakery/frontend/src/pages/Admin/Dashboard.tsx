import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiArrowUpRight,
  FiArrowDownRight,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';
import { orderService, OrderStats } from '@/services/orderService';
import { productService } from '@/services/productService';
import { adminUserService } from '@/services/userService';
import AdminLayout from './AdminLayout';
import type { Order } from '@/types';
import styles from './Admin.module.scss';

interface DashboardStats {
  revenue: { value: number; change: number };
  orders: { value: number; change: number };
  customers: { value: number; change: number };
  products: { value: number; change: number };
}

interface QuickStats {
  pendingOrders: number;
  shippingOrders: number;
  outOfStockProducts: number;
}

const statusConfig = {
  pending: { label: 'Chờ xác nhận', icon: <FiClock />, color: '#ffc107' },
  confirmed: { label: 'Đã xác nhận', icon: <FiCheckCircle />, color: '#17a2b8' },
  preparing: { label: 'Đang chuẩn bị', icon: <FiPackage />, color: '#6f42c1' },
  shipping: { label: 'Đang giao', icon: <FiTruck />, color: '#007bff' },
  delivered: { label: 'Đã giao', icon: <FiCheckCircle />, color: '#28a745' },
  cancelled: { label: 'Đã hủy', icon: <FiAlertCircle />, color: '#dc3545' },
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    revenue: { value: 0, change: 0 },
    orders: { value: 0, change: 0 },
    customers: { value: 0, change: 0 },
    products: { value: 0, change: 0 },
  });
  const [quickStats, setQuickStats] = useState<QuickStats>({
    pendingOrders: 0,
    shippingOrders: 0,
    outOfStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [orderStats, productsData, usersData, recentOrdersData] = await Promise.all([
        orderService.getOrderStats(),
        productService.getProducts({ limit: 1000 }),
        adminUserService.getUsers(1, 1000),
        orderService.getRecentOrders(5),
      ]);

      // Calculate stats
      const totalProducts = productsData.pagination?.totalItems || productsData.products.length;
      const totalCustomers = usersData.total || usersData.users.length;
      const outOfStock = productsData.products.filter((p: any) => p.stock === 0).length;

      // Set stats with changes (simplified - you can enhance with previous month comparison)
      setStats({
        revenue: { 
          value: orderStats.monthRevenue, 
          change: orderStats.totalRevenue > 0 ? Math.round((orderStats.monthRevenue / orderStats.totalRevenue) * 100) : 0 
        },
        orders: { 
          value: orderStats.monthOrders, 
          change: orderStats.todayOrders > 0 ? Math.round((orderStats.todayOrders / Math.max(orderStats.monthOrders, 1)) * 100) : 0 
        },
        customers: { value: totalCustomers, change: 0 },
        products: { value: totalProducts, change: outOfStock > 0 ? -Math.round((outOfStock / totalProducts) * 100) : 0 },
      });

      // Set quick stats
      setQuickStats({
        pendingOrders: orderStats.pendingOrders,
        shippingOrders: orderStats.ordersByStatus?.shipping || 0,
        outOfStockProducts: outOfStock,
      });

      // Set recent orders
      if (recentOrdersData.orders) {
        setRecentOrders(recentOrdersData.orders);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const statCards = [
    {
      title: 'Doanh thu',
      value: formatCurrency(stats.revenue.value),
      change: stats.revenue.change,
      icon: <FiDollarSign />,
      color: '#28a745',
      bgColor: 'rgba(40, 167, 69, 0.1)',
    },
    {
      title: 'Đơn hàng',
      value: stats.orders.value,
      change: stats.orders.change,
      icon: <FiShoppingBag />,
      color: '#007bff',
      bgColor: 'rgba(0, 123, 255, 0.1)',
    },
    {
      title: 'Khách hàng',
      value: stats.customers.value,
      change: stats.customers.change,
      icon: <FiUsers />,
      color: '#6f42c1',
      bgColor: 'rgba(111, 66, 193, 0.1)',
    },
    {
      title: 'Sản phẩm',
      value: stats.products.value,
      change: stats.products.change,
      icon: <FiPackage />,
      color: '#fd7e14',
      bgColor: 'rgba(253, 126, 20, 0.1)',
    },
  ];

  return (
    <AdminLayout>
      <div className={styles.pageContent}>
        <div className={styles.adminHeader}>
          <div>
            <h1>Dashboard</h1>
            <p>Tổng quan hoạt động kinh doanh</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.refreshBtn} 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? styles.spinning : ''} />
              {refreshing ? 'Đang tải...' : 'Làm mới'}
            </button>
            <span className={styles.dateRange}>
              {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <FiRefreshCw className={styles.spinning} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={styles.statIcon} style={{ background: stat.bgColor, color: stat.color }}>
                {stat.icon}
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{stat.title}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </div>
              <div className={`${styles.statChange} ${stat.change >= 0 ? styles.positive : styles.negative}`}>
                {stat.change >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />}
                <span>{Math.abs(stat.change)}%</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Grid */}
        <div className={styles.contentGrid}>
          {/* Recent Orders */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Đơn hàng gần đây</h2>
              <Link to="/admin/orders" className={styles.viewAllLink}>
                Xem tất cả
              </Link>
            </div>
            <div className={styles.ordersTable}>
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => {
                      const status = order.status as keyof typeof statusConfig;
                      const config = statusConfig[status] || statusConfig.pending;
                      return (
                        <tr key={order._id}>
                          <td className={styles.orderNumber}>{order.orderNumber}</td>
                          <td>{order.shippingAddress?.fullName || 'N/A'}</td>
                          <td className={styles.amount}>{formatCurrency(order.total)}</td>
                          <td>
                            <span
                              className={styles.statusBadge}
                              style={{
                                background: `${config.color}20`,
                                color: config.color,
                              }}
                            >
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className={styles.time}>{formatRelativeTime(order.createdAt)}</td>
                          <td>
                            <Link to={`/admin/orders?id=${order._id}`} className={styles.actionBtn}>
                              <FiEye />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className={styles.emptyState}>
                        Chưa có đơn hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Thống kê nhanh</h2>
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStatItem}>
                <div className={styles.quickStatIcon} style={{ background: '#ffc10720', color: '#ffc107' }}>
                  <FiClock />
                </div>
                <div>
                  <span className={styles.quickStatValue}>{quickStats.pendingOrders}</span>
                  <span className={styles.quickStatLabel}>Đơn chờ xác nhận</span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div className={styles.quickStatIcon} style={{ background: '#007bff20', color: '#007bff' }}>
                  <FiTruck />
                </div>
                <div>
                  <span className={styles.quickStatValue}>{quickStats.shippingOrders}</span>
                  <span className={styles.quickStatLabel}>Đơn đang giao</span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div className={styles.quickStatIcon} style={{ background: '#dc354520', color: '#dc3545' }}>
                  <FiAlertCircle />
                </div>
                <div>
                  <span className={styles.quickStatValue}>{quickStats.outOfStockProducts}</span>
                  <span className={styles.quickStatLabel}>Sản phẩm hết hàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
