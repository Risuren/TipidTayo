import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Award,
  PiggyBank,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../../api/axios';
import useDraggableScroll from '../../hooks/useDraggableScroll';

export const MultiCycleSavingsLineChart = ({ activeCycleId }) => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const cycleScroll = useDraggableScroll();

  useEffect(() => {
    const fetchCycleHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get('/budget-cycles');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCycles(res.data);
          const active = res.data.find((c) => c.is_active) || res.data[res.data.length - 1];
          if (active) {
            setSelectedCycleId(active.id);
          }
        }
      } catch (err) {
        console.warn('Failed to load cycle history for line graph', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCycleHistory();
  }, [activeCycleId]);

  // Compute long-term statistics & chart points
  const {
    chartData,
    maxVal,
    yGridLines,
    totalAccumulatedSavings,
    targetPreservationRate,
    avgSavingsPerCycle,
    nextMilestone,
  } = useMemo(() => {
    if (!cycles || cycles.length === 0) {
      return {
        chartData: [],
        maxVal: 500,
        yGridLines: [0, 100, 200, 300, 400, 500],
        totalAccumulatedSavings: 0,
        targetPreservationRate: 100,
        avgSavingsPerCycle: 0,
        nextMilestone: 1000,
      };
    }

    // Cumulative savings running total
    let runningSavings = 0;
    let runningTarget = 0;
    let targetsAchievedCount = 0;

    const dataPoints = cycles.map((c, index) => {
      const actualSaved = Number(c.actual_saved || 0);
      const targetGoal = Number(c.savings_goal || 0);
      runningSavings += actualSaved;
      runningTarget += targetGoal;

      if (actualSaved >= targetGoal && targetGoal > 0) {
        targetsAchievedCount++;
      }

      return {
        id: c.id,
        index,
        cycleNumber: c.cycle_number || index + 1,
        label: c.label || `Cycle #${index + 1}`,
        allowance: Number(c.total_allowance || 0),
        totalSpent: Number(c.total_spent || 0),
        actualSaved,
        targetGoal,
        cumulativeSaved: runningSavings,
        cumulativeTarget: runningTarget,
        isActive: Boolean(c.is_active),
        startDate: c.start_date || c.created_at,
        totalDays: c.total_days || 7,
        savingsAchieved: actualSaved >= targetGoal,
      };
    });

    // If only 1-2 cycles exist, add projected future milestone cycles to give a full projection line!
    const projectedPoints = [...dataPoints];
    if (dataPoints.length < 5) {
      const lastPoint = dataPoints[dataPoints.length - 1];
      const baseGoal = lastPoint ? Math.max(150, lastPoint.targetGoal) : 200;
      let projRunningSavings = runningSavings;
      let projRunningTarget = runningTarget;

      for (let i = dataPoints.length; i < 5; i++) {
        projRunningSavings += baseGoal;
        projRunningTarget += baseGoal;
        projectedPoints.push({
          id: `proj-${i}`,
          index: i,
          cycleNumber: i + 1,
          label: `Cycle #${i + 1}`,
          allowance: lastPoint?.allowance || 1000,
          totalSpent: (lastPoint?.allowance || 1000) - baseGoal,
          actualSaved: baseGoal,
          targetGoal: baseGoal,
          cumulativeSaved: projRunningSavings,
          cumulativeTarget: projRunningTarget,
          isActive: false,
          isProjected: true,
          startDate: null,
          totalDays: 7,
          savingsAchieved: true,
        });
      }
    }

    // Determine scale ceiling
    const highestVal = Math.max(
      ...projectedPoints.map((p) => Math.max(p.actualSaved, p.targetGoal, 200))
    );
    const ceiling = Math.ceil((highestVal * 1.25) / 100) * 100;
    const step = Math.max(50, Math.ceil(ceiling / 4 / 25) * 25);
    const gridLines = [];
    for (let v = 0; v <= ceiling; v += step) {
      gridLines.push(v);
    }

    const preservationRate = cycles.length > 0 ? Math.round((targetsAchievedCount / cycles.length) * 100) : 100;
    const avgSavings = cycles.length > 0 ? runningSavings / cycles.length : 0;
    const milestoneTarget = runningSavings < 1000 ? 1000 : Math.ceil((runningSavings + 500) / 1000) * 1000;

    return {
      chartData: projectedPoints,
      maxVal: ceiling,
      yGridLines: gridLines,
      totalAccumulatedSavings: runningSavings,
      targetPreservationRate: preservationRate,
      avgSavingsPerCycle: avgSavings,
      nextMilestone: milestoneTarget,
    };
  }, [cycles]);

  // Chart coordinates calculation (SVG coordinate space: 600 wide x 220 high)
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = svgWidth - paddingLeft - paddingRight;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  // Generate SVG paths for Target Goal and Actual Saved lines
  const points = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const count = chartData.length;

    return chartData.map((d, i) => {
      const x = paddingLeft + (count > 1 ? (i / (count - 1)) * innerWidth : innerWidth / 2);
      const yActual = paddingTop + innerHeight - (Math.min(maxVal, d.actualSaved) / maxVal) * innerHeight;
      const yTarget = paddingTop + innerHeight - (Math.min(maxVal, d.targetGoal) / maxVal) * innerHeight;
      return {
        ...d,
        x,
        yActual,
        yTarget,
      };
    });
  }, [chartData, innerWidth, innerHeight, maxVal]);

  // SVG Line paths
  const actualLinePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.yActual}` : `${acc} L ${p.x} ${p.yActual}`;
    }, '');
  }, [points]);

  const targetLinePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.yTarget}` : `${acc} L ${p.x} ${p.yTarget}`;
    }, '');
  }, [points]);

  // Area under the actual line for smooth gradient fill
  const actualAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baselineY = paddingTop + innerHeight;
    return `${actualLinePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [actualLinePath, points]);

  // Safely resolved active/selected cycle point from points
  const activePoint = useMemo(() => {
    if (!points || points.length === 0) return null;
    if (selectedCycleId) {
      const found = points.find((p) => p.id === selectedCycleId);
      if (found) return found;
    }
    const active = points.find((p) => p.isActive);
    if (active) return active;
    const lastReal = points.filter((p) => !p.isProjected).pop();
    return lastReal || points[0];
  }, [points, selectedCycleId]);

  // Gently auto-scroll to active cycle point on initial mount if positioned far right
  useEffect(() => {
    if (!cycleScroll.ref.current || !activePoint) return;
    if (activePoint.x > 280) {
      const scrollPos = Math.max(0, activePoint.x - 200);
      cycleScroll.ref.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [activePoint?.id]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Multi-Cycle Savings History...
      </div>
    );
  }

  return (
    <div
      className="card multi-cycle-chart-card"
      style={{
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1.5px solid var(--border-light)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* 1. Header with Long-Term Projections Title & Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={22} color="var(--green-700)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--green-950)', margin: 0 }}>
              Multi-Cycle Savings Progress & Projections
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Track how your Target Savings discipline compounds across cycles. Tap any cycle node to inspect historical stats.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '3px', backgroundColor: '#10B981', borderRadius: '2px' }} />
            <strong style={{ color: '#065F46' }}>Actual Cash Saved</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '2px', borderTop: '2px dashed #F59E0B' }} />
            <span style={{ color: '#B45309' }}>Target Goal</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60A5FA' }} />
            <span>Projected</span>
          </span>
        </div>
      </div>

      {/* 2. Multi-Cycle Vital Stat Bento Pods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '22px' }}>
        <div style={{ padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '14px', border: '1px solid #BBF7D0' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
            Total Accumulated Saved
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
            ₱{totalAccumulatedSavings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#166534', display: 'block', marginTop: '2px' }}>
            Across {cycles.length} completed & active {cycles.length === 1 ? 'cycle' : 'cycles'}
          </span>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#FEFCE8', borderRadius: '14px', border: '1px solid #FEF08A' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#854D0E', textTransform: 'uppercase' }}>
            Target Discipline Rate
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#A16207', marginTop: '2px' }}>
            {targetPreservationRate}%
          </div>
          <span style={{ fontSize: '0.7rem', color: '#854D0E', display: 'block', marginTop: '2px' }}>
            Cycles where savings was 100% safe
          </span>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#EFF6FF', borderRadius: '14px', border: '1px solid #BFDBFE' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>
            Average Saved / Cycle
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1D4ED8', marginTop: '2px' }}>
            ₱{avgSavingsPerCycle.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#1E40AF', display: 'block', marginTop: '2px' }}>
            Pacing per allowance cycle
          </span>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#FAF5FF', borderRadius: '14px', border: '1px solid #E9D5FF' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B21A8', textTransform: 'uppercase' }}>
            Next Milestone Target
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#7E22CE', marginTop: '2px' }}>
            ₱{nextMilestone.toLocaleString('en-PH')}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#6B21A8', display: 'block', marginTop: '2px' }}>
            ₱{Math.max(0, nextMilestone - totalAccumulatedSavings).toFixed(2)} remaining to hit badge
          </span>
        </div>
      </div>

      {/* 3. Responsive SVG Cartesian Line Graph with Motion Draw */}
      <div className="chart-controls-bar">
        <div className="chart-hint-pill">
          <MoveHorizontal size={14} color="var(--green-700)" />
          <span>Slide or drag graph to view multi-cycle trajectory</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => cycleScroll.scrollByAmount(-180)}
            disabled={!cycleScroll.canScrollLeft}
            className="chart-nav-btn"
            title="Slide to earlier cycles"
            aria-label="Slide to earlier cycles"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => cycleScroll.scrollByAmount(180)}
            disabled={!cycleScroll.canScrollRight}
            className="chart-nav-btn"
            title="Slide to future cycles"
            aria-label="Slide to future cycles"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={cycleScroll.ref}
        {...cycleScroll.events}
        className="chart-scroll-container"
        style={{ width: '100%', paddingBottom: '10px' }}
      >
        <div style={{ minWidth: '580px', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              {/* Gradient under actual savings line */}
              <linearGradient id="savingsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yGridLines.map((val, idx) => {
              const y = paddingTop + innerHeight - (val / maxVal) * innerHeight;
              return (
                <g key={`y-grid-${idx}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke={val === 0 ? '#CBD5E1' : '#F1F5F9'}
                    strokeDasharray={val === 0 ? 'none' : '4 4'}
                    strokeWidth={val === 0 ? '1.5' : '1'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--text-muted)"
                  >
                    ₱{val}
                  </text>
                </g>
              );
            })}

            {/* Area fill under Actual Line */}
            {actualAreaPath && (
              <motion.path
                d={actualAreaPath}
                fill="url(#savingsAreaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              />
            )}

            {/* Target Goal Line (Dashed Golden Line) */}
            {targetLinePath && (
              <motion.path
                d={targetLinePath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="5 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            )}

            {/* Actual Saved Line (Solid Emerald Line) */}
            {actualLinePath && (
              <motion.path
                d={actualLinePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            )}

            {/* Interactive Data Nodes */}
            {points.map((p) => {
              const isSelected = activePoint?.id === p.id;
              const isProjected = p.isProjected;

              return (
                <g
                  key={`node-${p.id}`}
                  onClick={() => {
                    if (cycleScroll.hasMoved.current) return;
                    setSelectedCycleId(p.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Vertical hover guide */}
                  {isSelected && (
                    <line
                      x1={p.x}
                      y1={paddingTop}
                      x2={p.x}
                      y2={paddingTop + innerHeight}
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Target Node */}
                  <circle
                    cx={p.x}
                    cy={p.yTarget}
                    r={isSelected ? 4.5 : 3.5}
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

                  {/* Actual Saved Node with Pulse */}
                  <motion.circle
                    cx={p.x}
                    cy={p.yActual}
                    r={isSelected ? 7 : isProjected ? 4.5 : 5.5}
                    fill={isProjected ? '#60A5FA' : '#10B981'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    whileHover={{ scale: 1.4 }}
                    style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' : 'none' }}
                  />

                  {/* Amount label above node */}
                  <text
                    x={p.x}
                    y={p.yActual - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill={isProjected ? '#2563EB' : '#065F46'}
                  >
                    ₱{Number(p.actualSaved || 0).toFixed(0)}
                  </text>

                  {/* X-Axis Cycle Label */}
                  <text
                    x={p.x}
                    y={paddingTop + innerHeight + 18}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={p.isActive || isSelected ? '900' : '600'}
                    fill={p.isActive ? 'var(--green-900)' : 'var(--text-secondary)'}
                  >
                    C{p.cycleNumber}
                  </text>
                  <text
                    x={p.x}
                    y={paddingTop + innerHeight + 30}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="500"
                    fill="var(--text-muted)"
                  >
                    {p.isProjected ? 'Proj' : p.isActive ? 'Active' : `${p.totalDays}d`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4. Selected Cycle Detail Drawer */}
      {activePoint && (
        <motion.div
          key={activePoint.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="multi-cycle-detail-card"
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: activePoint.isActive ? '#DCFCE7' : '#E2E8F0',
                  color: activePoint.isActive ? '#15803D' : '#475569',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {activePoint.isProjected ? 'Projected Milestone' : activePoint.isActive ? 'Active Cycle' : 'Completed Cycle'}
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--green-950)', margin: 0 }}>
                {activePoint.label}
              </h4>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {activePoint.isProjected
                ? 'Estimated milestone trajectory based on your standard target savings rate.'
                : `Total allowance: ₱${Number(activePoint.allowance || 0).toFixed(2)} • Total logged expenses: ₱${Number(activePoint.totalSpent || 0).toFixed(2)}`}
            </p>
          </div>

          <div className="cycle-detail-stats-row">
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target Savings</span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#B45309' }}>
                ₱{Number(activePoint.targetGoal || 0).toFixed(2)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Actual Preserved</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803D' }}>
                ₱{Number(activePoint.actualSaved || 0).toFixed(2)}
              </div>
            </div>

            <div
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: Number(activePoint.actualSaved || 0) >= Number(activePoint.targetGoal || 0) ? '#DCFCE7' : '#FEF2F2',
                color: Number(activePoint.actualSaved || 0) >= Number(activePoint.targetGoal || 0) ? '#15803D' : '#DC2626',
                fontSize: '0.74rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              {Number(activePoint.actualSaved || 0) >= Number(activePoint.targetGoal || 0) ? (
                <>
                  <CheckCircle2 size={14} /> Target Preserved!
                </>
              ) : (
                <>
                  Partially Tapped
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MultiCycleSavingsLineChart;
