import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader, FiShoppingBag, FiHome } from 'react-icons/fi';
import { paymentService } from '@/services/paymentService';
import styles from './Payment.module.scss';

const MOMO_ORDER_ID_SEPARATOR = '_momo_';

const extractOriginalMomoOrderId = (providerOrderId: string | null): string => {
  if (!providerOrderId) {
    return '';
  }

  const separatorIndex = providerOrderId.indexOf(MOMO_ORDER_ID_SEPARATOR);
  if (separatorIndex === -1) {
    return providerOrderId;
  }

  return providerOrderId.slice(0, separatorIndex);
};

const normalizePaymentStatus = (value?: string | null): 'PAID' | 'FAILED' | 'PENDING' | '' => {
  if (!value) {
    return '';
  }

  const normalized = value.toUpperCase();
  if (normalized === 'PAID' || normalized === 'FAILED' || normalized === 'PENDING') {
    return normalized;
  }

  return '';
};

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handlePaymentCallback = async () => {
      // Check for VNPay response
      const vnpResponseCode = searchParams.get('vnp_ResponseCode');
      const vnpTxnRef = searchParams.get('vnp_TxnRef');
      
      // Check for MoMo response
      const momoResultCode = searchParams.get('resultCode');
      const momoOrderId = searchParams.get('orderId');

      if (vnpResponseCode) {
        // VNPay callback
        const originalOrderId = vnpTxnRef?.split('-')[0] || '';
        setOrderId(originalOrderId);
        
        if (vnpResponseCode === '00') {
          setStatus('success');
          setMessage('Thanh toán VNPay thành công!');
        } else {
          setStatus('failed');
          setMessage('Thanh toán VNPay thất bại. Vui lòng thử lại.');
        }
      } else if (momoResultCode !== null) {
        // MoMo callback
        const originalOrderId = extractOriginalMomoOrderId(momoOrderId);
        setOrderId(originalOrderId);
        
        if (momoResultCode === '0') {
          setStatus('success');
          setMessage('Thanh toán MoMo thành công!');
        } else {
          setStatus('failed');
          setMessage('Thanh toán MoMo thất bại. Vui lòng thử lại.');
        }
      } else {
        // Try to get order ID from URL and check status
        const orderIdParam = searchParams.get('orderId');
        if (orderIdParam) {
          try {
            const originalOrderId = extractOriginalMomoOrderId(orderIdParam);
            setOrderId(originalOrderId);
            const paymentStatus = await paymentService.getPaymentStatus(originalOrderId);
            
            const normalizedStatus = normalizePaymentStatus(paymentStatus.paymentStatus);

            if (normalizedStatus === 'PAID') {
              setStatus('success');
              setMessage('Thanh toán thành công!');
            } else if (normalizedStatus === 'FAILED') {
              setStatus('failed');
              setMessage('Thanh toán thất bại. Vui lòng thử lại.');
            } else {
              setStatus('loading');
              setMessage('Thanh toán đang được xử lý. Vui lòng kiểm tra lại sau ít phút.');
            }
          } catch {
            setStatus('failed');
            setMessage('Không thể kiểm tra trạng thái thanh toán.');
          }
        } else {
          setStatus('failed');
          setMessage('Không tìm thấy thông tin thanh toán.');
        }
      }
    };

    handlePaymentCallback();
  }, [searchParams]);

  return (
    <div className={styles.paymentCallback}>
      <div className={styles.container}>
        <motion.div 
          className={styles.callbackCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {status === 'loading' && (
            <>
              <div className={`${styles.iconWrapper} ${styles.loading}`}>
                <FiLoader className={styles.spinIcon} />
              </div>
              <h1>Đang xử lý thanh toán</h1>
              <p>{message || 'Vui lòng đợi trong giây lát...'}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className={`${styles.iconWrapper} ${styles.success}`}>
                <FiCheckCircle />
              </div>
              <h1>Thanh toán thành công!</h1>
              <p>{message}</p>
              {orderId && (
                <p className={styles.orderId}>
                  Mã đơn hàng: <strong>{orderId}</strong>
                </p>
              )}
              <div className={styles.actions}>
                {orderId ? (
                  <Link to={`/orders/${orderId}`} className={styles.primaryBtn}>
                    <FiShoppingBag />
                    Xem đơn hàng
                  </Link>
                ) : (
                  <Link to="/orders" className={styles.primaryBtn}>
                    <FiShoppingBag />
                    Xem đơn hàng
                  </Link>
                )}
                <Link to="/" className={styles.secondaryBtn}>
                  <FiHome />
                  Về trang chủ
                </Link>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className={`${styles.iconWrapper} ${styles.failed}`}>
                <FiXCircle />
              </div>
              <h1>Thanh toán thất bại</h1>
              <p>{message}</p>
              {orderId && (
                <p className={styles.orderId}>
                  Mã đơn hàng: <strong>{orderId}</strong>
                </p>
              )}
              <div className={styles.actions}>
                <button 
                  onClick={() => navigate(-1)} 
                  className={styles.primaryBtn}
                >
                  Thử lại
                </button>
                <Link to="/" className={styles.secondaryBtn}>
                  <FiHome />
                  Về trang chủ
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentCallback;
