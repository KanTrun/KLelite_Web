import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiSave,
  FiX,
  FiShoppingBag,
  FiHeart,
  FiLogOut,
  FiLock,
  FiPlus,
  FiTrash2,
  FiChevronRight,
  FiTag,
  FiPercent,
  FiCalendar,
  FiPackage,
  FiClock,
} from 'react-icons/fi';
import { AppDispatch, RootState } from '@/store';
import { logout, updateUserProfile } from '@/store/slices/authSlice';
import { voucherService, Voucher } from '@/services/voucherService';
import { orderService } from '@/services/orderService';
import { formatCurrency } from '@/utils/formatters';
import type { Order } from '@/types';
import styles from './Profile.module.scss';

type TabType = 'profile' | 'addresses' | 'orders' | 'vouchers' | 'password';

interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Fetch vouchers when tab is active
  useEffect(() => {
    if (activeTab === 'vouchers' && isAuthenticated) {
      setVouchersLoading(true);
      voucherService.getAvailableVouchers()
        .then(vouchers => setAvailableVouchers(vouchers))
        .catch(err => console.error('Error fetching vouchers:', err))
        .finally(() => setVouchersLoading(false));
    }
  }, [activeTab, isAuthenticated]);

  // Fetch orders when tab is active
  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      setOrdersLoading(true);
      orderService.getOrders({ sort: '-createdAt' })
        .then(response => {
          // response có thể là object có data hoặc là array trực tiếp
          const ordersData = Array.isArray(response) ? response : (response.data || response);
          setUserOrders(Array.isArray(ordersData) ? ordersData : []);
        })
        .catch(err => {
          console.error('Error fetching orders:', err);
          setUserOrders([]);
        })
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, isAuthenticated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Update local state (TODO: Implement API call)
      dispatch(updateUserProfile(formData));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    // TODO: Implement password change API
    alert('Đổi mật khẩu thành công!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'profile' as TabType, label: 'Thông tin cá nhân', icon: <FiUser /> },
    { id: 'addresses' as TabType, label: 'Địa chỉ giao hàng', icon: <FiMapPin /> },
    { id: 'orders' as TabType, label: 'Đơn hàng của tôi', icon: <FiShoppingBag /> },
    { id: 'vouchers' as TabType, label: 'Voucher của tôi', icon: <FiTag /> },
    { id: 'password' as TabType, label: 'Đổi mật khẩu', icon: <FiLock /> },
  ];

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Chờ xác nhận', color: '#ffc107' },
    confirmed: { label: 'Đã xác nhận', color: '#17a2b8' },
    preparing: { label: 'Đang chuẩn bị', color: '#6f42c1' },
    shipping: { label: 'Đang giao', color: '#007bff' },
    delivered: { label: 'Đã giao', color: '#28a745' },
    cancelled: { label: 'Đã hủy', color: '#dc3545' },
  };

  const paymentStatusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Chưa thanh toán', color: '#ffc107' },
    paid: { label: 'Đã thanh toán', color: '#28a745' },
    failed: { label: 'Thanh toán thất bại', color: '#dc3545' },
    refunded: { label: 'Đã hoàn tiền', color: '#6c757d' },
  };

  const paymentMethodLabels: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng',
    momo: 'Ví MoMo',
    vnpay: 'VNPay',
    card: 'Thẻ tín dụng/ghi nợ',
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        <div className={styles.profileLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.firstName} />
                ) : (
                  <span>{user.firstName?.charAt(0) || 'U'}</span>
                )}
              </div>
              <h3>{`${user.firstName} ${user.lastName}`}</h3>
              <p>{user.email}</p>
            </div>

            <nav className={styles.sidebarNav}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <FiChevronRight className={styles.arrow} />
                </button>
              ))}
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <FiLogOut />
                <span>Đăng xuất</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                className={styles.tabContent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className={styles.tabHeader}>
                  <h2>Thông tin cá nhân</h2>
                  {!isEditing ? (
                    <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                      <FiEdit2 /> Chỉnh sửa
                    </button>
                  ) : (
                    <div className={styles.editActions}>
                      <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                        <FiX /> Hủy
                      </button>
                      <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={isLoading}>
                        <FiSave /> Lưu
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.profileForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>
                        <FiUser /> Họ
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p>{user.firstName}</p>
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <FiUser /> Tên
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p>{user.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <FiMail /> Email
                    </label>
                    <p className={styles.readOnly}>{user.email}</p>
                    <span className={styles.hint}>Email không thể thay đổi</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <FiPhone /> Số điện thoại
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Nhập số điện thoại"
                      />
                    ) : (
                      <p>{user.phone || 'Chưa cập nhật'}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <motion.div
                className={styles.tabContent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className={styles.tabHeader}>
                  <h2>Địa chỉ giao hàng</h2>
                  <button className={styles.addBtn}>
                    <FiPlus /> Thêm địa chỉ
                  </button>
                </div>

                <div className={styles.addressList}>
                  {user.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((address: Address, index: number) => (
                      <div key={address.id || index} className={styles.addressCard}>
                        {address.isDefault && (
                          <span className={styles.defaultBadge}>Mặc định</span>
                        )}
                        <div className={styles.addressInfo}>
                          <h4>{address.fullName}</h4>
                          <p>{address.phone}</p>
                          <p>{`${address.address}, ${address.ward}, ${address.district}, ${address.city}`}</p>
                        </div>
                        <div className={styles.addressActions}>
                          <button className={styles.editAddressBtn}>
                            <FiEdit2 />
                          </button>
                          <button className={styles.deleteAddressBtn}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <FiMapPin />
                      <p>Bạn chưa có địa chỉ nào</p>
                      <button className={styles.addFirstBtn}>
                        <FiPlus /> Thêm địa chỉ đầu tiên
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                className={styles.tabContent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className={styles.tabHeader}>
                  <h2>Đơn hàng của tôi</h2>
                </div>

                {ordersLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải đơn hàng...</p>
                  </div>
                ) : userOrders.length > 0 ? (
                  <div className={styles.orderList}>
                    {userOrders.map((order) => (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          <span className={styles.orderNumber}>
                            <FiPackage /> {order.orderNumber}
                          </span>
                          <span
                            className={styles.orderStatus}
                            style={{ 
                              backgroundColor: `${statusLabels[order.status]?.color}20`,
                              color: statusLabels[order.status]?.color 
                            }}
                          >
                            {statusLabels[order.status]?.label || order.status}
                          </span>
                        </div>
                        
                        <div className={styles.orderItems}>
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className={styles.orderItem}>
                              <img 
                                src={item.image || '/placeholder-product.png'} 
                                alt={item.name}
                                className={styles.itemImage}
                              />
                              <div className={styles.itemInfo}>
                                <span className={styles.itemName}>{item.name}</span>
                                <span className={styles.itemQuantity}>
                                  x{item.quantity} {item.size && `(${item.size})`}
                                </span>
                              </div>
                              <span className={styles.itemPrice}>
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className={styles.moreItems}>
                              +{order.items.length - 2} sản phẩm khác
                            </div>
                          )}
                        </div>

                        <div className={styles.orderInfo}>
                          <div className={styles.orderDate}>
                            <FiClock />
                            <span>Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div className={styles.orderPayment}>
                            <span className={styles.paymentMethod}>
                              {paymentMethodLabels[order.payment?.method] || order.payment?.method}
                            </span>
                            <span 
                              className={styles.paymentStatus}
                              style={{ color: paymentStatusLabels[order.payment?.status]?.color }}
                            >
                              {paymentStatusLabels[order.payment?.status]?.label || order.payment?.status}
                            </span>
                          </div>
                        </div>

                        <div className={styles.orderFooter}>
                          <div className={styles.orderTotal}>
                            <span>Tổng tiền:</span>
                            <strong>{formatCurrency(order.total)}</strong>
                          </div>
                          <Link to={`/orders/${order.id}`} className={styles.viewOrderBtn}>
                            Xem chi tiết
                            <FiChevronRight />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <FiShoppingBag />
                    <p>Bạn chưa có đơn hàng nào</p>
                    <Link to="/products" className={styles.shopNowBtn}>
                      Mua sắm ngay
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            {/* Vouchers Tab */}
            {activeTab === 'vouchers' && (
              <motion.div
                className={styles.tabContent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className={styles.tabHeader}>
                  <h2>Voucher của tôi</h2>
                  <p className={styles.tabDescription}>
                    Các voucher có sẵn mà bạn có thể sử dụng khi thanh toán
                  </p>
                </div>

                {vouchersLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải voucher...</p>
                  </div>
                ) : availableVouchers.length > 0 ? (
                  <div className={styles.voucherGrid}>
                    {availableVouchers.map((voucher) => (
                      <div key={voucher.id} className={styles.voucherCard}>
                        <div className={styles.voucherLeft}>
                          <div className={styles.voucherIcon}>
                            <FiPercent />
                          </div>
                          <div className={styles.voucherValue}>
                            {voucher.type === 'percentage' 
                              ? `${voucher.value}%` 
                              : formatCurrency(voucher.value)}
                          </div>
                        </div>
                        <div className={styles.voucherRight}>
                          <div className={styles.voucherCode}>{voucher.code}</div>
                          <div className={styles.voucherDescription}>{voucher.description}</div>
                          <div className={styles.voucherConditions}>
                            {voucher.minOrderValue > 0 && (
                              <span>Đơn tối thiểu {formatCurrency(voucher.minOrderValue)}</span>
                            )}
                            {voucher.maxDiscount && voucher.type === 'percentage' && (
                              <span>Giảm tối đa {formatCurrency(voucher.maxDiscount)}</span>
                            )}
                          </div>
                          <div className={styles.voucherExpiry}>
                            <FiCalendar />
                            <span>HSD: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <FiTag />
                    <p>Bạn chưa có voucher nào</p>
                    <p className={styles.emptyDescription}>
                      Hãy theo dõi các chương trình khuyến mãi để nhận voucher!
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <motion.div
                className={styles.tabContent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className={styles.tabHeader}>
                  <h2>Đổi mật khẩu</h2>
                </div>

                <form onSubmit={handleChangePassword} className={styles.passwordForm}>
                  <div className={styles.formGroup}>
                    <label>
                      <FiLock /> Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <FiLock /> Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu mới"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <FiLock /> Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                    />
                  </div>

                  <button type="submit" className={styles.changePasswordBtn}>
                    Đổi mật khẩu
                  </button>
                </form>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
