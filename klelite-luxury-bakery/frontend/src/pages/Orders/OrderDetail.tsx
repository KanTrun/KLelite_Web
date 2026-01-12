import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiTruck,
  FiCheck,
  FiX,
  FiMapPin,
  FiPhone,
  FiCreditCard,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import { orderService } from '@/services/orderService';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { Order, OrderStatus } from '@/types';
import styles from './OrderDetail.module.scss';
import { formatCurrency } from '@/utils/formatters';

const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string; step: number }> = {
  pending: { label: 'Chờ xác nhận', icon: <FiClock />, color: '#F59E0B', step: 1 },
  confirmed: { label: 'Đã xác nhận', icon: <FiCheck />, color: '#3B82F6', step: 2 },
  processing: { label: 'Đang chuẩn bị', icon: <FiPackage />, color: '#8B5CF6', step: 3 },
  shipping: { label: 'Đang giao hàng', icon: <FiTruck />, color: '#10B981', step: 4 },
  delivered: { label: 'Đã giao hàng', icon: <FiCheck />, color: '#059669', step: 5 },
  cancelled: { label: 'Đã hủy', icon: <FiX />, color: '#EF4444', step: 0 },
  returned: { label: 'Đã trả hàng', icon: <FiRefreshCw />, color: '#6B7280', step: 0 }
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin đơn hàng';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

    try {
      setCancelling(true);
      await orderService.cancelOrder(order.id);
      await fetchOrder(order.id);
      alert('Đã hủy đơn hàng thành công');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể hủy đơn hàng';
      alert(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    try {
      for (const item of order.items) {
        // Handle both populated object and string ID
        const productId = typeof item.product === 'string' ? item.product : item.product.id;
        await dispatch(addToCart({ productId, quantity: item.quantity })).unwrap();
      }
      navigate('/cart');
    } catch {
      alert('Có lỗi khi thêm sản phẩm vào giỏ hàng');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <FiAlertCircle style={{ fontSize: '3rem', color: '#EF4444', marginBottom: '1rem' }} />
            <h3>Không tìm thấy đơn hàng</h3>
            <p>{error || 'Đơn hàng không tồn tại hoặc đã bị xóa'}</p>
            <Link to="/orders" className={`${styles.btn} ${styles.primary}`} style={{ width: 'auto', marginTop: '20px' }}>
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = statusConfig[order.status]?.step || 0;
  const isCancelled = order.status === 'cancelled' || order.status === 'returned';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link to="/orders" className={styles.backButton}>
            <FiArrowLeft /> Quay lại danh sách
          </Link>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className={styles.title}>Đơn hàng <span>#{order.orderNumber}</span></h1>
            <p className={styles.subtitle}>
              Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </motion.div>
        </div>

        {/* Status Tracker */}
        <motion.div
          className={styles.statusCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.sectionTitle}>
            <FiCheck /> Trạng thái đơn hàng: <span style={{ color: statusConfig[order.status].color, marginLeft: '8px' }}>
              {statusConfig[order.status].label}
            </span>
          </div>

          {!isCancelled && (
            <div className={styles.progressTrack}>
              {[
                { key: 'pending', icon: <FiClock />, label: 'Đặt hàng' },
                { key: 'confirmed', icon: <FiCheck />, label: 'Đã xác nhận' },
                { key: 'processing', icon: <FiPackage />, label: 'Đang chuẩn bị' },
                { key: 'shipping', icon: <FiTruck />, label: 'Đang giao' },
                { key: 'delivered', icon: <FiCheck />, label: 'Giao thành công' },
              ].map((step, index) => (
                <div
                  key={step.key}
                  className={`${styles.step} ${index + 1 <= currentStep ? styles.active : ''} ${index + 1 < currentStep ? styles.completed : ''}`}
                >
                  <div className={styles.stepIcon}>{step.icon}</div>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className={styles.detailsGrid}>
          {/* Main Info */}
          <div className={styles.mainInfo}>
            {/* Items */}
            <motion.div
              className={styles.itemsCard}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className={styles.sectionTitle}>
                <FiPackage /> Sản phẩm ({order.items.length})
              </h3>
              <div className={styles.itemList}>
                {order.items.map((item, index) => (
                  <div key={index} className={styles.item}>
                    <img
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.name}
                      className={styles.itemImage}
                    />
                    <div className={styles.itemInfo}>
                      <h4>{item.name}</h4>
                      {/* Assuming variant/size might be added later, currently mostly name/qty/price */}
                      <div className={styles.itemMeta}>
                        <span className={styles.price}>{formatCurrency(item.price)}</span>
                        <span className={styles.quantity}>x{item.quantity}</span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, color: '#C9A962' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>Tổng tiền hàng</span>
                <span>{formatCurrency(order.items.reduce((acc, item) => acc + item.price * item.quantity, 0))}</span>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Info */}
          <motion.div
            className={styles.sidebar}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Shipping Info */}
            <div className={styles.infoCard}>
              <h3 className={styles.sectionTitle}>
                <FiMapPin /> Địa chỉ nhận hàng
              </h3>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>{order.shippingAddress.fullName}</div>
              <div style={{ color: '#666', fontSize: '0.95rem', marginBottom: '8px' }}>
                {order.shippingAddress.address}, {order.shippingAddress.district}, {order.shippingAddress.city}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.95rem' }}>
                <FiPhone /> {order.shippingAddress.phone}
              </div>
            </div>

            {/* Payment Info */}
            <div className={styles.infoCard}>
              <h3 className={styles.sectionTitle}>
                <FiCreditCard /> Thanh toán
              </h3>
              <div className={styles.infoRow}>
                <span>Phương thức</span>
                <span>
                  {order.payment.method === 'cod' ? 'Thanh toán khi nhận hàng' :
                   order.payment.method === 'bank_transfer' ? 'Chuyển khoản' :
                   order.payment.method}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span>Trạng thái</span>
                <span style={{
                  color: order.payment.status === 'paid' ? '#059669' :
                         order.payment.status === 'failed' ? '#EF4444' : '#F59E0B'
                }}>
                  {order.payment.status === 'paid' ? 'Đã thanh toán' :
                   order.payment.status === 'failed' ? 'Thất bại' : 'Chờ thanh toán'}
                </span>
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.infoCard}>
              <h3 className={styles.sectionTitle}>Tổng quan</h3>
              <div className={styles.infoRow}>
                <span>Tạm tính</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className={styles.infoRow}>
                  <span>Giảm giá</span>
                  <span style={{ color: '#059669' }}>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className={styles.totalRow} style={{ marginTop: '16px', paddingTop: '16px' }}>
                <span>Tổng cộng</span>
                <span>{formatCurrency(order.total)}</span>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <button
                    className={`${styles.btn} ${styles.danger}`}
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                  </button>
                )}

                {(order.status === 'delivered' || order.status === 'cancelled') && (
                  <button
                    className={`${styles.btn} ${styles.primary}`}
                    onClick={handleReorder}
                  >
                    <FiRefreshCw /> Mua lại đơn này
                  </button>
                )}

                <a
                  href={`tel:${order.shippingAddress.phone}`} // Assuming support phone but using user phone for now or just generic
                  className={`${styles.btn} ${styles.secondary}`}
                  onClick={(e) => { e.preventDefault(); alert('Liên hệ hotline: 1900 xxxx'); }}
                >
                  <FiPhone /> Liên hệ hỗ trợ
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
