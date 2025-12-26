import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/utils/formatCurrency';
import { flashSaleService, FlashSale } from '@/services/flashSaleService';
import Countdown from '@/components/FlashSale/Countdown';
import StockIndicator from '@/components/FlashSale/StockIndicator';

const FlashSaleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        // Sync server time
        const timeRes = await flashSaleService.getServerTime();
        setServerTimeOffset(Date.now() - timeRes.data.serverTime);

        // Get sale details
        const saleRes = await flashSaleService.getBySlug(slug);
        setSale(saleRes.data);
      } catch (error) {
        console.error('Failed to fetch flash sale:', error);
        toast.error('Không tìm thấy chương trình Flash Sale');
        navigate('/flash-sales');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, navigate]);

  const handleReserve = async (productId: string) => {
    if (!sale) return;

    try {
      setAddingToCart(productId);
      const res = await flashSaleService.reserve(sale._id, productId, 1);

      toast.success('Đã giữ hàng thành công! Vui lòng thanh toán trong 5 phút.');

      // Redirect to checkout or cart
      // navigate('/checkout');
      // For now just refresh or update UI
    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể đặt hàng';
      toast.error(message);

      if (error.response?.status === 401) {
        navigate('/login', { state: { from: `/flash-sales/${slug}` } });
      }
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-gray-200 rounded-lg w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sale) return null;

  const isActive = sale.status === 'active';

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <Helmet>
        <title>{sale.name} | Flash Sale | KL'élite Luxury Bakery</title>
      </Helmet>

      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link to="/" className="hover:text-amber-600">Trang chủ</Link>
                <span>/</span>
                <Link to="/flash-sales" className="hover:text-amber-600">Flash Sale</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate max-w-[200px]">{sale.name}</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">{sale.name}</h1>
            </div>

            <div className="flex items-center gap-4 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
              <span className="text-sm uppercase font-bold text-amber-800">
                {isActive ? 'Kết thúc trong' : 'Bắt đầu sau'}
              </span>
              <Countdown
                targetDate={isActive ? sale.endTime : sale.startTime}
                className="text-xl font-bold text-amber-600"
                onComplete={() => window.location.reload()}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Description */}
        {sale.description && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8 max-w-4xl mx-auto text-center">
            <p className="text-gray-600 italic">"{sale.description}"</p>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sale.products.map((item) => (
            <div key={item.productId._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-100 relative group">

              {/* Image Area */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={item.productId.images[0] || '/placeholder.jpg'}
                  alt={item.productId.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />

                {/* Discount Badge */}
                <div className="absolute top-2 right-2 bg-red-600 text-white font-bold text-lg w-14 h-14 flex items-center justify-center rounded-full shadow-md z-10 border-2 border-white">
                  -{Math.round(((item.originalPrice - item.flashPrice) / item.originalPrice) * 100)}%
                </div>

                {/* Limits Badge */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                  Max {item.perUserLimit}/khách
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex flex-col flex-grow">
                <div className="mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">{item.productId.category}</span>
                </div>

                <h3 className="font-serif font-bold text-lg text-gray-900 mb-2 line-clamp-2 h-14">
                  <Link to={`/products/${item.productId.slug}`} className="hover:text-amber-700 transition-colors">
                    {item.productId.name}
                  </Link>
                </h3>

                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                    <span className="text-2xl font-bold text-red-600">{formatCurrency(item.flashPrice)}</span>
                    <span className="text-sm text-gray-400 line-through">{formatCurrency(item.originalPrice)}</span>
                  </div>

                  {isActive && (
                    <div className="mb-4">
                      <StockIndicator
                        saleId={sale._id}
                        productId={item.productId._id}
                        initialStock={item.stockLimit - item.soldCount}
                        totalStock={item.stockLimit}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/products/${item.productId.slug}`}
                      className="text-center py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Chi tiết
                    </Link>

                    <button
                      onClick={() => handleReserve(item.productId._id)}
                      disabled={!isActive || addingToCart === item.productId._id}
                      className={`py-2 px-4 rounded font-bold shadow-sm transition-all flex items-center justify-center ${
                        isActive
                          ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-md active:scale-95'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {addingToCart === item.productId._id ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : isActive ? (
                        'Mua ngay'
                      ) : (
                        'Chưa mở'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashSaleDetail;
