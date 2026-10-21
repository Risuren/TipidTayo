import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ChevronRight,
  ChevronLeft,
  X,
  CalendarDays,
  Wallet,
  ShieldCheck,
  PieChart,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TiPig from '../mascot/TiPig';
import api from '../../api/axios';

const TOUR_STEPS = [
  {
    stepId: 'step1_daily',
    systemStepNumber: 3,
    tourOrderNumber: 1,
    title: 'Daily Spending Quota & Rollover Engine',
    tabName: 'Daily Budget',
    path: '/daily-limit',
    icon: CalendarDays,
    pose: 'pointing',
    speech:
      "Welcome to your main daily dashboard! Your spending limit updates live every time you log a purchase. If you stay under budget, your unspent cash rolls over at midnight to increase tomorrow's budget. Overspent today? Future days automatically re-balance so you never run out of baon!",
    spotlightTarget: 'Circular Quota Dial, Midnight Rollover, & "Kaya ba?" Simulator',
    keyPoints: [
      'Circular visual dial displays your live safe-to-spend balance for today',
      'Automatic midnight rollover: unspent money expands tomorrow\'s budget',
      'Use "Kaya ba?" before major purchases to simulate multi-day quota impact',
    ],
  },
  {
    stepId: 'step2_allowance',
    systemStepNumber: 1,
    tourOrderNumber: 2,
    title: 'Allowance Allocation & Mid-Cycle Cash Padala',
    tabName: 'Enter Allowance',
    path: '/allowance',
    icon: Wallet,
    pose: 'welcome',
    speech:
      'This is where your cycle budget originates! Set your allowance amount, cycle duration (e.g. 5-day school week or 7-day full week), and target savings percentage. If you receive an unexpected cash padala from parents mid-cycle, add a quick top-up here with instant quota recalculation.',
    spotlightTarget: 'Cycle Duration, Top-Up Inflow, & Target Savings Lock',
    keyPoints: [
      'Configure custom cycle length (e.g. 5-day school week or 7-day full week)',
      'Log sudden cash padala top-ups with immediate live quota recalculation',
      'Target Savings percentage locked and ring-fenced from Day 1 to finish',
    ],
  },
  {
    stepId: 'step3_reserves',
    systemStepNumber: 2,
    tourOrderNumber: 3,
    title: '3-Bucket Reserve System & Essential Vaults',
    tabName: 'Reserve Essentials',
    path: '/reserves',
    icon: ShieldCheck,
    pose: 'vault',
    speech:
      'Your financial armor against petsa de peligro! We segregate your money into 3 buckets: Bucket 1 protects fixed essentials (dorm rent, tuition, school projects), Bucket 2 holds emergency buffers, and Bucket 3 powers your daily spendable baon. You can also schedule future payments in advance.',
    spotlightTarget: '3-Bucket Architecture & Scheduled Bill Reservations',
    keyPoints: [
      'Bucket 1: Ring-fence fixed project fees & rent so they are never spent on snacks',
      'Bucket 2: Safety cushion for unexpected campus emergencies',
      'Bucket 3: Spendable baon pool distributed evenly across cycle days',
    ],
  },
  {
    stepId: 'step4_review',
    systemStepNumber: 5,
    tourOrderNumber: 4,
    title: 'Weekly Review, Trends & Tipid Streaks',
    tabName: 'Weekly Review',
    path: '/review',
    icon: PieChart,
    pose: 'celebrating',
    speech:
      'Celebrate your discipline at cycle finish! Explore interactive day-by-day spending bar graphs, clear grid alignments, category breakdowns, and your Tipid Streak habit score. See your actual cash savings accumulated across cycles and get AI diagnostic insights.',
    spotlightTarget: 'Interactive Spending Graph, Category Breakdown & Tipid Streak',
    keyPoints: [
      'Day-by-day expense graph with clear grid lines for accurate daily pacing',
      'Category breakdown reveals exactly where your student allowance went',
      'Tipid Streak tracking consecutive on-budget days across multiple cycles',
    ],
  },
  {
    stepId: 'step5_diskarte',
    systemStepNumber: null,
    tourOrderNumber: 5,
    title: 'Diskarte Hub, Student Wisdom & Cash Growth',
    tabName: 'Diskarte Hub',
    path: '/diskarte',
    icon: Lightbulb,
    pose: 'safe',
    speech:
      'Put your accumulated savings to work! Discover student-vetted micro-investment pathways (digital banks, Pag-IBIG MP2, micro-freelancing) and consult the TiPig Wealth Compass. Share your own budgeting diskarte and learn clever tipid hacks from fellow students.',
    spotlightTarget: 'Micro-Investment Guides, Wealth Compass & Community Diskarte',
    keyPoints: [
      'Explore student-friendly, low-risk wealth builders (Maya, SeaBank, MP2)',
      'TiPig Wealth Compass guides you on physically segregating cash in your wallet',
      'Community Diskarte board to share and upvote student money-saving hacks',
    ],
  },
];

