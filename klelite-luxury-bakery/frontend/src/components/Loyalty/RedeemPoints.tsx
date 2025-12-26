import React, { useState } from 'react';
import styles from './RedeemPoints.module.scss';

interface RedeemPointsProps {
  availablePoints: number;
  onRedeem: (points: number) => void;
}

const RedeemPoints: React.FC<RedeemPointsProps> = ({ availablePoints, onRedeem }) => {
  const [points, setPoints] = useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setPoints(Math.min(value, availablePoints));
  };

  const handleMaxClick = () => {
    setPoints(availablePoints);
  };

  const discount = points * 10; // 1 point = 10 VND

  return (
    <div className={styles.redeemPoints}>
      <h4>Redeem Loyalty Points</h4>
      <p className={styles.available}>
        Available: <strong>{availablePoints.toLocaleString()}</strong> points
      </p>

      <div className={styles.inputGroup}>
        <input
          type="number"
          min="0"
          max={availablePoints}
          value={points || ''}
          onChange={handleChange}
          placeholder="Enter points to redeem"
        />
        <button type="button" onClick={handleMaxClick} className={styles.maxBtn}>
          Max
        </button>
      </div>

      {points > 0 && (
        <div className={styles.discount}>
          <span>Discount:</span>
          <strong>- {discount.toLocaleString()} VND</strong>
        </div>
      )}

      <button
        type="button"
        onClick={() => onRedeem(points)}
        disabled={points === 0}
        className={styles.applyBtn}
      >
        Apply Points
      </button>
    </div>
  );
};

export default RedeemPoints;
