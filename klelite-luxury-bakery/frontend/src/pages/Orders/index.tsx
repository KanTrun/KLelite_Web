import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiClock,
  FiTruck,
  FiCheck,
  FiX,
  FiEye,
  FiRefreshCw,
  FiChevronDown,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiAlertCircle
} from 'react-icons/fi';
import { orderService } from '@/services/orderService';
import { useAppDispatch } from '@/store/hooks';
import { addToCart, addToLocalCart } from '@/store/slices/cartSlice';
import { useAuth } from '@/hooks/useAuth';
import type { Order, OrderStatus } from '@/types';
import styles from './Orders.module.scss';

const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Chờ xác nhận', icon: <FiClock />, color: '#F59E0B' },
  confirmed: { label: 'Đã xác nhận', icon: <FiCheck />, color: '#3B82F6' },
  processing: { label: 'Đang chuẩn bị', icon: <FiPackage />, color: '#8B5CF6' },
  shipping: { label: 'Đang giao hàng', icon: <FiTruck />, color: '#10B981' },
  delivered: { label: 'Đã giao hàng', icon: <FiCheck />, color: '#059669' },
  cancelled: { label: 'Đã hủy', icon: <FiX />, color: '#EF4444' },
  returned: { label: 'Đã trả hàng', icon: <FiRefreshCw />, color: '#6B7280' }
};

const statusTabs: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'processing', label: 'Đang chuẩn bị' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã hủy' }
];

