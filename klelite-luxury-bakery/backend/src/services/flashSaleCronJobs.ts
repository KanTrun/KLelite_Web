import flashSaleService from '../services/flashSaleService';

/**
 * Flash Sale Cleanup Jobs
 * - Cleanup expired reservations every 1 minute
 * - Update flash sale statuses every 30 seconds
 */
class FlashSaleCronJobs {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private statusUpdateInterval: NodeJS.Timeout | null = null;

  /**
   * Start all cron jobs
   */
  start(): void {
    // Cleanup expired reservations every 1 minute
    this.cleanupInterval = setInterval(async () => {
      try {
        await flashSaleService.cleanupExpiredReservations();
      } catch (error) {
        console.error('❌ Cleanup cron job error:', error);
      }
    }, 60 * 1000); // 1 minute

    // Update flash sale statuses every 30 seconds
    this.statusUpdateInterval = setInterval(async () => {
      try {
        await flashSaleService.updateFlashSaleStatuses();
      } catch (error) {
        console.error('❌ Status update cron job error:', error);
      }
    }, 30 * 1000); // 30 seconds

    console.log('✅ Flash sale cron jobs started');
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }

    console.log('⚠️  Flash sale cron jobs stopped');
  }
}

export default new FlashSaleCronJobs();
