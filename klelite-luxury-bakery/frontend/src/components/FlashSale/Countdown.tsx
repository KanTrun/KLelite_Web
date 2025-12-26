import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date | string;
  onComplete?: () => void;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, onComplete, className = '' }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft: TimeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else if (onComplete && difference <= 0 && difference > -1000) {
      // Trigger complete only once when it just finished
      onComplete();
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className={`flex items-center space-x-2 font-mono text-sm sm:text-base ${className}`}>
      {timeLeft.days > 0 && (
        <>
          <div className="flex flex-col items-center">
            <span className="bg-amber-600 text-white px-2 py-1 rounded font-bold min-w-[40px] text-center">
              {formatNumber(timeLeft.days)}
            </span>
            <span className="text-xs text-gray-500 mt-1 uppercase">Ngày</span>
          </div>
          <span className="font-bold text-gray-400 mb-4">:</span>
        </>
      )}

      <div className="flex flex-col items-center">
        <span className="bg-amber-600 text-white px-2 py-1 rounded font-bold min-w-[40px] text-center">
          {formatNumber(timeLeft.hours)}
        </span>
        <span className="text-xs text-gray-500 mt-1 uppercase">Giờ</span>
      </div>
      <span className="font-bold text-gray-400 mb-4">:</span>

      <div className="flex flex-col items-center">
        <span className="bg-amber-600 text-white px-2 py-1 rounded font-bold min-w-[40px] text-center">
          {formatNumber(timeLeft.minutes)}
        </span>
        <span className="text-xs text-gray-500 mt-1 uppercase">Phút</span>
      </div>
      <span className="font-bold text-gray-400 mb-4">:</span>

      <div className="flex flex-col items-center">
        <span className="bg-amber-600 text-white px-2 py-1 rounded font-bold min-w-[40px] text-center">
          {formatNumber(timeLeft.seconds)}
        </span>
        <span className="text-xs text-gray-500 mt-1 uppercase">Giây</span>
      </div>
    </div>
  );
};

export default Countdown;
