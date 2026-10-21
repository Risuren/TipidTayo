import React from 'react';

/**
 * SegmentedCycleBar
 * 
 * Displays cycle timeline as distinct countable daily segments,
 * with a floating bubble pinned precisely above the active day.
 */
export const SegmentedCycleBar = ({
  totalDays = 7,
  currentDay = 1,
  daysLeft = null,
  showSubtext = true,
  height = 10,
  compact = false,
}) => {
  const safeTotal = Math.max(1, Number(totalDays) || 7);
  const safeCurrent = Math.min(safeTotal, Math.max(1, Number(currentDay) || 1));
  const calculatedDaysLeft = daysLeft !== null ? daysLeft : Math.max(0, safeTotal - safeCurrent);
  const isLastDay = safeCurrent >= safeTotal;

  return (
    <div style={{ width: '100%', position: 'relative', padding: compact ? '24px 16px 0 16px' : '28px 20px 0 20px' }}>
      {/* Segmented Daily Blocks with clear dividing lines */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${safeTotal}, 1fr)`,
          gap: '6px',
          alignItems: 'flex-end',
          position: 'relative',
        }}
      >
        {Array.from({ length: safeTotal }, (_, index) => {
          const dayNumber = index + 1;
          const isPast = dayNumber < safeCurrent;
          const isCurrent = dayNumber === safeCurrent;

          let bg = '#E2E8DF'; // future
          let border = '1px solid #CBD5E1';
          let shadow = 'none';

          if (isPast) {
            bg = 'var(--green-600)';
            border = '1px solid var(--green-700)';
          } else if (isCurrent) {
            bg = 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
            border = '1.5px solid var(--gold-500)';
            shadow = '0 0 0 2.5px rgba(245, 158, 11, 0.35)';
          }

          return (
            <div
              key={dayNumber}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {/* Floating Pointer Bubble directly attached to the active day column */}
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: `${height + 7}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    zIndex: 4,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'var(--green-900)',
                      color: '#FEF3C7',
                      fontSize: compact ? '0.67rem' : '0.72rem',
                      fontWeight: 800,
                      padding: compact ? '2px 7px' : '3px 9px',
                      borderRadius: '9999px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid var(--gold-400)',
                    }}
                  >
                    <span>Day {safeCurrent}</span>
                    <span style={{ color: 'var(--gold-400)', fontSize: '0.62rem' }}>• Today</span>
                  </span>
                  {/* Downward triangle pointer arrow */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '5px solid var(--green-900)',
                      marginTop: '-1px',
                    }}
                  />
                </div>
              )}

              {/* Segment block */}
              <div
                title={`Day ${dayNumber}${isCurrent ? ' (Today)' : isPast ? ' (Passed)' : ' (Remaining)'}`}
                style={{
                  height: `${height}px`,
                  background: bg,
                  border,
                  borderRadius: '5px',
                  boxShadow: shadow,
                  width: '100%',
                  cursor: 'default',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Subtext: Countable status in English */}
      {showSubtext && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            fontSize: compact ? '0.72rem' : '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            Day <strong>{safeCurrent}</strong> of <strong>{safeTotal}</strong>
          </span>
          <span style={{ fontWeight: 700, color: isLastDay ? 'var(--status-danger)' : 'var(--green-800)' }}>
            {isLastDay ? 'Final day of cycle' : `${calculatedDaysLeft} ${calculatedDaysLeft === 1 ? 'day' : 'days'} left after today`}
          </span>
        </div>
      )}
    </div>
  );
};

export default SegmentedCycleBar;