const Orders: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getMyOrders({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        page: pagination.page,
        limit: 10
      });
      setOrders(response.orders);
      setPagination({
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải đơn hàng';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

    try {
      setCancellingOrder(orderId);
      await orderService.cancelOrder(orderId);
      fetchOrders();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể hủy đơn hàng';
      alert(errorMessage);
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      for (const item of order.items) {
        const productId = typeof item.product === 'string' ? item.product : item.product._id;
        if (isAuthenticated) {
          await dispatch(addToCart({ productId, quantity: item.quantity })).unwrap();
        } else {
          dispatch(addToLocalCart({ productId, quantity: item.quantity }));
        }
      }
      alert('Đã thêm các sản phẩm vào giỏ hàng!');
    } catch {
      alert('Có lỗi khi thêm sản phẩm vào giỏ hàng');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusProgress = (status: OrderStatus): number => {
    const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipping', 'delivered'];
    const index = statusOrder.indexOf(status);
    if (status === 'cancelled' || status === 'returned') return 0;
    return index >= 0 ? ((index + 1) / statusOrder.length) * 100 : 0;
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className={styles.ordersPage}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>
            <FiShoppingBag />
            Đơn hàng của tôi
          </h1>
          <p>Theo dõi và quản lý {pagination.total} đơn hàng của bạn</p>
        </motion.div>

        {/* Status Tabs */}
        <motion.div
          className={styles.statusTabs}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              className={selectedStatus === tab.key ? styles.active : ''}
              onClick={() => {
                setSelectedStatus(tab.key);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <div className={styles.ordersList}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <FiAlertCircle style={{ fontSize: '3rem', color: '#EF4444', marginBottom: '1rem' }} />
              <h3>Có lỗi xảy ra</h3>
              <p>{error}</p>
              <button onClick={fetchOrders} className={styles.retryBtn || styles.shopBtn}>Thử lại</button>
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              className={styles.emptyState}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FiPackage style={{ fontSize: '4rem', color: '#C9A962', marginBottom: '1.5rem' }} />
              <h3>Chưa có đơn hàng nào</h3>
              <p>Bạn chưa đặt đơn hàng nào {selectedStatus !== 'all' ? 'ở trạng thái này' : ''}</p>
              <Link to="/products" className={styles.shopBtn}>
                Khám phá sản phẩm
              </Link>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  className={styles.orderCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Order Header */}
                  <div className={styles.orderHeader} onClick={() => toggleOrderExpand(order._id)}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderNumber}>#{order.orderNumber}</span>
                      <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className={styles.orderStatus}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          color: statusConfig[order.status]?.color,
                          backgroundColor: `${statusConfig[order.status]?.color}15`
                        }}
                      >
                        {statusConfig[order.status]?.icon}
                        {statusConfig[order.status]?.label}
                      </span>
                      <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                      <motion.button
                        className={styles.expandButton}
                        animate={{ rotate: expandedOrder === order._id ? 180 : 0 }}
                      >
                        <FiChevronDown />
                      </motion.button>
                    </div>
                  </div>

                  {/* Order Progress */}
                  {order.status !== 'cancelled' && order.status !== 'returned' && (
                    <div className={styles.orderProgress}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${getStatusProgress(order.status)}%` }}
                      />
                    </div>
                  )}

                  {/* Order Items Preview */}
                  <div className={styles.orderItems}>
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className={styles.orderItem}>
                        <img
                          src={item.image || '/images/placeholder.jpg'}
                          alt={item.name}
                          className={styles.itemImage}
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemQuantity}>x{item.quantity}</span>
                        </div>
                        <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className={styles.moreItems}>
                        +{order.items.length - 2} sản phẩm khác
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedOrder === order._id && (
                      <motion.div
                        className={styles.expandedContent}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* All Items */}
                        {order.items.length > 2 && (
                          <div className={styles.allItems}>
                            <h4>Tất cả sản phẩm</h4>
                            {order.items.slice(2).map((item, idx) => (
                              <div key={idx} className={styles.orderItem}>
                                <img
                                  src={item.image || '/images/placeholder.jpg'}
                                  alt={item.name}
                                  className={styles.itemImage}
                                />
                                <div className={styles.itemInfo}>
                                  <span className={styles.itemName}>{item.name}</span>
                                  <span className={styles.itemQuantity}>x{item.quantity}</span>
                                </div>
                                <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Shipping Address */}
                        <div className={styles.shippingInfo}>
                          <h4><FiMapPin /> Địa chỉ giao hàng</h4>
                          <p style={{ fontWeight: 600, marginBottom: 4 }}>{order.shippingAddress.fullName}</p>
                          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 4 }}>
                            {order.shippingAddress.address}, {order.shippingAddress.district}, {order.shippingAddress.city}
                          </p>
                          <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', fontSize: '0.9rem' }}>
                            <FiPhone /> {order.shippingAddress.phone}
                          </p>
                        </div>

                        {/* Order Summary */}
                        <div className={styles.orderSummary}>
                          <div className={styles.summaryRow}>
                            <span>Tạm tính</span>
                            <span>{formatPrice(order.subtotal)}</span>
                          </div>
                          <div className={styles.summaryRow}>
                            <span>Phí vận chuyển</span>
                            <span>{formatPrice(order.shippingFee)}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className={styles.summaryRow} style={{ color: '#059669' }}>
                              <span>Giảm giá</span>
                              <span>-{formatPrice(order.discount)}</span>
                            </div>
                          )}
                          <div className={`${styles.summaryRow} ${styles.total}`}>
                            <span>Tổng cộng</span>
                            <span>{formatPrice(order.total)}</span>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div className={styles.paymentInfo}>
                          <h4>Thanh toán</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                            <span style={{ color: '#666' }}>Phương thức: {
                              order.payment.method === 'cod' ? 'Thanh toán khi nhận hàng' :
                              order.payment.method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                              order.payment.method
                            }</span>
                            <span style={{
                              fontWeight: 600,
                              color: order.payment.status === 'paid' ? '#059669' :
                                     order.payment.status === 'failed' ? '#EF4444' : '#F59E0B'
                            }}>
                              {order.payment.status === 'pending' && 'Chờ thanh toán'}
                              {order.payment.status === 'paid' && 'Đã thanh toán'}
                              {order.payment.status === 'failed' && 'Thanh toán thất bại'}
                              {order.payment.status === 'refunded' && 'Đã hoàn tiền'}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {(order.note || order.notes) && (
                          <div className={styles.orderNote}>
                            <h4>Ghi chú</h4>
                            <p style={{ fontStyle: 'italic', color: '#666' }}>{order.note || order.notes}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Order Actions */}
                  <div className={styles.orderActions}>
                    <Link to={`/orders/${order._id}`} className={styles.viewButton}>
                      <FiEye /> Chi tiết
                    </Link>
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button
                        className={styles.cancelButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order._id);
                        }}
                        disabled={cancellingOrder === order._id}
                      >
                        {cancellingOrder === order._id ? (
                          <span className={styles.buttonSpinner}></span>
                        ) : (
                          <>
                            <FiX /> Hủy đơn
                          </>
                        )}
                      </button>
                    )}
                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                      <button
                        className={styles.reorderButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(order);
                        }}
                      >
                        <FiRefreshCw /> Mua lại
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Trang trước
              </button>
              <span>Trang {pagination.page} / {pagination.totalPages}</span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
