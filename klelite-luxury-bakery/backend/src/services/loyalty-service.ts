import { LoyaltyAccount, ILoyaltyAccount } from '../models';
import { AppError } from '../utils';

export class LoyaltyService {
  /**
   * Get or create loyalty account for user
   */
  async getOrCreateAccount(userId: string): Promise<ILoyaltyAccount> {
    let account = await LoyaltyAccount.findOne({ userId });

    if (!account) {
      account = await LoyaltyAccount.create({ userId });
    }

    return account;
  }

  /**
   * Earn points from completed order
   */
  async earnPoints(
    userId: string,
    orderId: string,
    orderTotal: number
  ): Promise<number> {
    const account = await this.getOrCreateAccount(userId);

    // Calculate points based on tier multiplier
    const multiplier = this.getTierMultiplier(account.tier);
    const points = Math.floor((orderTotal / 1000) * multiplier);

    // Set expiration date (12 months from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Update account
    account.currentPoints += points;
    account.lifetimePoints += points;
    account.history.push({
      type: 'earn',
      amount: points,
      orderId: orderId as any,
      description: `Earned ${points} points from order`,
      expiresAt,
      createdAt: new Date(),
    });

    // Update tier based on lifetime points
    account.tier = this.calculateTier(account.lifetimePoints);

    await account.save();

    return points;
  }

  /**
   * Redeem points at checkout
   */
  async redeemPoints(
    userId: string,
    orderId: string,
    points: number
  ): Promise<number> {
    if (points <= 0) {
      throw new AppError('Points must be greater than 0', 400);
    }

    const account = await this.getOrCreateAccount(userId);

    if (account.currentPoints < points) {
      throw new AppError('Insufficient points', 400);
    }

    // Deduct points
    account.currentPoints -= points;
    account.history.push({
      type: 'redeem',
      amount: -points,
      orderId: orderId as any,
      description: `Redeemed ${points} points on order`,
      createdAt: new Date(),
    });

    await account.save();

    // 1 point = 10 VND discount
    return points * 10;
  }

  /**
   * Adjust points (admin only)
   */
  async adjustPoints(
    userId: string,
    amount: number,
    description: string
  ): Promise<ILoyaltyAccount> {
    const account = await this.getOrCreateAccount(userId);

    account.currentPoints += amount;
    if (amount > 0) {
      account.lifetimePoints += amount;
    }

    account.history.push({
      type: 'adjust',
      amount,
      description,
      createdAt: new Date(),
    });

    // Update tier if points increased
    if (amount > 0) {
      account.tier = this.calculateTier(account.lifetimePoints);
    }

    // Prevent negative balance
    if (account.currentPoints < 0) {
      account.currentPoints = 0;
    }

    await account.save();

    return account;
  }

  /**
   * Expire points (cron job)
   */
  async expirePoints(): Promise<{ expired: number; total: number }> {
    const now = new Date();
    const accounts = await LoyaltyAccount.find({
      'history.expiresAt': { $lt: now },
    });

    let totalExpired = 0;
    let accountsAffected = 0;

    for (const account of accounts) {
      let accountExpired = 0;

      // Find expired transactions that haven't been processed
      for (const transaction of account.history) {
        if (
          transaction.type === 'earn' &&
          transaction.expiresAt &&
          transaction.expiresAt < now &&
          transaction.amount > 0
        ) {
          accountExpired += transaction.amount;
          // Mark as processed by setting amount to 0
          transaction.amount = 0;
        }
      }

      if (accountExpired > 0) {
        account.currentPoints = Math.max(0, account.currentPoints - accountExpired);
        account.history.push({
          type: 'expire',
          amount: -accountExpired,
          description: `${accountExpired} points expired`,
          createdAt: new Date(),
        });

        await account.save();

        totalExpired += accountExpired;
        accountsAffected++;
      }
    }

    return { expired: totalExpired, total: accountsAffected };
  }

  /**
   * Get tier multiplier
   */
  getTierMultiplier(tier: string): number {
    const multipliers: Record<string, number> = {
      bronze: 1.0,
      silver: 1.2,
      gold: 1.5,
      platinum: 2.0,
    };
    return multipliers[tier] || 1.0;
  }

  /**
   * Calculate tier based on lifetime points
   */
  calculateTier(lifetimePoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (lifetimePoints >= 50000) return 'platinum';
    if (lifetimePoints >= 20000) return 'gold';
    if (lifetimePoints >= 5000) return 'silver';
    return 'bronze';
  }

  /**
   * Get tier benefits
   */
  getTierBenefits(tier: string): {
    name: string;
    multiplier: number;
    threshold: number;
    benefits: string[];
  } {
    const tiers: Record<string, any> = {
      bronze: {
        name: 'Bronze',
        multiplier: 1.0,
        threshold: 0,
        benefits: ['Base earning rate'],
      },
      silver: {
        name: 'Silver',
        multiplier: 1.2,
        threshold: 5000,
        benefits: ['1.2x points earning', 'Early access to new products'],
      },
      gold: {
        name: 'Gold',
        multiplier: 1.5,
        threshold: 20000,
        benefits: ['1.5x points earning', 'Free shipping', 'Birthday rewards'],
      },
      platinum: {
        name: 'Platinum',
        multiplier: 2.0,
        threshold: 50000,
        benefits: ['2x points earning', 'Free shipping', 'Exclusive offers', 'Priority support'],
      },
    };

    return tiers[tier] || tiers.bronze;
  }
}

export const loyaltyService = new LoyaltyService();
