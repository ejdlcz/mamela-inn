import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInactivityLogout } from './useInactivityLogout';

const minutes = (n: number) => n * 60_000;

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useInactivityLogout', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    setVisibility('visible');
    vi.useRealTimers();
  });

  const mount = (over: { active?: boolean; background?: number } = {}) => {
    const onTimeout = vi.fn();
    renderHook(() =>
      useInactivityLogout({
        active: over.active ?? true,
        inactivityMinutes: 30,
        backgroundMinutes: over.background ?? 5,
        onTimeout,
      }),
    );
    return onTimeout;
  };

  it('signs out after 30 minutes without activity', () => {
    const onTimeout = mount();
    vi.advanceTimersByTime(minutes(29));
    expect(onTimeout).not.toHaveBeenCalled();
    vi.advanceTimersByTime(minutes(2));
    expect(onTimeout).toHaveBeenCalledWith('inactive');
  });

  it('restarts the countdown on any touch, click or key press', () => {
    const onTimeout = mount();
    vi.advanceTimersByTime(minutes(25));
    window.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(minutes(25));
    expect(onTimeout).not.toHaveBeenCalled();
    vi.advanceTimersByTime(minutes(6));
    expect(onTimeout).toHaveBeenCalledWith('inactive');
  });

  it('does nothing while nobody is signed in', () => {
    const onTimeout = mount({ active: false });
    vi.advanceTimersByTime(minutes(120));
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('signs out when the app comes back after sitting in the background', () => {
    const onTimeout = mount();
    setVisibility('hidden');
    vi.advanceTimersByTime(minutes(6));
    setVisibility('visible');
    expect(onTimeout).toHaveBeenCalledWith('background');
  });

  it('keeps the session after a short trip to another app', () => {
    const onTimeout = mount();
    setVisibility('hidden');
    vi.advanceTimersByTime(minutes(2));
    setVisibility('visible');
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
