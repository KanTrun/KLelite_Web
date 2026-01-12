import React, { useMemo } from 'react';
import './SeasonalEffects.scss';

interface EffectProps {
  intensity?: 'light' | 'medium' | 'heavy';
}

// Snowfall Effect for Christmas
export const SnowfallEffect: React.FC<EffectProps> = ({ intensity = 'light' }) => {
  const snowflakeCount = intensity === 'light' ? 25 : intensity === 'medium' ? 40 : 60;
  
  const snowflakes = useMemo(() => 
    Array.from({ length: snowflakeCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 8}s`,
      size: `${4 + Math.random() * 8}px`,
      opacity: 0.3 + Math.random() * 0.7,
    })), [snowflakeCount]
  );

  return (
    <div className="seasonal-effect snowfall">
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
};

// Fireworks Effect for Tet
export const FireworksEffect: React.FC<EffectProps> = ({ intensity = 'medium' }) => {
  const sparkleCount = intensity === 'light' ? 15 : intensity === 'medium' ? 25 : 40;
  
  const sparkles = useMemo(() => 
    Array.from({ length: sparkleCount }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      top: `${Math.random() * 60}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${1.5 + Math.random() * 2}s`,
      size: `${6 + Math.random() * 10}px`,
      color: ['#FFD700', '#FF6B6B', '#FFA500', '#FF4500'][Math.floor(Math.random() * 4)],
    })), [sparkleCount]
  );

  return (
    <div className="seasonal-effect fireworks">
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: sparkle.delay,
            animationDuration: sparkle.duration,
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: sparkle.color,
            boxShadow: `0 0 10px ${sparkle.color}, 0 0 20px ${sparkle.color}`,
          }}
        />
      ))}
    </div>
  );
};

// Hearts Effect for Valentine
export const ValentineEffect: React.FC<EffectProps> = ({ intensity = 'light' }) => {
  const heartCount = intensity === 'light' ? 15 : intensity === 'medium' ? 25 : 40;
  
  const hearts = useMemo(() => 
    Array.from({ length: heartCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 6}s`,
      duration: `${6 + Math.random() * 8}s`,
      size: `${10 + Math.random() * 15}px`,
      opacity: 0.4 + Math.random() * 0.5,
    })), [heartCount]
  );

  return (
    <div className="seasonal-effect valentine">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="heart"
          style={{
            left: heart.left,
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            fontSize: heart.size,
            opacity: heart.opacity,
          }}
        >
          ♥
        </div>
      ))}
    </div>
  );
};
