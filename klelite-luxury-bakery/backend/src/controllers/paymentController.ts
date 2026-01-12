import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config';
import { asyncHandler, successResponse, BadRequestError } from '../utils';
import { AuthRequest } from '../types';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';

// MoMo Payment Configuration
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || '',
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  redirectUrl: `${config.frontendUrl}/payment/callback`,
  ipnUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/momo/ipn`,
};

// VNPay Configuration
const VNPAY_CONFIG = {
  tmnCode: process.env.VNPAY_TMN_CODE || '',
  hashSecret: process.env.VNPAY_HASH_SECRET || '',
  url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: `${config.frontendUrl}/payment/callback`,
};

// @desc    Create MoMo Payment
// @route   POST /api/payments/momo/create
// @access  Private
export const createMoMoPayment = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { orderId, amount, orderInfo } = req.body;

  if (!orderId || !amount) {
    throw BadRequestError('Order ID và số tiền là bắt buộc');
  }

  // Validate MoMo config
  if (!MOMO_CONFIG.partnerCode || !MOMO_CONFIG.accessKey || !MOMO_CONFIG.secretKey) {
    throw BadRequestError('Cấu hình MoMo không hợp lệ');
  }

  // Amount must be integer and >= 1000 VND
  const amountInt = Math.round(Number(amount));
  if (amountInt < 1000) {
    throw BadRequestError('Số tiền tối thiểu là 1,000 VND');
  }

  const requestId = `${MOMO_CONFIG.partnerCode}${Date.now()}`;
  const momoOrderId = requestId;
  const extraData = '';
  const orderInfoText = `Payment for order ${orderId}`;
  const requestType = 'captureWallet';

  // Build signature data object
  const signatureData = {
    accessKey: MOMO_CONFIG.accessKey,
    amount: amountInt,
    extraData: extraData,
    ipnUrl: MOMO_CONFIG.ipnUrl,
    orderId: momoOrderId,
    orderInfo: orderInfoText,
    partnerCode: MOMO_CONFIG.partnerCode,
    redirectUrl: MOMO_CONFIG.redirectUrl,
    requestId: requestId,
    requestType: requestType,
  };

  // Create raw signature string
  const rawSignature =
    `accessKey=${signatureData.accessKey}` +
    `&amount=${signatureData.amount}` +
    `&extraData=${signatureData.extraData}` +
    `&ipnUrl=${signatureData.ipnUrl}` +
    `&orderId=${signatureData.orderId}` +
    `&orderInfo=${signatureData.orderInfo}` +
    `&partnerCode=${signatureData.partnerCode}` +
    `&redirectUrl=${signatureData.redirectUrl}` +
    `&requestId=${signatureData.requestId}` +
    `&requestType=${signatureData.requestType}`;

  const signature = crypto
    .createHmac('sha256', MOMO_CONFIG.secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode: MOMO_CONFIG.partnerCode,
    requestId: requestId,
    amount: amountInt,
    orderId: momoOrderId,
    orderInfo: orderInfoText,
    redirectUrl: MOMO_CONFIG.redirectUrl,
    ipnUrl: MOMO_CONFIG.ipnUrl,
    requestType: requestType,
    extraData: extraData,
    lang: 'vi',
    signature: signature,
  };

  try {
    const response = await axios.post(MOMO_CONFIG.endpoint, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    if (response.data.resultCode === 0) {
      // Update order with payment info
      await prisma.order.update({
        where: { id: orderId },
        data: {
          transactionId: momoOrderId,
          paymentStatus: PaymentStatus.PENDING
        }
      });

      successResponse(res, {
        payUrl: response.data.payUrl,
        deeplink: response.data.deeplink,
        qrCodeUrl: response.data.qrCodeUrl,
        orderId: momoOrderId,
        message: 'Tạo thanh toán MoMo thành công',
      });
    } else {
      console.error('MoMo Error Response:', response.data);
      throw BadRequestError(response.data.message || 'Không thể tạo thanh toán MoMo');
    }
  } catch (error: any) {
    console.error('MoMo Error:', error.response?.data || error.message);
    throw BadRequestError(error.response?.data?.message || error.message || 'Lỗi kết nối MoMo');
  }
});

// @desc    MoMo IPN Handler
// @route   POST /api/payments/momo/ipn
// @access  Public
export const momoIPN = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const { orderId, resultCode, transId, amount } = req.body;

    // Verify signature
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${req.body.extraData}&message=${req.body.message}&orderId=${orderId}&orderInfo=${req.body.orderInfo}&orderType=${req.body.orderType}&partnerCode=${req.body.partnerCode}&payType=${req.body.payType}&requestId=${req.body.requestId}&responseTime=${req.body.responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');

    if (req.body.signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Extract original order ID
    const originalOrderId = orderId.split('-')[0];

    if (resultCode === 0) {
      await prisma.order.update({
        where: { id: originalOrderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          transactionId: transId,
          paidAt: new Date(),
          status: OrderStatus.CONFIRMED
        }
      });
    } else {
      await prisma.order.update({
        where: { id: originalOrderId },
        data: { paymentStatus: PaymentStatus.FAILED }
      });
    }

    return res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('MoMo IPN Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Create VNPay Payment URL
// @route   POST /api/payments/vnpay/create
// @access  Private
export const createVNPayPayment = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { orderId, amount, orderInfo, bankCode } = req.body;

  if (!orderId || !amount) {
    throw BadRequestError('Order ID và số tiền là bắt buộc');
  }

  const date = new Date();
  const createDate = date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const txnRef = `${orderId}-${Date.now()}`;

  // Get client IP
  const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  let vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_CONFIG.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
    vnp_OrderType: 'other',
    vnp_Amount: String(amount * 100),
    vnp_ReturnUrl: VNPAY_CONFIG.returnUrl,
    vnp_IpAddr: String(ipAddr),
    vnp_CreateDate: createDate,
  };

  if (bankCode) {
    vnpParams['vnp_BankCode'] = bankCode;
  }

  // Sort params and create signature
  const sortedParams = sortObject(vnpParams);
  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  vnpParams['vnp_SecureHash'] = signed;

  const paymentUrl = `${VNPAY_CONFIG.url}?${new URLSearchParams(vnpParams).toString()}`;

  // Update order with payment info
  await prisma.order.update({
    where: { id: orderId },
    data: {
      transactionId: txnRef,
      paymentStatus: PaymentStatus.PENDING
    }
  });

  successResponse(res, {
    payUrl: paymentUrl,
    orderId: txnRef,
    message: 'Tạo thanh toán VNPay thành công',
  });
});

// @desc    VNPay Return Handler
// @route   GET /api/payments/vnpay/return
// @access  Public
export const vnpayReturn = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  let vnpParams = req.query as Record<string, string>;
  const secureHash = vnpParams['vnp_SecureHash'];

  // Remove hash params for verification
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  const sortedParams = sortObject(vnpParams);
  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const txnRef = vnpParams['vnp_TxnRef'];
  const originalOrderId = txnRef.split('-')[0];

  if (secureHash === signed) {
    const responseCode = vnpParams['vnp_ResponseCode'];

    if (responseCode === '00') {
      await prisma.order.update({
        where: { id: originalOrderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          transactionId: vnpParams['vnp_TransactionNo'],
          paidAt: new Date(),
          status: OrderStatus.CONFIRMED
        }
      });

      successResponse(res, {
        success: true,
        message: 'Thanh toán thành công',
        orderId: originalOrderId
      });
    } else {
      await prisma.order.update({
        where: { id: originalOrderId },
        data: { paymentStatus: PaymentStatus.FAILED }
      });

      throw BadRequestError('Thanh toán thất bại');
    }
  } else {
    throw BadRequestError('Chữ ký không hợp lệ');
  }
});

// @desc    VNPay IPN Handler
// @route   GET /api/payments/vnpay/ipn
// @access  Public
export const vnpayIPN = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    let vnpParams = req.query as Record<string, string>;
    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const txnRef = vnpParams['vnp_TxnRef'];
      const originalOrderId = txnRef.split('-')[0];
      const responseCode = vnpParams['vnp_ResponseCode'];

      if (responseCode === '00') {
        await prisma.order.update({
          where: { id: originalOrderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            transactionId: vnpParams['vnp_TransactionNo'],
            paidAt: new Date(),
            status: OrderStatus.CONFIRMED
          }
        });
      } else {
        await prisma.order.update({
          where: { id: originalOrderId },
          data: { paymentStatus: PaymentStatus.FAILED }
        });
      }

      return res.status(200).json({ RspCode: '00', Message: 'success' });
    } else {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid checksum' });
    }
  } catch (error) {
    console.error('VNPay IPN Error:', error);
    return res.status(500).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// Helper function to sort object keys
function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  }

  return sorted;
}

// @desc    Get payment status
// @route   GET /api/payments/status/:orderId
// @access  Private
export const getPaymentStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    select: {
      id: true,
      paymentStatus: true,
      paymentMethod: true,
      transactionId: true,
      paidAt: true
    }
  });

  if (!order) {
    throw BadRequestError('Không tìm thấy đơn hàng');
  }

  successResponse(res, {
    orderId: order.id,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    transactionId: order.transactionId,
    paidAt: order.paidAt,
  });
});
