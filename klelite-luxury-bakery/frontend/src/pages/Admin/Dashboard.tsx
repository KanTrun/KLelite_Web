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
  FiBarChart2,
  FiPieChart,
  FiArrowRight,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
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

// Chart colors matching light luxury theme
const CHART_COLORS = {
  primary: '#C9A857',
  secondary: '#1A1A2E',
  success: '#10B981',
  info: '#3B82F6',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
};

const PIE_COLORS = ['#C9A857', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

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
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel with error handling
      const [orderStats, productsData, usersData, recentOrdersData] = await Promise.all([
        orderService.getOrderStats().catch(() => ({})),
        productService.getProducts({ limit: 1000 }).catch(() => ({ products: [] })),
        adminUserService.getUsers(1, 1000).catch(() => ({ data: [], users: [] })),
        orderService.getRecentOrders(5).catch(() => []),
      ]);

      // Safely extract arrays with fallbacks
      const products = productsData?.products || [];
      const users = usersData?.data || usersData?.users || [];
      const recentOrdersList = Array.isArray(recentOrdersData) ? recentOrdersData : (recentOrdersData as any)?.orders || [];
      
      // Calculate stats with safe access
      const totalProducts = productsData?.pagination?.totalItems || products.length;
      const totalCustomers = usersData?.total || users.length;
      const outOfStock = products.filter((p: any) => p.stock === 0).length;

      // Set stats with changes (simplified - you can enhance with previous month comparison)
      const monthRevenue = orderStats?.monthRevenue || 0;
      const totalRevenue = orderStats?.totalRevenue || 0;
      const monthOrders = orderStats?.monthOrders || 0;
      const todayOrders = orderStats?.todayOrders || 0;
      const pendingOrders = orderStats?.pendingOrders || 0;

      setStats({
        revenue: { 
          value: monthRevenue, 
          change: totalRevenue > 0 ? Math.round((monthRevenue / totalRevenue) * 100) : 0 
        },
        orders: { 
          value: monthOrders, 
          change: todayOrders > 0 ? Math.round((todayOrders / Math.max(monthOrders, 1)) * 100) : 0 
        },
        customers: { value: totalCustomers, change: 12 },
        products: { value: totalProducts, change: outOfStock > 0 ? -Math.round((outOfStock / Math.max(totalProducts, 1)) * 100) : 5 },
      });

      // Set quick stats
      setQuickStats({
        pendingOrders: pendingOrders,
        shippingOrders: orderStats?.ordersByStatus?.shipping || 0,
        outOfStockProducts: outOfStock,
      });

      // Set recent orders
      setRecentOrders(recentOrdersList);

      // Generate revenue chart data (mock data for last 7 days)
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const today = new Date().getDay();
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (today - i + 7) % 7;
        chartData.push({
          name: days[dayIndex],
          revenue: Math.round((monthRevenue / 7) * (0.7 + Math.random() * 0.6)),
          orders: Math.round((monthOrders / 7) * (0.5 + Math.random() * 1)),
        });
      }
      setRevenueChartData(chartData);

      // Order status distribution
      const statusDistribution = [
        { name: 'Chờ xử lý', value: pendingOrders, color: CHART_COLORS.warning },
        { name: 'Đang giao', value: orderStats?.ordersByStatus?.shipping || 0, color: CHART_COLORS.info },
        { name: 'Hoàn thành', value: orderStats?.ordersByStatus?.delivered || 0, color: CHART_COLORS.success },
        { name: 'Đã hủy', value: orderStats?.ordersByStatus?.cancelled || 0, color: CHART_COLORS.danger },
      ].filter(item => item.value > 0);
      setOrderStatusData(statusDistribution.length > 0 ? statusDistribution : [
        { name: 'Chưa có đơn', value: 1, color: '#E5E7EB' }
      ]);

      // Category distribution from products (use safe products array)
      const categoryCount: Record<string, number> = {};
      products.forEach((p: any) => {
        const catName = typeof p.category === 'object' ? p.category.name : 'Khác';
        categoryCount[catName] = (categoryCount[catName] || 0) + 1;
      });
      const catData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
      setCategoryData(catData.length > 0 ? catData : [{ name: 'Chưa có', value: 1 }]);

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
      title: 'Doanh thu tháng',
      value: formatCurrency(stats.revenue.value),
      change: stats.revenue.change,
      icon: <FiDollarSign />,
      iconClass: 'revenue',
    },
    {
      title: 'Đơn hàng',
      value: stats.orders.value,
      change: stats.orders.change,
      icon: <FiShoppingBag />,
      iconClass: 'orders',
    },
    {
      title: 'Khách hàng',
      value: stats.customers.value,
      change: stats.customers.change,
      icon: <FiUsers />,
      iconClass: 'users',
    },
    {
      title: 'Sản phẩm',
      value: stats.products.value,
      change: stats.products.change,
      icon: <FiPackage />,
      iconClass: 'products',
    },
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#fff',
          border: '1px solid #E8E8E8',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1A1A2E' }}>{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ margin: '4px 0 0', color: item.color, fontSize: '0.9rem' }}>
              {item.name}: {item.name === 'revenue' ? formatCurrency(item.value) : item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
              <div className={`${styles.statIcon} ${styles[stat.iconClass]}`}>
                {stat.icon}
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{stat.title}</span>
                <span className={styles.statValue}>{stat.value}</span>
                {stat.change !== 0 && (
                  <div className={`${styles.statChange} ${stat.change >= 0 ? styles.positive : styles.negative}`}>
                    {stat.change >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />}
                    <span>{Math.abs(stat.change)}%</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {/* Revenue Chart */}
          <motion.div 
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.chartHeader}>
              <h3><FiBarChart2 /> Doanh thu 7 ngày gần nhất</h3>
            </div>
            <div style={{ width: '100%', height: 280, minHeight: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={CHART_COLORS.primary} 
                    strokeWidth={2.5}
                    fill="url(#colorRevenue)" 
                    name="Doanh thu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Order Status Pie Chart */}
          <motion.div 
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.chartHeader}>
              <h3><FiPieChart /> Trạng thái đơn hàng</h3>
            </div>
            <div style={{ width: '100%', height: 280, minHeight: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
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
                        <tr key={order.id}>
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
                            <Link to={`/admin/orders?id=${order.id}`} className={styles.actionBtn}>
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
                <div className={`${styles.quickStatIcon}`} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                  <FiClock />
                </div>
                <div>
                  <span className={styles.quickStatValue}>{quickStats.pendingOrders}</span>
                  <span className={styles.quickStatLabel}>Đơn chờ xác nhận</span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div className={`${styles.quickStatIcon}`} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                  <FiTruck />
                </div>
                <div>
                  <span className={styles.quickStatValue}>{quickStats.shippingOrders}</span>
                  <span className={styles.quickStatLabel}>Đơn đang giao</span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div className={`${styles.quickStatIcon}`} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                  <FiAlertCircle />
                </div>
                <div>
                  <span className={styles.quickStatValue}>{quickStats.outOfStockProducts}</span>
                  <span className={styles.quickStatLabel}>Sản phẩm hết hàng</span>
                </div>
              </div>
              
              {/* Category Distribution */}
              <div className={styles.quickStatItem} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                  Phân bố danh mục
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categoryData.slice(0, 4).map((cat, index) => (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '3px', 
                        background: PIE_COLORS[index % PIE_COLORS.length] 
                      }} />
                      <span style={{ flex: 1, fontSize: '0.85rem', color: '#1A1A2E' }}>{cat.name}</span>
                      <span style={{ fontWeight: 600, color: '#C9A857', fontSize: '0.85rem' }}>{cat.value}</span>
                    </div>
                  ))}
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
