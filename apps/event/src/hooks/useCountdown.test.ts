import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./useCountdown";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("descompone el tiempo restante hacia un objetivo futuro", () => {
    const now = Date.UTC(2025, 0, 1);
    vi.setSystemTime(now);
    const target = now + DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND;

    const { result } = renderHook(() => useCountdown(target, now));

    expect(result.current).toMatchObject({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
      isComplete: false,
    });
  });

  it("marca isComplete cuando el objetivo ya pasó", () => {
    const now = Date.UTC(2025, 0, 1);
    vi.setSystemTime(now);

    const { result } = renderHook(() => useCountdown(now - SECOND, now));

    expect(result.current).toMatchObject({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isComplete: true,
    });
  });

  it("decrementa un segundo por cada tick del intervalo", () => {
    const now = Date.UTC(2025, 0, 1);
    vi.setSystemTime(now);

    const { result } = renderHook(() => useCountdown(now + 5 * SECOND, now));
    expect(result.current.seconds).toBe(5);

    act(() => {
      vi.advanceTimersByTime(SECOND);
    });
    expect(result.current.seconds).toBe(4);
  });
});
