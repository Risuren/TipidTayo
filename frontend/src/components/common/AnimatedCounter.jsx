import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter: Smoothly animates numbers rolling up or down with easing.
 */
export const AnimatedCounter = ({
  value = 0,
  duration = 0.9,
  decimals = 2,
  prefix = '',
  suffix = '',
  style = {},
  className = '',
}) => {
  const target = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(target);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    const startVal = prevTargetRef.current;
    const endVal = target;
    prevTargetRef.current = target;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    let startTime = null;
    let animFrame = null;
    const totalMs = Math.max(300, duration * 1000);

    // Ease-out cubic easing
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / totalMs);
      const easedProgress = easeOutCubic(progress);

      const current = startVal + (endVal - startVal) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animFrame = requestAnimationFrame(step);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [target, duration]);

  const formatted = displayValue.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className} style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
