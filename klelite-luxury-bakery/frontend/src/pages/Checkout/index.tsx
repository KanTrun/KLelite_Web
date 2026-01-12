import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiCheck,
  FiChevronRight,
  FiShoppingBag,
  FiArrowLeft,
  FiEdit2,
  FiPlus,
  FiTruck,
  FiTag,
  FiAlertCircle,
  FiPercent,
  FiX,
  FiCheckCircle,
} from 'react-icons/fi';
import { AppDispatch, RootState } from '@/store';
import { fetchCart, clearCart } from '@/store/slices/cartSlice';
import { orderService } from '@/services/orderService';
import { userService } from '@/services/userService';
import { voucherService, Voucher, AppliedVoucher } from '@/services/voucherService';
import { paymentService } from '@/services/paymentService';
import { formatCurrency } from '@/utils/formatters';
import Loading from '@/components/common/Loading';
import type { Address } from '@/types';
import styles from './Checkout.module.scss';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    icon: '💵',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng',
  },
  {
    id: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    icon: '🏦',
    description: 'Chuyển khoản qua tài khoản ngân hàng',
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: '📱',
    description: 'Thanh toán qua ví điện tử MoMo',
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    icon: '💳',
    description: 'Thanh toán qua cổng VNPay',
  },
];

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { cart, isLoading: cartLoading } = useSelector((state: RootState) => state.cart);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // States
  const [step, setStep] = useState(1); // 1: Địa chỉ, 2: Thanh toán, 3: Xác nhận
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [note, setNote] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Form for new address
  const [newAddress, setNewAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    province: '',
    district: '',
    ward: '',
    address: '',
    isDefault: false,
  });

  // Fetch cart and addresses on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    dispatch(fetchCart());
    fetchAddresses();
    fetchAvailableVouchers();
  }, [dispatch, isAuthenticated, navigate]);

  const fetchAvailableVouchers = async () => {
    try {
      const vouchers = await voucherService.getAvailableVouchers();
      setAvailableVouchers(vouchers);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await userService.getAddresses();
      // Handle both array and object with addresses property
      const addressList = Array.isArray(response)
        ? response
        : (response as any)?.addresses || [];
      setAddresses(addressList);
      // Select default address if exists
      if (Array.isArray(addressList) && addressList.length > 0) {
        const defaultAddr = addressList.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setSelectedAddressId(addressList[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setAddresses([]);
    }
  };

  // Calculate totals
  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const discount = appliedVoucher?.discount || 0;
  const total = subtotal + shippingFee - discount;

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updatedAddresses = await userService.addAddress({
        ...newAddress,
        city: newAddress.province,
      });
      setAddresses(updatedAddresses);
      // Select the last added address
      if (updatedAddresses.length > 0) {
        setSelectedAddressId(updatedAddresses[updatedAddresses.length - 1].id);
      }
      setShowAddressForm(false);
      setNewAddress({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        province: '',
        district: '',
        ward: '',
        address: '',
        isDefault: false,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể thêm địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      setVoucherLoading(true);
      setVoucherError(null);
      const result = await voucherService.validateVoucher(voucherCode, subtotal);
      if (result.valid && result.voucher) {
        setAppliedVoucher({
          code: result.voucher.code,
          discount: result.discount,
          type: result.voucher.type,
          value: result.voucher.value
        });
        setVoucherCode('');
        setShowVoucherList(false);
      } else {
        setVoucherError(result.message || 'Mã voucher không hợp lệ');
      }
    } catch (err: any) {
      setVoucherError(err.response?.data?.message || 'Không thể áp dụng voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleSelectVoucher = (voucher: Voucher) => {
    setVoucherCode(voucher.code);
    handleApplyVoucherDirect(voucher);
  };

  const handleApplyVoucherDirect = async (voucher: Voucher) => {
    try {
      setVoucherLoading(true);
      setVoucherError(null);
      const result = await voucherService.validateVoucher(voucher.code, subtotal);
      if (result.valid && result.voucher) {
        setAppliedVoucher({
          code: result.voucher.code,
          discount: result.discount,
          type: result.voucher.type,
          value: result.voucher.value
        });
        setVoucherCode('');
        setShowVoucherList(false);
      } else {
        setVoucherError(result.message || 'Không thể áp dụng voucher này');
      }
    } catch (err: any) {
      setVoucherError(err.response?.data?.message || 'Không thể áp dụng voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError(null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Vui lòng chọn địa chỉ giao hàng');
      setStep(1);
      return;
    }

    if (!cart?.items || cart.items.length === 0) {
      setError('Giỏ hàng trống');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderData = {
        items: cart.items.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          customization: item.customization,
        })),
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          address: `${selectedAddress.address}, ${selectedAddress.ward || ''}, ${selectedAddress.district}, ${selectedAddress.city || selectedAddress.province}`,
          city: selectedAddress.city || selectedAddress.province,
          district: selectedAddress.district,
          ward: selectedAddress.ward || '',
          isDefault: false,
        },
        paymentMethod: selectedPayment as any,
        note: note || undefined,
        voucherCode: appliedVoucher?.code || undefined,
      };

      const order = await orderService.createOrder(orderData);

      // Handle online payment methods
      if (selectedPayment === 'momo') {
        const momoPayment = await paymentService.createMoMoPayment(
          order.id,
          total,
          `Thanh toán đơn hàng ${order.orderNumber}`
        );
        window.location.href = momoPayment.payUrl;
        return;
      }

      if (selectedPayment === 'vnpay') {
        const vnpayPayment = await paymentService.createVNPayPayment(
          order.id,
          total,
          `Thanh toan don hang ${order.orderNumber}`
        );
        window.location.href = vnpayPayment.payUrl;
        return;
      }

      // COD or Bank Transfer
      setCreatedOrder(order);
      setOrderSuccess(true);
      dispatch(clearCart());

    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !selectedAddressId) {
      setError('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    setError(null);
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Loading state
  if (cartLoading && !cart) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.container}>
          <motion.div
            className={styles.emptyCart}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiShoppingBag className={styles.emptyIcon} />
            <h2>Giỏ hàng trống</h2>
            <p>Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán</p>
            <Link to="/products" className={styles.shopBtn}>
              Mua sắm ngay
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Order success
  if (orderSuccess && createdOrder) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.container}>
          <motion.div
            className={styles.orderSuccess}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.successIcon}>
              <FiCheck />
            </div>
            <h1>Đặt hàng thành công!</h1>
            <p>Cảm ơn bạn đã đặt hàng tại KL'élite</p>

            <div className={styles.orderInfo}>
              <div className={styles.orderInfoRow}>
                <span>Mã đơn hàng:</span>
                <strong>{createdOrder.orderNumber}</strong>
              </div>
              <div className={styles.orderInfoRow}>
                <span>Tổng thanh toán:</span>
                <strong>{formatCurrency(createdOrder.total)}</strong>
              </div>
              <div className={styles.orderInfoRow}>
                <span>Phương thức thanh toán:</span>
                <strong>
                  {paymentMethods.find(p => p.id === createdOrder.payment?.method)?.name || 'COD'}
                </strong>
              </div>
            </div>

            {selectedPayment === 'bank_transfer' && (
              <div className={styles.bankInfo}>
                <h3>Thông tin chuyển khoản</h3>
                <p>Ngân hàng: <strong>Vietcombank</strong></p>
                <p>Số tài khoản: <strong>1234567890</strong></p>
                <p>Chủ tài khoản: <strong>CÔNG TY KL'ELITE</strong></p>
                <p>Nội dung CK: <strong>{createdOrder.orderNumber}</strong></p>
              </div>
            )}

            <div className={styles.successActions}>
              <Link to={`/orders/${createdOrder.id}`} className={styles.viewOrderBtn}>
                Xem đơn hàng
              </Link>
              <Link to="/products" className={styles.continueBtn}>
                Tiếp tục mua sắm
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.checkoutHeader}>
          <Link to="/cart" className={styles.backBtn}>
            <FiArrowLeft />
            Quay lại giỏ hàng
          </Link>
          <h1>Thanh toán</h1>
        </div>

        {/* Progress Steps */}
        <div className={styles.progressSteps}>
          {[
            { num: 1, label: 'Địa chỉ giao hàng' },
            { num: 2, label: 'Phương thức thanh toán' },
            { num: 3, label: 'Xác nhận đơn hàng' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div
                className={`${styles.step} ${step >= s.num ? styles.active : ''} ${step > s.num ? styles.completed : ''}`}
                onClick={() => step > s.num && setStep(s.num)}
              >
                <div className={styles.stepNumber}>
                  {step > s.num ? <FiCheck /> : s.num}
                </div>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
              {idx < 2 && <div className={`${styles.stepLine} ${step > s.num ? styles.active : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className={styles.errorMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiAlertCircle />
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </motion.div>
        )}

        <div className={styles.checkoutLayout}>
          {/* Main Content */}
          <div className={styles.checkoutMain}>
            {/* Step 1: Address */}
            {step === 1 && (
              <motion.div
                className={styles.stepContent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className={styles.sectionHeader}>
                  <FiMapPin />
                  <h2>Địa chỉ giao hàng</h2>
                </div>

                {/* Address List */}
                <div className={styles.addressList}>
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.selected : ''}`}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <div className={styles.addressRadio}>
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                        />
                        <span className={styles.radioMark}></span>
                      </div>
                      <div className={styles.addressInfo}>
                        <div className={styles.addressName}>
                          <strong>{addr.fullName}</strong>
                          {addr.isDefault && <span className={styles.defaultTag}>Mặc định</span>}
                        </div>
                        <p className={styles.addressPhone}>{addr.phone}</p>
                        <p className={styles.addressDetail}>
                          {addr.address}, {addr.ward}, {addr.district}, {addr.city || addr.province}
                        </p>
                      </div>
                    </div>
                  ))}

                  {addresses.length === 0 && !showAddressForm && (
                    <div className={styles.noAddress}>
                      <p>Bạn chưa có địa chỉ nào</p>
                    </div>
                  )}
                </div>

                {/* Add New Address Button */}
                {!showAddressForm && (
                  <button
                    className={styles.addAddressBtn}
                    onClick={() => setShowAddressForm(true)}
                  >
                    <FiPlus />
                    Thêm địa chỉ mới
                  </button>
                )}

                {/* New Address Form */}
                {showAddressForm && (
                  <motion.form
                    className={styles.addressForm}
                    onSubmit={handleAddressSubmit}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <h3>Thêm địa chỉ mới</h3>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Họ và tên *</label>
                        <input
                          type="text"
                          value={newAddress.fullName}
                          onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Số điện thoại *</label>
                        <input
                          type="tel"
                          value={newAddress.phone}
                          onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Tỉnh/Thành phố *</label>
                        <input
                          type="text"
                          value={newAddress.province}
                          onChange={e => setNewAddress({ ...newAddress, province: e.target.value })}
                          placeholder="Ví dụ: TP. Hồ Chí Minh"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Quận/Huyện *</label>
                        <input
                          type="text"
                          value={newAddress.district}
                          onChange={e => setNewAddress({ ...newAddress, district: e.target.value })}
                          placeholder="Ví dụ: Quận 1"
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phường/Xã *</label>
                      <input
                        type="text"
                        value={newAddress.ward}
                        onChange={e => setNewAddress({ ...newAddress, ward: e.target.value })}
                        placeholder="Ví dụ: Phường Bến Nghé"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Địa chỉ chi tiết *</label>
                      <input
                        type="text"
                        value={newAddress.address}
                        onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                        placeholder="Số nhà, tên đường..."
                        required
                      />
                    </div>
                    <div className={styles.formCheckbox}>
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={newAddress.isDefault}
                        onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                      />
                      <label htmlFor="isDefault">Đặt làm địa chỉ mặc định</label>
                    </div>
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => setShowAddressForm(false)}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div
                className={styles.stepContent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className={styles.sectionHeader}>
                  <FiCreditCard />
                  <h2>Phương thức thanh toán</h2>
                </div>

                <div className={styles.paymentList}>
                  {paymentMethods.map(method => (
                    <div
                      key={method.id}
                      className={`${styles.paymentCard} ${selectedPayment === method.id ? styles.selected : ''}`}
                      onClick={() => setSelectedPayment(method.id)}
                    >
                      <div className={styles.paymentRadio}>
                        <input
                          type="radio"
                          name="payment"
                          checked={selectedPayment === method.id}
                          onChange={() => setSelectedPayment(method.id)}
                        />
                        <span className={styles.radioMark}></span>
                      </div>
                      <div className={styles.paymentIcon}>{method.icon}</div>
                      <div className={styles.paymentInfo}>
                        <strong>{method.name}</strong>
                        <p>{method.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voucher Section */}
                <div className={styles.voucherSection}>
                  <div className={styles.sectionHeader}>
                    <FiTag />
                    <h3>Mã giảm giá</h3>
                  </div>

                  {appliedVoucher ? (
                    <div className={styles.appliedVoucher}>
                      <div className={styles.appliedVoucherInfo}>
                        <FiCheckCircle className={styles.checkIcon} />
                        <div>
                          <strong>{appliedVoucher.code}</strong>
                          <span>Giảm {formatCurrency(appliedVoucher.discount)}</span>
                        </div>
                      </div>
                      <button
                        className={styles.removeVoucherBtn}
                        onClick={handleRemoveVoucher}
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.voucherInput}>
                        <input
                          type="text"
                          placeholder="Nhập mã voucher"
                          value={voucherCode}
                          onChange={e => setVoucherCode(e.target.value)}
                          disabled={voucherLoading}
                        />
                        <button
                          onClick={handleApplyVoucher}
                          disabled={voucherLoading || !voucherCode}
                        >
                          {voucherLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                        </button>
                      </div>

                      {voucherError && (
                        <p className={styles.voucherError}>{voucherError}</p>
                      )}

                      {availableVouchers.length > 0 && (
                        <div className={styles.availableVouchers}>
                          <button
                            className={styles.showVouchersBtn}
                            onClick={() => setShowVoucherList(!showVoucherList)}
                          >
                            <FiPercent />
                            Xem {availableVouchers.length} voucher có sẵn
                          </button>

                          {showVoucherList && (
                            <div className={styles.voucherList}>
                              {availableVouchers.map((voucher) => (
                                <div
                                  key={voucher.id}
                                  className={styles.voucherItem}
                                  onClick={() => handleSelectVoucher(voucher)}
                                >
                                  <div className={styles.voucherItemInfo}>
                                    <strong>{voucher.code}</strong>
                                    <span>
                                      Giảm {voucher.type === 'percentage'
                                        ? `${voucher.value}%`
                                        : formatCurrency(voucher.value)}
                                      {voucher.minOrder && ` cho đơn từ ${formatCurrency(voucher.minOrder)}`}
                                    </span>
                                    {voucher.maxDiscount && voucher.type === 'percentage' && (
                                      <span className={styles.maxDiscount}>
                                        Tối đa {formatCurrency(voucher.maxDiscount)}
                                      </span>
                                    )}
                                  </div>
                                  <span className={styles.voucherExpiry}>
                                    HSD: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Note */}
                <div className={styles.noteSection}>
                  <label>Ghi chú cho đơn hàng (tùy chọn)</label>
                  <textarea
                    placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi giao..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div
                className={styles.stepContent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className={styles.sectionHeader}>
                  <FiCheck />
                  <h2>Xác nhận đơn hàng</h2>
                </div>

                {/* Shipping Address Summary */}
                <div className={styles.confirmSection}>
                  <div className={styles.confirmHeader}>
                    <FiMapPin />
                    <h3>Địa chỉ giao hàng</h3>
                    <button onClick={() => setStep(1)} className={styles.editBtn}>
                      <FiEdit2 /> Sửa
                    </button>
                  </div>
                  {selectedAddress && (
                    <div className={styles.confirmContent}>
                      <p><strong>{selectedAddress.fullName}</strong> - {selectedAddress.phone}</p>
                      <p>
                        {selectedAddress.address}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.city || selectedAddress.province}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Method Summary */}
                <div className={styles.confirmSection}>
                  <div className={styles.confirmHeader}>
                    <FiCreditCard />
                    <h3>Phương thức thanh toán</h3>
                    <button onClick={() => setStep(2)} className={styles.editBtn}>
                      <FiEdit2 /> Sửa
                    </button>
                  </div>
                  <div className={styles.confirmContent}>
                    <p>
                      {paymentMethods.find(p => p.id === selectedPayment)?.icon}{' '}
                      {paymentMethods.find(p => p.id === selectedPayment)?.name}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className={styles.confirmSection}>
                  <div className={styles.confirmHeader}>
                    <FiShoppingBag />
                    <h3>Sản phẩm đặt mua ({cart?.items.length})</h3>
                    <Link to="/cart" className={styles.editBtn}>
                      <FiEdit2 /> Sửa
                    </Link>
                  </div>
                  <div className={styles.orderItems}>
                    {cart?.items.map(item => {
                      const imgSrc = item.product.images?.[0]
                        ? typeof item.product.images[0] === 'string'
                          ? item.product.images[0]
                          : item.product.images[0].url
                        : '/images/placeholder.png';
                      return (
                        <div key={item.id} className={styles.orderItem}>
                          <img
                            src={imgSrc}
                            alt={item.product.name}
                          />
                          <div className={styles.orderItemInfo}>
                            <h4>{item.product.name}</h4>
                            {item.size && <span>Size: {item.size}</span>}
                            <span className={styles.orderItemQty}>x{item.quantity}</span>
                          </div>
                          <span className={styles.orderItemPrice}>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {note && (
                  <div className={styles.confirmSection}>
                    <div className={styles.confirmHeader}>
                      <h3>Ghi chú</h3>
                    </div>
                    <div className={styles.confirmContent}>
                      <p>{note}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className={styles.stepNavigation}>
              {step > 1 && (
                <button className={styles.prevBtn} onClick={prevStep}>
                  <FiArrowLeft />
                  Quay lại
                </button>
              )}
              {step < 3 ? (
                <button className={styles.nextBtn} onClick={nextStep}>
                  Tiếp tục
                  <FiChevronRight />
                </button>
              ) : (
                <button
                  className={styles.placeOrderBtn}
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <>Đang xử lý...</>
                  ) : (
                    <>
                      Đặt hàng - {formatCurrency(total)}
                      <FiChevronRight />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className={styles.orderSummary}>
            <h3>Tóm tắt đơn hàng</h3>

            <div className={styles.summaryItems}>
              {cart?.items.slice(0, 3).map(item => {
                const imgSrc = item.product.images?.[0]
                  ? typeof item.product.images[0] === 'string'
                    ? item.product.images[0]
                    : item.product.images[0].url
                  : '/images/placeholder.png';
                return (
                  <div key={item.id} className={styles.summaryItem}>
                    <div className={styles.summaryItemImg}>
                      <img src={imgSrc} alt={item.product.name} />
                      <span className={styles.itemQty}>{item.quantity}</span>
                    </div>
                    <div className={styles.summaryItemInfo}>
                      <span className={styles.summaryItemName}>{item.product.name}</span>
                      <span className={styles.summaryItemPrice}>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                );
              })}
              {cart && cart.items.length > 3 && (
                <p className={styles.moreItems}>+{cart.items.length - 3} sản phẩm khác</p>
              )}
            </div>

            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>
                <FiTruck style={{ marginRight: 4 }} />
                Phí vận chuyển
              </span>
              <span>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
            </div>
            {discount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discount}`}>
                <span>Giảm giá</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}

            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryTotal}>
              <span>Tổng cộng</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {subtotal < 500000 && (
              <p className={styles.freeShipNote}>
                Mua thêm <strong>{formatCurrency(500000 - subtotal)}</strong> để được miễn phí ship
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
