import prisma from '../lib/prisma';
import { LoyaltyAccount } from '@prisma/client';
import { AppError } from '../utils';

export class LoyaltyService {
  /**
   * Get or create loyalty account for user
   */
  async getOrCreateAccount(userId: string): Promise<LoyaltyAccount> {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          currentPoints: 0,
          lifetimePoints: 0,
          tier: 'BRONZE'
        }
      });
    }

    return account;
  }

  /**
   * Award points for a purchase
   * @param userId - User ID
   * @param orderId - Order ID (for tracking)
   * @param orderTotal - Order total amount
   * @returns Points earned
   */
  async earnPoints(userId: string, orderId: string, orderTotal: number): Promise<number> {
    const account = await this.getOrCreateAccount(userId);

    // Calculate points: 1 point per 1000 VND (configurable)
    const pointsEarned = Math.floor(orderTotal / 1000);

    // Calculate tier bonus
    const tierMultipliers: Record<string, number> = {
      BRONZE: 1,
      SILVER: 1.25,
      GOLD: 1.5,
      PLATINUM: 2
    };

    const multiplier = tierMultipliers[account.tier as string] || 1;
    const finalPoints = Math.floor(pointsEarned * multiplier);

    // Update account
    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        currentPoints: { increment: finalPoints },
        lifetimePoints: { increment: finalPoints }
      }
    });

    // Update tier if needed
    await this.updateTier(account.id);

    return finalPoints;
  }

  /**
   * Redeem points for discount
   * @param userId - User ID
   * @param orderId - Order ID (for tracking)
   * @param points - Points to redeem
   */
  async redeemPoints(userId: string, orderId: string, points: number): Promise<void> {
    const account = await this.getOrCreateAccount(userId);

    if (account.currentPoints < points) {
      throw new AppError('Insufficient loyalty points', 400);
    }

    // Update account
    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        currentPoints: { decrement: points }
      }
    });
  }

  /**
   * Get loyalty account
   */
  async getAccount(userId: string): Promise<LoyaltyAccount> {
    return this.getOrCreateAccount(userId);
  }

  /**
   * Update tier based on lifetime points
   */
  private async updateTier(accountId: string): Promise<void> {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) return;

    const tierThresholds: Record<string, number> = {
      BRONZE: 0,
      SILVER: 10000,
      GOLD: 50000,
      PLATINUM: 100000
    };

    let newTier = 'BRONZE';
    for (const [tier, threshold] of Object.entries(tierThresholds)) {
      if (account.lifetimePoints >= threshold) {
        newTier = tier;
      }
    }

    if (newTier !== account.tier) {
      await prisma.loyaltyAccount.update({
        where: { id: accountId },
        data: { tier: newTier as any }
      });
    }
  }
}

export const loyaltyService = new LoyaltyService();
