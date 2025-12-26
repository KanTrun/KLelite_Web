import redis from '../config/redis';
import { FlashSale, StockReservation, IFlashSale, IStockReservation } from '../models';
import AppError from '../utils/AppError';
import mongoose from 'mongoose';

class FlashSaleService {
  /**
   * Initialize stock in Redis for a flash sale
   * @param sale Flash sale document
   */
  async initializeSaleStock(sale: IFlashSale): Promise<void> {
    try {
      const pipeline = redis.pipeline();

      for (const product of sale.products) {
        const stockKey = `flash:${sale._id}:product:${product.productId}:stock`;
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
      throw new AppError('Failed to initialize flash sale stock', 500);
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
  ): Promise<IStockReservation> {
    try {
      // Fetch flash sale
      const sale = await FlashSale.findById(saleId);
      if (!sale) {
        throw new AppError('Flash sale not found', 404);
      }

      // Check sale status and timing
      const now = new Date();
      if (sale.status === 'cancelled') {
        throw new AppError('Flash sale has been cancelled', 400);
      }
      if (sale.status === 'ended') {
        throw new AppError('Flash sale has ended', 400);
      }

      // Early access check
      const earlyAccessStart = new Date(sale.startTime.getTime() - sale.earlyAccessMinutes * 60 * 1000);
      const isEarlyAccessTime = now >= earlyAccessStart && now < sale.startTime;

      if (isEarlyAccessTime) {
        if (!loyaltyTier || !sale.earlyAccessTiers.includes(loyaltyTier.toLowerCase())) {
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

      // Find product in flash sale
      const product = sale.products.find(
        (p) => p.productId.toString() === productId
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
      const reservation = await StockReservation.create({
        flashSaleId: new mongoose.Types.ObjectId(saleId),
        productId: new mongoose.Types.ObjectId(productId),
        userId: new mongoose.Types.ObjectId(userId),
        quantity,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        status: 'pending',
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
      const reservation = await StockReservation.findById(reservationId);
      if (!reservation) {
        throw new AppError('Reservation not found', 404);
      }

      if (reservation.status !== 'pending') {
        throw new AppError('Reservation already processed', 400);
      }

      // Update reservation status
      reservation.status = 'completed';
      await reservation.save();

      // Update soldCount in MongoDB
      await FlashSale.updateOne(
        {
          _id: reservation.flashSaleId,
          'products.productId': reservation.productId,
        },
        {
          $inc: { 'products.$.soldCount': reservation.quantity },
        }
      );

      // Move from reserved to confirmed in Redis (atomic pipeline)
      const userReservedKey = `flash:${reservation.flashSaleId}:product:${reservation.productId}:user:${reservation.userId}:reserved`;
      const userConfirmedKey = `flash:${reservation.flashSaleId}:product:${reservation.productId}:user:${reservation.userId}:confirmed`;

      // Get sale for TTL
      const sale = await FlashSale.findById(reservation.flashSaleId);
      const ttl = sale ? Math.ceil((sale.endTime.getTime() - Date.now()) / 1000) : 0;

      // Atomic pipeline for moving stock from reserved to confirmed
      const pipeline = redis.pipeline();
      pipeline.decrby(userReservedKey, reservation.quantity);
      pipeline.incrby(userConfirmedKey, reservation.quantity);
      if (ttl > 0) {
        pipeline.expire(userConfirmedKey, ttl);
      }
      await pipeline.exec();

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
      const reservation = await StockReservation.findById(reservationId);
      if (!reservation || reservation.status !== 'pending') {
        return; // Already processed
      }

      // Return stock to Redis
      const stockKey = `flash:${reservation.flashSaleId}:product:${reservation.productId}:stock`;
      await redis.incrby(stockKey, reservation.quantity);

      // Decrement reserved count
      const userReservedKey = `flash:${reservation.flashSaleId}:product:${reservation.productId}:user:${reservation.userId}:reserved`;
      await redis.decrby(userReservedKey, reservation.quantity);

      // Update reservation status
      reservation.status = 'expired';
      await reservation.save();

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
      const expired = await StockReservation.find({
        status: 'pending',
        expiresAt: { $lt: new Date() },
      });

      console.log(`🧹 Cleaning up ${expired.length} expired reservations`);

      for (const reservation of expired) {
        await this.releaseReservation(reservation._id.toString());
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
      const toActivate = await FlashSale.find({
        status: 'scheduled',
        startTime: { $lte: now },
        endTime: { $gt: now },
      });

      for (const sale of toActivate) {
        sale.status = 'active';
        await sale.save();
        await this.initializeSaleStock(sale);
        console.log(`🚀 Flash sale activated: ${sale.name}`);
      }

      // End active sales
      const toEnd = await FlashSale.find({
        status: 'active',
        endTime: { $lte: now },
      });

      for (const sale of toEnd) {
        sale.status = 'ended';
        await sale.save();
        console.log(`🏁 Flash sale ended: ${sale.name}`);
      }
    } catch (error) {
      console.error('❌ Error updating flash sale statuses:', error);
    }
  }
}

export default new FlashSaleService();
