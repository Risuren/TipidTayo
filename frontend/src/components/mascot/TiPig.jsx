import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const TiPig = ({
  state = 'safe',
  size = 140,
  interactive = true,
  onClick,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // Map aliases to official pose states
  const stateAliases = {
    tour_allowance: 'welcome',
    wave: 'welcome',
    hello: 'welcome',
    tour_vault: 'vault',
    shield: 'vault',
    saving: 'vault',
    tour_daily: 'pointing',
    dial: 'pointing',
    calculator: 'pointing',
    tour_logging: 'logging',
    receipt: 'logging',
    recording: 'logging',
    tour_review: 'celebrating',
    celebrate: 'celebrating',
    trophy: 'celebrating',
    proud: 'celebrating',
  };

  const resolvedState = stateAliases[state] || state;
  const validStates = [
    'safe',
    'warning',
    'peligro',
    'thinking',
    'welcome',
    'vault',
    'pointing',
    'logging',
    'celebrating',
  ];
  const finalState = validStates.includes(resolvedState) ? resolvedState : 'safe';

  // Reset image error state whenever the target pose changes
  useEffect(() => {
    setImgError(false);
  }, [finalState]);

  // Primary source is the dedicated SVG pose; fallback is tipig-safe.svg
  const imgSrc = imgError
    ? '/mascot/tipig-safe.svg'
    : `/mascot/tipig-${finalState}.svg`;

  return (
    <motion.div
      className={`tipig-mascot-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      animate={
        interactive
          ? {
              y: [0, -6, 0],
              rotate: finalState === 'peligro' ? [-2, 2, -2] : [0, 0.5, 0],
            }
          : {}
      }
      transition={{
        repeat: Infinity,
        duration: finalState === 'peligro' ? 0.6 : 3,
        ease: 'easeInOut',
      }}
      whileHover={interactive ? { scale: 1.05 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
      onClick={onClick}
      role="img"
      aria-label={`TiPig mascot in ${finalState} state`}
    >
      <img
        src={imgSrc}
        alt={`TiPig Mascot (${finalState})`}
        onError={() => setImgError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 8px 16px rgba(27, 67, 50, 0.15))',
        }}
      />
    </motion.div>
  );
};

export default TiPig;
