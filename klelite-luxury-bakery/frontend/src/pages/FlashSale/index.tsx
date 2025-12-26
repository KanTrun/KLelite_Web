import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { formatCurrency } from '@/utils/formatCurrency';
import { flashSaleService, FlashSale } from '@/services/flashSaleService';
import Countdown from '@/components/FlashSale/Countdown';
import StockIndicator from '@/components/FlashSale/StockIndicator';

const FlashSaleList: React.FC = () => {
  const [activeSales, setActiveSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Sync server time
        const timeRes = await flashSaleService.getServerTime();
        setServerTimeOffset(Date.now() - timeRes.data.serverTime);

        // Get active sales
        const salesRes = await flashSaleService.getActive();
        setActiveSales(salesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch flash sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getAdjustedTime = (timeStr: string) => {
    return new Date(new Date(timeStr).getTime() + serverTimeOffset);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-gray-200 rounded-lg w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSales.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Helmet>
          <title>Flash Sale | KL'élite Luxury Bakery</title>
        </Helmet>
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Không có Flash Sale nào</h2>
          <p className="text-gray-600 mb-8">
            Hiện tại không có chương trình Flash Sale nào đang diễn ra.
            Vui lòng quay lại sau hoặc đăng ký nhận thông báo để không bỏ lỡ!
          </p>
          <Link
            to="/products"
            className="inline-block bg-amber-600 text-white px-8 py-3 rounded-sm hover:bg-amber-700 transition-colors uppercase tracking-wider font-medium"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  // Find the most urgent active sale or next upcoming
  const featuredSale = activeSales.find(s => s.status === 'active') || activeSales[0];

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <Helmet>
        <title>Flash Sale | KL'élite Luxury Bakery</title>
      </Helmet>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-700 text-white py-12 sm:py-20 mb-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-6xl font-serif font-bold mb-4 drop-shadow-md">
            FLASH SALE
          </h1>
          <p className="text-xl sm:text-2xl text-amber-100 font-light mb-8 max-w-2xl mx-auto">
            Cơ hội sở hữu những chiếc bánh tuyệt phẩm với mức giá ưu đãi nhất.
            Số lượng có hạn.
          </p>

          {featuredSale && (
            <div className="bg-white/10 backdrop-blur-sm inline-block px-6 py-4 rounded-lg border border-white/20">
              <p className="text-sm uppercase tracking-widest mb-2 font-medium">
                {featuredSale.status === 'active' ? 'Kết thúc trong' : 'Bắt đầu sau'}
              </p>
              <Countdown
                targetDate={featuredSale.status === 'active' ? featuredSale.endTime : featuredSale.startTime}
                className="text-2xl sm:text-4xl font-bold justify-center"
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4">
        {activeSales.map((sale) => (
          <div key={sale._id} className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-gray-200 pb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-serif font-bold text-gray-900">{sale.name}</h2>
                  {sale.status === 'active' && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse font-bold uppercase">
                      Đang diễn ra
                    </span>
                  )}
                  {sale.status === 'scheduled' && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded font-bold uppercase">
                      Sắp diễn ra
                    </span>
                  )}
                </div>
                <p className="text-gray-600 max-w-2xl">{sale.description}</p>
              </div>

              <div className="mt-4 md:mt-0 text-right">
                <Link
                  to={`/flash-sales/${sale.slug}`}
                  className="text-amber-600 font-bold hover:text-amber-800 transition-colors inline-flex items-center"
                >
                  Xem tất cả sản phẩm
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sale.products.slice(0, 4).map((item) => (
                <div key={item.productId._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-100">
                  <div className="relative aspect-square overflow-hidden group">
                    <img
                      src={item.productId.images[0] || '/placeholder.jpg'}
                      alt={item.productId.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Discount Badge */}
                    <div className="absolute top-2 right-2 bg-red-600 text-white font-bold text-sm w-12 h-12 flex items-center justify-center rounded-full shadow-md z-10">
                      -{Math.round(((item.originalPrice - item.flashPrice) / item.originalPrice) * 100)}%
                    </div>

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Link
                        to={`/products/${item.productId.slug}`}
                        className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-amber-50"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <div className="mb-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">{item.productId.category}</span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-gray-900 mb-2 line-clamp-2 h-14">
                      <Link to={`/products/${item.productId.slug}`} className="hover:text-amber-700 transition-colors">
                        {item.productId.name}
                      </Link>
                    </h3>

                    <div className="mt-auto">
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-xl font-bold text-red-600">{formatCurrency(item.flashPrice)}</span>
                        <span className="text-sm text-gray-400 line-through mb-1">{formatCurrency(item.originalPrice)}</span>
                      </div>

                      {sale.status === 'active' && (
                        <div className="mb-3">
                          <StockIndicator
                            saleId={sale._id}
                            productId={item.productId._id}
                            initialStock={item.stockLimit - item.soldCount}
                            totalStock={item.stockLimit}
                          />
                        </div>
                      )}

                      <button
                        className={`w-full py-2 rounded font-medium transition-colors ${
                          sale.status === 'active'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={sale.status !== 'active'}
                      >
                        {sale.status === 'active' ? 'Mua ngay' : 'Sắp mở bán'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashSaleList;
