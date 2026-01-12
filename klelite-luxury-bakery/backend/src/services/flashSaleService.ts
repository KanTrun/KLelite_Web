import redis, { isRedisAvailable } from '../config/redis';
import prisma from '../lib/prisma';
import AppError from '../utils/AppError';
import { FlashSale, StockReservation } from '@prisma/client';

class FlashSaleService {
  /**
   * Initialize stock in Redis for a flash sale
   * @param sale Flash sale document
   */
  async initializeSaleStock(sale: FlashSale & { products: any[] }): Promise<void> {
    // Skip Redis operations if Redis is not available
    if (!isRedisAvailable) {
      console.warn(`⚠️  Skipping Redis stock initialization for: ${sale.name} (Redis unavailable)`);
      return;
    }

    try {
      const pipeline = redis.pipeline();

      for (const product of sale.products) {
        const stockKey = `flash:${sale.id}:product:${product.productId}:stock`;
        pipeline.set(stockKey, product.stockLimit);

        // Set TTL to sale end time (in seconds)
        const ttl = Math.ceil((sale.endTime.getTime() - Date.now()) / 1000);
        if (ttl > 0) {
          pipeline.expire(stockKey, ttl);
        }
      }

      await pipeline.exec();
      console.log(`✅ Flash sale stock initialized for: ${sale.name}`);
    } catch (error) {
      console.error('❌ Error initializing flash sale stock:', error);
      // Don't throw - allow system to continue without Redis
      console.warn('⚠️  Flash sale will operate without Redis caching');
    }
  }

  /**
   * Reserve stock for a user (atomic operation)
   * @param saleId Flash sale ID
   * @param productId Product ID
   * @param userId User ID
   * @param quantity Quantity to reserve
   * @param loyaltyTier User's loyalty tier (for early access check)
   * @returns Stock reservation document
   */
  async reserveStock(
    saleId: string,
    productId: string,
    userId: string,
    quantity: number,
    loyaltyTier?: string
  ): Promise<StockReservation> {
    // Require Redis for flash sale stock management
    if (!isRedisAvailable) {
      throw new AppError('Flash sale feature requires Redis. Please contact support.', 503);
    }

    try {
      // Fetch flash sale
      const sale = await prisma.flashSale.findUnique({
        where: { id: saleId },
        select: {
          id: true,
          name: true,
          status: true,
          startTime: true,
          endTime: true,
          earlyAccessMin: true,
          earlyAccessTiers: true,
          products: true
        }
      });

      if (!sale) {
        throw new AppError('Flash sale not found', 404);
      }

      // Check sale status and timing
      const now = new Date();
      if (sale.status === 'ENDED') {
        throw new AppError('Flash sale has ended', 400);
      }

      // Early access check
      const earlyAccessStart = new Date(sale.startTime.getTime() - sale.earlyAccessMin * 60 * 1000);
      const isEarlyAccessTime = now >= earlyAccessStart && now < sale.startTime;

      if (isEarlyAccessTime) {
        const earlyAccessTiers = (sale.earlyAccessTiers as string[]) || [];
        if (!loyaltyTier || !earlyAccessTiers.includes(loyaltyTier.toLowerCase())) {
          const minutesUntilPublic = Math.ceil((sale.startTime.getTime() - now.getTime()) / 60000);
          throw new AppError(
            `Early access only. Public sale starts in ${minutesUntilPublic} minutes`,
            403
          );
        }
      } else if (now < earlyAccessStart) {
        throw new AppError('Flash sale has not started yet', 400);
      } else if (now > sale.endTime) {
        throw new AppError('Flash sale has ended', 400);
      }

      // Find product in flash sale (products is JSON field)
      const products = (sale.products as any[]) || [];
      const product = products.find(
        (p) => p.productId === productId
      );

      if (!product) {
        throw new AppError('Product not found in this flash sale', 404);
      }

      // Check user purchase limit with atomic read to prevent race condition
      const userConfirmedKey = `flash:${saleId}:product:${productId}:user:${userId}:confirmed`;
      const userReservedKey = `flash:${saleId}:product:${productId}:user:${userId}:reserved`;

      // Atomic multi-get
      const [confirmedStr, reservedStr] = await redis.mget(userConfirmedKey, userReservedKey);
      const userConfirmed = Number(confirmedStr || '0');
      const userReserved = Number(reservedStr || '0');
      const userTotal = userConfirmed + userReserved;

      if (userTotal + quantity > product.perUserLimit) {
        throw new AppError(
          `Purchase limit exceeded. Maximum ${product.perUserLimit} per user`,
          400
        );
      }

      // Atomic stock decrement
      const stockKey = `flash:${saleId}:product:${productId}:stock`;
      const remaining = await redis.decrby(stockKey, quantity);

      if (remaining < 0) {
        // Rollback if oversold
        await redis.incrby(stockKey, quantity);
        throw new AppError('Product sold out', 400);
      }

      // Atomically increment reserved count
      await redis.incrby(userReservedKey, quantity);

      // Set TTL on reserved key
      const ttl = Math.ceil((sale.endTime.getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await redis.expire(userReservedKey, ttl);
      }

      // Create reservation (5 minutes expiry)
      const reservation = await prisma.stockReservation.create({
        data: {
          flashSaleId: saleId,
          productId,
          userId,
          quantity,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          status: 'ACTIVE' as any
        }
      });

      console.log(`✅ Stock reserved: ${quantity} units for user ${userId}`);
      return reservation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('❌ Error reserving stock:', error);
      throw new AppError('Failed to reserve stock', 500);
    }
  }

  /**
   * Confirm reservation after successful checkout
   * @param reservationId Reservation ID
   */
  async confirmReservation(reservationId: string): Promise<void> {
    try {
      const reservation = await prisma.stockReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation) {
        throw new AppError('Reservation not found', 404);
      }

      if (reservation.status !== 'ACTIVE' as any) {
        throw new AppError('Reservation already processed', 400);
      }

      // Update reservation status
      await prisma.stockReservation.update({
        where: { id: reservationId },
        data: { status: 'COMPLETED' as any }
      });

      // Update soldCount in FlashSale products JSON
      const sale = await prisma.flashSale.findUnique({
        where: { id: reservation.flashSaleId },
        select: { products: true }
      });

      if (sale && sale.products) {
        const products = (sale.products as any[]) || [];
        const productIndex = products.findIndex(p => p.productId === reservation.productId);
        if (productIndex !== -1) {
          products[productIndex].soldCount = (products[productIndex].soldCount || 0) + reservation.quantity;
          await prisma.flashSale.update({
            where: { id: reservation.flashSaleId },
            data: { products: products as any }
          });
        }
      }

      // Move from reserved to confirmed in Redis (atomic pipeline)
      if (isRedisAvailable) {
        const userReservedKey = `flash:${reservation.flashSaleId}:product:${reservation.productId}:user:${reservation.userId}:reserved`;
        const userConfirmedKey = `flash:${reservation.flashSaleId}:product:${reservation.productId}:user:${reservation.userId}:confirmed`;

        const saleForTTL = await prisma.flashSale.findUnique({ where: { id: reservation.flashSaleId } });
        const ttl = saleForTTL ? Math.ceil((saleForTTL.endTime.getTime() - Date.now()) / 1000) : 0;

        // Atomic pipeline for moving stock from reserved to confirmed
        const pipeline = redis.pipeline();
        pipeline.decrby(userReservedKey, reservation.quantity);
        pipeline.incrby(userConfirmedKey, reservation.quantity);
        if (ttl > 0) {
          pipeline.expire(userConfirmedKey, ttl);
        }
        await pipeline.exec();
      }

      console.log(`✅ Reservation confirmed: ${reservationId}`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('❌ Error confirming reservation:', error);
      throw new AppError('Failed to confirm reservation', 500);
    }
  }

  /**
   * Release reservation (timeout or cancellation)
   * @param reservationId Reservation ID
   */
  async releaseReservation(reservationId: string): Promise<void> {
    try {
      const reservation = await prisma.stockReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation || reservation.status !== 'PENDING' as any) {
        return; // Already processed
      }

      // Return stock to Redis (skip if Redis is not available)
      if (isRedisAvailable) {
        const stockKey = `flash:${reservation.flashSaleId}:product:${reservation.productId}:stock`;
        await redis.incrby(stockKey, reservation.quantity);

        // Decrement reserved count
        const userReservedKey = `flash:${reservation.flashSaleId}:product:${reservation.productId}:user:${reservation.userId}:reserved`;
        await redis.decrby(userReservedKey, reservation.quantity);
      }

      // Update reservation status
      await prisma.stockReservation.update({
        where: { id: reservationId },
        data: { status: 'EXPIRED' as any }
      });

      console.log(`✅ Reservation released: ${reservationId}`);
    } catch (error) {
      console.error('❌ Error releasing reservation:', error);
      // Don't throw - this is a cleanup operation
    }
  }

