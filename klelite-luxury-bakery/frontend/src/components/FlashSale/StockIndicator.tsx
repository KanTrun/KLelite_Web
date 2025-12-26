import React, { useEffect, useState } from 'react';
import { flashSaleService } from '@/services/flashSaleService';

interface StockIndicatorProps {
  saleId: string;
  productId: string;
  initialStock: number;
  totalStock: number;
  compact?: boolean;
}

const StockIndicator: React.FC<StockIndicatorProps> = ({
  saleId,
  productId,
  initialStock,
  totalStock,
  compact = false
}) => {
  const [currentStock, setCurrentStock] = useState<number>(initialStock);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStock = async () => {
      try {
        const response = await flashSaleService.getStock(saleId, productId);
        if (response && response.data) {
          setCurrentStock(response.data.stock);
        }
      } catch (error) {
        console.error('Failed to fetch stock', error);
      }
    };

    // Initial fetch
    fetchStock();

    // Poll every 5 seconds for active sales
    if (currentStock > 0) {
      intervalId = setInterval(fetchStock, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [saleId, productId]);

  const percentage = Math.max(0, Math.min(100, (currentStock / totalStock) * 100));
  const isLowStock = percentage < 20 && percentage > 0;
  const isSoldOut = currentStock === 0;

  if (compact) {
    if (isSoldOut) {
      return (
        <span className="inline-block px-2 py-1 bg-gray-200 text-gray-500 text-xs font-bold rounded uppercase">
          Hết hàng
        </span>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-xs">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${isLowStock ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={isLowStock ? 'text-red-500 font-medium' : 'text-gray-600'}>
          {currentStock} còn lại
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className={`font-medium ${isLowStock ? 'text-red-500' : 'text-gray-700'}`}>
          {isSoldOut ? 'Đã hết hàng' : isLowStock ? 'Sắp hết hàng!' : 'Đang bán chạy'}
        </span>
        <span className="text-gray-500 text-xs">
          Đã bán {totalStock - currentStock}/{totalStock}
        </span>
      </div>

      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Fire icon for hot items */}
        {percentage < 50 && percentage > 0 && (
          <div className="absolute top-0 bottom-0 left-0 flex items-center justify-center z-10 w-full text-[10px] text-white font-bold drop-shadow-md">
            🔥 Sắp cháy hàng
          </div>
        )}

        <div
          className={`h-full transition-all duration-1000 ease-out ${
            isSoldOut ? 'bg-gray-400' : isLowStock ? 'bg-red-500' : 'bg-amber-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default StockIndicator;
