import React from 'react';
import styles from './PointsBalance.module.scss';
import type { LoyaltyAccount } from '@/services/loyaltyService';

interface PointsBalanceProps {
  account: LoyaltyAccount;
}

const PointsBalance: React.FC<PointsBalanceProps> = ({ account }) => {
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2',
    };
    return colors[tier] || colors.bronze;
  };

  const getNextTier = () => {
    const tiers = [
      { name: 'bronze', threshold: 0 },
      { name: 'silver', threshold: 5000 },
      { name: 'gold', threshold: 20000 },
      { name: 'platinum', threshold: 50000 },
    ];

    const currentIndex = tiers.findIndex(t => t.name === account.tier);
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    return null;
  };

  const nextTier = getNextTier();
  const progress = nextTier
    ? ((account.lifetimePoints / nextTier.threshold) * 100)
    : 100;

  return (
    <div className={styles.pointsBalance}>
      <div className={styles.header}>
        <h3>Loyalty Points</h3>
        <span className={styles.tier} style={{ color: getTierColor(account.tier) }}>
          {account.tier.toUpperCase()}
        </span>
      </div>

      <div className={styles.points}>
        <div className={styles.current}>
          <span className={styles.value}>{account.currentPoints.toLocaleString()}</span>
          <span className={styles.label}>Available Points</span>
        </div>
        <div className={styles.lifetime}>
          <span className={styles.value}>{account.lifetimePoints.toLocaleString()}</span>
          <span className={styles.label}>Lifetime Points</span>
        </div>
      </div>

      {nextTier && (
        <div className={styles.progress}>
          <div className={styles.progressHeader}>
            <span>Progress to {nextTier.name.toUpperCase()}</span>
            <span>{account.lifetimePoints.toLocaleString()} / {nextTier.threshold.toLocaleString()}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className={styles.benefits}>
        <h4>Your Benefits</h4>
        <ul>
          {account.tierInfo.benefits.map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PointsBalance;
