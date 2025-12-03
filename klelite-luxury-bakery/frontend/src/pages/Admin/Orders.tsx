import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiTruck,
  FiCheck,
  FiClock,
  FiXCircle,
  FiPrinter,
  FiRefreshCw,
} from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { orderService } from '@/services/orderService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Order } from '@/types';
import styles from './Admin.module.scss';

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Chờ xác nhận', icon: <FiClock />, color: '#ffc107' },
  confirmed: { label: 'Đã xác nhận', icon: <FiCheck />, color: '#17a2b8' },
  preparing: { label: 'Đang chuẩn bị', icon: <FiPackage />, color: '#6f42c1' },
  shipping: { label: 'Đang giao', icon: <FiTruck />, color: '#007bff' },
  delivered: { label: 'Đã giao', icon: <FiCheck />, color: '#28a745' },
  cancelled: { label: 'Đã hủy', icon: <FiXCircle />, color: '#dc3545' },
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: any = { page: currentPage, limit: 10 };
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      if (searchTerm) filters.search = searchTerm;
      
      const response = await orderService.getAllOrders(filters);
      setOrders(response.orders || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedStatus, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(true);
      await orderService.updateOrderStatus(orderId, newStatus as any);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus as any } : o));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Lỗi cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  return (
    <AdminLayout title="Quản lý đơn hàng" subtitle="Xem và cập nhật trạng thái đơn hàng"
      actions={<button className={styles.refreshBtn} onClick={fetchOrders} disabled={isLoading}>
        <FiRefreshCw className={isLoading ? styles.spinning : ''} /> Làm mới
      </button>}>
      
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input type="text" placeholder="Tìm kiếm theo mã đơn hoặc tên khách..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
          className={styles.filterSelect}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(statusConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loadingState}><FiRefreshCw className={styles.spinning} /><p>Đang tải...</p></div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}><FiPackage /><p>Không có đơn hàng nào</p></div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                return (
                  <tr key={order._id}>
                    <td className={styles.orderNumber}>{order.orderNumber}</td>
                    <td>
                      <div className={styles.customerInfo}>
                        <span>{order.shippingAddress?.fullName || 'N/A'}</span>
                        <small>{order.shippingAddress?.phone}</small>
                      </div>
                    </td>
                    <td>{order.items?.length || 0} sản phẩm</td>
                    <td className={styles.amount}>{formatCurrency(order.total || 0)}</td>
                    <td>
                      <span className={styles.statusBadge} style={{ background: `${status.color}20`, color: status.color }}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <button className={styles.viewBtn} onClick={() => handleViewOrder(order)} title="Xem chi tiết">
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FiChevronLeft /></button>
          <span>Trang {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FiChevronRight /></button>
        </div>
      )}

      <AnimatePresence>
        {showModal && selectedOrder && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}>
            <motion.div className={styles.modal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Chi tiết đơn hàng #{selectedOrder.orderNumber}</h2>
                <button className={styles.closeBtn} onClick={() => setShowModal(false)}><FiX /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.orderSection}>
                  <h3>Cập nhật trạng thái</h3>
                  <select value={selectedOrder.status} onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                    disabled={updating} className={styles.statusSelect}>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.orderSection}>
                  <h3>Khách hàng</h3>
                  <p><strong>{selectedOrder.shippingAddress?.fullName}</strong></p>
                  <p>{selectedOrder.shippingAddress?.phone}</p>
                  <p>{selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.ward}, {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.province}</p>
                </div>
                <div className={styles.orderSection}>
                  <h3>Sản phẩm ({selectedOrder.items?.length || 0})</h3>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className={styles.orderItem}>
                      <span>{item.product?.name || 'Sản phẩm'} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className={styles.orderTotal}>
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(selectedOrder.total || 0)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminOrders;