export const AppTourModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserState, refreshDashboard } = useAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = TOUR_STEPS[currentStepIndex];

  // ALWAYS reset to the very first slide (Tour 1) when the tour opens or is replayed from settings!
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Navigate to the relevant tab as the user navigates through the tour
  useEffect(() => {
    if (isOpen && currentStep) {
      if (location.pathname !== currentStep.path) {
        navigate(currentStep.path);
      }
    }
  }, [currentStepIndex, isOpen]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleCompleteTour();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleCompleteTour = async () => {
    try {
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#4CAF50', '#F59E0B', '#2E7D32', '#FBBF24'],
      });
    } catch (e) {
      // Confetti fallback
    }

    try {
      await api.post('/onboarding/tutorial/seen');
      updateUserState({ has_seen_tutorial: true });
      await refreshDashboard();
    } catch (err) {
      updateUserState({ has_seen_tutorial: true });
    }

    if (onClose) onClose();
  };

  const handleSkipTour = async () => {
    try {
      await api.post('/onboarding/tutorial/seen');
      updateUserState({ has_seen_tutorial: true });
      await refreshDashboard();
    } catch (err) {
      updateUserState({ has_seen_tutorial: true });
    }

    if (onClose) onClose();
  };

  if (!isOpen || !currentStep) return null;

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      {/* 
        The background remains 100% visible, sharp, and interactive.
        A floating interactive coachmark card is docked at the bottom with clean highlight.
      */}
      <motion.div
        key={currentStep.stepId}
        className="app-tour-card"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          left: 'auto',
          zIndex: 11500,
          width: 'calc(100% - 40px)',
          maxWidth: '560px',
          maxHeight: 'calc(100dvh - 90px)',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22), 0 0 0 2px var(--gold-400)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Floating Coachmark Header: Only Tour # and Close/Skip */}
        <div
          className="app-tour-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            backgroundColor: 'var(--green-900)',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="badge-pill badge-gold"
              style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}
            >
              Tour {currentStep.tourOrderNumber} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={handleSkipTour}
            style={{
              background: 'none',
              border: 'none',
              color: '#CBD5E1',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
            }}
            title="Skip or close tour"
          >
            Skip <X size={15} />
          </button>
        </div>

        {/* Coachmark Body */}
        <div
          className="app-tour-body"
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Mascot & TiPig Explanation */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <TiPig state={currentStep.pose} size={typeof window !== 'undefined' && window.innerWidth < 640 ? 54 : 80} interactive={false} />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: 'var(--green-50)',
                  border: '1.5px solid var(--green-200)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  fontSize: '0.84rem',
                  color: 'var(--green-950)',
                  lineHeight: 1.45,
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--green-900)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <StepIcon size={16} color="var(--gold-600)" />
                  {currentStep.title}
                </div>
                {currentStep.speech}
              </div>
            </div>
          </div>

          {/* Key Functionalities Pill List */}
          <div
            style={{
              backgroundColor: 'var(--bg-card-alt)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Spotlight: {currentStep.spotlightTarget}
            </div>
            {currentStep.keyPoints.map((pt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--green-700)', fontWeight: 900 }}>•</span>
                <span>{pt}</span>
              </div>
            ))}
          </div>

          {/* Step Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '2px' }}>
            {TOUR_STEPS.map((s, idx) => (
              <div
                key={s.stepId}
                onClick={() => setCurrentStepIndex(idx)}
                style={{
                  width: currentStepIndex === idx ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: currentStepIndex === idx ? 'var(--gold-500)' : '#D1D5DB',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                title={`Tour ${s.tourOrderNumber}: ${s.tabName}`}
              />
            ))}
          </div>
        </div>

        {/* Action Controls Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#FAFDF9',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <ChevronLeft size={15} /> Prev
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className={currentStepIndex === TOUR_STEPS.length - 1 ? 'btn-primary' : 'btn-gold'}
            style={{ padding: '10px 20px', fontSize: '0.86rem', fontWeight: 800 }}
          >
            {currentStepIndex === TOUR_STEPS.length - 1 ? (
              <>
                <CheckCircle2 size={16} /> Finish Tour & Start
              </>
            ) : (
              <>
                Next Step <ChevronRight size={15} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AppTourModal;