  /**
   * Get current server time (for frontend countdown sync)
   */
  getServerTime(): { serverTime: number } {
    return { serverTime: Date.now() };
  }

  /**
   * Get current stock for a product in flash sale
   * @param saleId Flash sale ID
   * @param productId Product ID
   */
  async getProductStock(saleId: string, productId: string): Promise<number> {
    // Return 0 if Redis is not available
    if (!isRedisAvailable) {
      console.warn('⚠️  Cannot get product stock: Redis unavailable');
      return 0;
    }

    try {
      const stockKey = `flash:${saleId}:product:${productId}:stock`;
      const stock = await redis.get(stockKey);
      return Math.max(0, Number(stock) || 0);
    } catch (error) {
      console.error('❌ Error getting product stock:', error);
      return 0;
    }
  }

  /**
   * Cleanup expired reservations and release stock
   */
  async cleanupExpiredReservations(): Promise<void> {
    try {
      const expired = await prisma.stockReservation.findMany({
        where: {
          status: 'ACTIVE' as any,
          expiresAt: { lt: new Date() }
        }
      });

      console.log(`🧹 Cleaning up ${expired.length} expired reservations`);

      for (const reservation of expired) {
        await this.releaseReservation(reservation.id);
      }

      console.log(`✅ Cleanup completed: ${expired.length} reservations released`);
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Update flash sale status based on current time
   */
  async updateFlashSaleStatuses(): Promise<void> {
    try {
      const now = new Date();

      // Activate scheduled sales
      const toActivate = await prisma.flashSale.findMany({
        where: {
          status: 'UPCOMING' as any,
          startTime: { lte: now },
          endTime: { gt: now }
        }
      });

      for (const sale of toActivate) {
        await prisma.flashSale.update({
          where: { id: sale.id },
          data: { status: 'ACTIVE' as any }
        });
        await this.initializeSaleStock(sale as any);
        console.log(`🚀 Flash sale activated: ${sale.name}`);
      }

      // End active sales
      const toEnd = await prisma.flashSale.findMany({
        where: {
          status: 'ACTIVE' as any,
          endTime: { lte: now }
        }
      });

      for (const sale of toEnd) {
        await prisma.flashSale.update({
          where: { id: sale.id },
          data: { status: 'ENDED' as any }
        });
        console.log(`🏁 Flash sale ended: ${sale.name}`);
      }
    } catch (error) {
      console.error('❌ Error updating flash sale statuses:', error);
    }
  }
}

export default new FlashSaleService();
