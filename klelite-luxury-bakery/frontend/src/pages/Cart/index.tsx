import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiTag, FiX, FiGift, FiCheck, FiPercent } from 'react-icons/fi';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '@/store/slices/cartSlice';
import { AppDispatch, RootState } from '@/store';
import { formatCurrency } from '@/utils/formatters';
import { voucherService, Voucher, AppliedVoucher } from '@/services/voucherService';
import Loading from '@/components/common/Loading';
import { toast } from 'react-hot-toast';
import styles from './Cart.module.scss';

const Cart: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { cart, isLoading } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Fetch available vouchers
  useEffect(() => {
    if (isAuthenticated) {
      voucherService.getAvailableVouchers()
        .then(vouchers => setAvailableVouchers(vouchers))
        .catch(err => console.error('Error fetching vouchers:', err));
    }
  }, [isAuthenticated]);

  const handleApplyVoucher = async (code?: string) => {
    const codeToApply = code || voucherCode;
    if (!codeToApply.trim()) {
      toast.error('Vui lòng nhập mã voucher');
      return;
    }
    
    setVoucherLoading(true);
    setVoucherError(null);
    try {
      const result = await voucherService.validateVoucher(codeToApply, subtotal);
      setAppliedVoucher({
        code: result.code,
        discount: result.discount,
        type: result.type,
        value: result.value
      });
      setVoucherCode('');
      setShowVoucherList(false);
      toast.success(`Áp dụng voucher thành công! Giảm ${formatCurrency(result.discount)}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Voucher không hợp lệ';
      setVoucherError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    toast.success('Đã hủy voucher');
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItem({ itemId, quantity: newQuantity }));
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  // Calculate totals
  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const discount = appliedVoucher?.discount || 0;
  const total = subtotal + shippingFee - discount;

  if (isLoading && !cart) {
    return (
      <div className={styles.cartPage}>
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.cartPage}>
        <div className={styles.container}>
          <motion.div
            className={styles.emptyCart}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.emptyIcon}>
              <FiShoppingBag />
            </div>
            <h2>Giỏ hàng trống</h2>
            <p>Hãy khám phá các sản phẩm tuyệt vời của chúng tôi</p>
            <Link to="/products" className={styles.shopNowBtn}>
              Mua sắm ngay
              <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.pageHeader}
        >
          <h1>Giỏ hàng của bạn</h1>
          <p>{cart.items.length} sản phẩm</p>
        </motion.div>

        <div className={styles.cartLayout}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            <div className={styles.cartHeader}>
              <span>Sản phẩm</span>
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
              <span></span>
            </div>

            <AnimatePresence>
              {cart.items.map((item) => (
                <motion.div
                  key={item._id}
                  className={styles.cartItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  <div className={styles.itemProduct}>
                    <Link to={`/products/${item.product.slug}`} className={styles.itemImage}>
                      <img
                        src={
                          item.product.images?.[0]
                            ? typeof item.product.images[0] === 'string'
                              ? item.product.images[0]
                              : item.product.images[0].url
                            : '/images/placeholder-product.png'
                        }
                        alt={item.product.name}
                      />
                    </Link>
                    <div className={styles.itemInfo}>
                      <h3>
                        <Link to={`/products/${item.product.slug}`}>{item.product.name}</Link>
                      </h3>
                      {item.size && <span className={styles.itemSize}>Size: {item.size}</span>}
                      {item.customization && (
                        <span className={styles.itemCustom}>{item.customization}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.itemPrice}>
                    {formatCurrency(item.price)}
                  </div>

                  <div className={styles.itemQuantity}>
                    <button
                      onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isLoading}
                    >
                      <FiMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                      disabled={isLoading}
                    >
                      <FiPlus />
                    </button>
                  </div>

                  <div className={styles.itemTotal}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>

                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveItem(item._id)}
                    disabled={isLoading}
                    title="Xóa sản phẩm"
                  >
                    <FiTrash2 />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className={styles.cartActions}>
              <Link to="/products" className={styles.continueBtn}>
                Tiếp tục mua sắm
              </Link>
              <button onClick={handleClearCart} className={styles.clearBtn} disabled={isLoading}>
                Xóa giỏ hàng
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className={styles.cartSummary}>
            <h3>Tóm tắt đơn hàng</h3>

            <div className={styles.voucherSection}>
              <label>Mã giảm giá</label>
              
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
                    <FiTag />
                    <input 
                      type="text" 
                      placeholder="Nhập mã voucher" 
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
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
                              key={voucher._id} 
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

            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Phí vận chuyển</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
              </div>
              {discount > 0 && (
                <div className={`${styles.summaryRow} ${styles.discount}`}>
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
            </div>

            <div className={styles.summaryTotal}>
              <span>Tổng cộng</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {subtotal < 500000 && (
              <p className={styles.freeShipNote}>
                Mua thêm <strong>{formatCurrency(500000 - subtotal)}</strong> để được miễn phí vận chuyển
              </p>
            )}

            <button 
              className={styles.checkoutBtn} 
              onClick={handleCheckout}
              disabled={isLoading}
            >
              Tiến hành thanh toán
              <FiArrowRight />
            </button>

            <div className={styles.paymentMethods}>
              <span>Chấp nhận thanh toán:</span>
              <div className={styles.methodIcons}>
                <img src="https://cdn-icons-png.flaticon.com/32/196/196578.png" alt="COD" />
                <img src="https://cdn-icons-png.flaticon.com/32/349/349221.png" alt="Visa" />
                <img src="https://cdn-icons-png.flaticon.com/32/349/349228.png" alt="Mastercard" />
                <img src="https://cdn-icons-png.flaticon.com/32/6124/6124998.png" alt="MoMo" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
