import {
  buildMomoOrderId,
  buildMomoOrderInfo,
  extractOriginalMomoOrderId,
  normalizeMomoText,
} from '../controllers/paymentController';

describe('paymentController MoMo order helpers', () => {
  it('keeps the internal order id recoverable from the provider order id', () => {
    const originalOrderId = '550e8400-e29b-41d4-a716-446655440000';
    const providerOrderId = buildMomoOrderId(originalOrderId, 'MOMO_1713078000000');

    expect(providerOrderId).toContain(`${originalOrderId}_momo_`);
    expect(extractOriginalMomoOrderId(providerOrderId)).toBe(originalOrderId);
  });

  it('falls back to the raw provider order id when no separator is present', () => {
    expect(extractOriginalMomoOrderId('legacy-order-id')).toBe('legacy-order-id');
  });

  it('normalizes MoMo signed text to ASCII-safe content', () => {
    expect(normalizeMomoText('Thanh toán đơn hàng ORD-123')).toBe('Thanh toan don hang ORD-123');
  });

  it('builds MoMo order info from canonical order data', () => {
    expect(buildMomoOrderInfo('ORD-123')).toBe('Thanh toan don hang ORD-123');
  });
});
