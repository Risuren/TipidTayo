import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Universal Hook for smooth horizontal drag-to-scroll & slide controls
 * Works seamlessly with mouse drag, touch devices, and button clicks.
 */
export const useDraggableScroll = () => {
  const ref = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  const hasMoved = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  const scrollTimeout = useRef(null);

  const onScroll = useCallback(() => {
    updateScrollState();
    hasMoved.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      hasMoved.current = false;
    }, 180);
  }, [updateScrollState]);

  useEffect(() => {
    updateScrollState();
    const el = ref.current;
    if (!el) return;

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateScrollState);

    const timer = setTimeout(updateScrollState, 300);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateScrollState);
      clearTimeout(timer);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [updateScrollState, onScroll]);

  const onMouseDown = (e) => {
    if (!ref.current) return;
    isDown.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeftPos.current = ref.current.scrollLeft;
  };

  const onMouseLeave = () => {
    isDown.current = false;
    if (ref.current) {
      ref.current.style.cursor = 'grab';
    }
  };

  const onMouseUp = () => {
    isDown.current = false;
    if (ref.current) {
      ref.current.style.cursor = 'grab';
    }
    // Briefly hold hasMoved so click handler knows it was a drag
    if (hasMoved.current) {
      setTimeout(() => {
        hasMoved.current = false;
      }, 120);
    }
  };

  const onMouseMove = (e) => {
    if (!isDown.current || !ref.current) return;
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMoved.current = true;
      ref.current.style.cursor = 'grabbing';
      ref.current.scrollLeft = scrollLeftPos.current - walk;
    }
  };

  const onTouchStart = () => {
    hasMoved.current = false;
  };

  const onTouchMove = () => {
    hasMoved.current = true;
  };

  const onTouchEnd = () => {
    if (hasMoved.current) {
      setTimeout(() => {
        hasMoved.current = false;
      }, 180);
    }
  };

  const scrollByAmount = (amount) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  return {
    ref,
    canScrollLeft,
    canScrollRight,
    hasMoved,
    scrollByAmount,
    events: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
};

export default useDraggableScroll;
