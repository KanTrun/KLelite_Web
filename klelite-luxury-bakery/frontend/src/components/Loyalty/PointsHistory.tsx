import React from 'react';
import styles from './PointsHistory.module.scss';
import type { PointTransaction } from '@/services/loyaltyService';

interface PointsHistoryProps {
  history: PointTransaction[];
}

const PointsHistory: React.FC<PointsHistoryProps> = ({ history }) => {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      earn: 'Earned',
      redeem: 'Redeemed',
      expire: 'Expired',
      adjust: 'Adjusted',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      earn: '#27ae60',
      redeem: '#e74c3c',
      expire: '#95a5a6',
      adjust: '#f39c12',
    };
    return colors[type] || '#7f8c8d';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (history.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No transaction history yet</p>
      </div>
    );
  }

  return (
    <div className={styles.pointsHistory}>
      <h4>Transaction History</h4>
      <div className={styles.transactions}>
        {history.map((transaction, index) => (
          <div key={index} className={styles.transaction}>
            <div className={styles.info}>
              <span
                className={styles.type}
                style={{ color: getTypeColor(transaction.type) }}
              >
                {getTypeLabel(transaction.type)}
              </span>
              <span className={styles.description}>{transaction.description}</span>
              <span className={styles.date}>{formatDate(transaction.createdAt)}</span>
            </div>
            <div
              className={styles.amount}
              style={{ color: transaction.amount >= 0 ? '#27ae60' : '#e74c3c' }}
            >
              {transaction.amount >= 0 ? '+' : ''}
              {transaction.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PointsHistory;
