import { useMemo } from 'react';

export default function CircularProgress({
  progress = 0,
  size = 280,
  strokeWidth = 10,
  children,
  isBreak = false,
  isPaused = false,
}) {
  const { radius, circumference, dashOffset, center } = useMemo(() => {
    const r = (size - strokeWidth) / 2 - 8;
    const c = 2 * Math.PI * r;
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    return {
      radius: r,
      circumference: c,
      dashOffset: c * (1 - clampedProgress),
      center: size / 2,
    };
  }, [size, strokeWidth, progress]);

  const activeColor = isBreak ? '#F59E0B' : '#FF5500';

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <defs>
          <filter id="orange-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FF5500" floodOpacity="0.4" />
          </filter>
          <filter id="amber-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Brutalist ring */}
        <circle
          cx={center}
          cy={center}
          r={radius + 6}
          fill="none"
          stroke="#18181b"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#121214"
          strokeWidth={strokeWidth}
        />

        {/* Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="square"
          filter={isBreak ? 'url(#amber-glow)' : 'url(#orange-glow)'}
          className={`transition-all duration-300 ${isPaused ? 'opacity-50' : 'opacity-100'}`}
        />

        {/* 4 Cardinal Notch Marks */}
        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = center + (radius - strokeWidth / 2 - 4) * Math.cos(rad);
          const y1 = center + (radius - strokeWidth / 2 - 4) * Math.sin(rad);
          const x2 = center + (radius + strokeWidth / 2 + 4) * Math.cos(rad);
          const y2 = center + (radius + strokeWidth / 2 + 4) * Math.sin(rad);
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#27272a"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Centered Content HUD */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
}
