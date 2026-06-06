'use client'

import { useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// Internal helpers — all sound generation lives outside the hook so that
// the function identities are stable across renders (no extra deps needed).
// ---------------------------------------------------------------------------

/** Lazily create (or resume) an AudioContext. Returns `null` when not in a browser. */
function getOrCreateContext(ctxRef: React.MutableRefObject<AudioContext | null>): AudioContext | null {
  if (typeof window === 'undefined') return null

  let ctx = ctxRef.current
  if (!ctx) {
    ctx = new AudioContext()
    ctxRef.current = ctx
  }

  // Browsers suspend the context until a user gesture has occurred.
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  return ctx
}

/** Play a tone and return early if sound is disabled. */
function tone(
  ctx: AudioContext,
  frequency: number,
  opts: {
    type?: OscillatorType
    duration: number
    maxGain?: number
    startDelay?: number
    frequencyEnd?: number
  },
) {
  const {
    type = 'sine',
    duration,
    maxGain = 0.1,
    startDelay = 0,
    frequencyEnd,
  } = opts

  const now = ctx.currentTime + startDelay

  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, now)

  // Optional frequency sweep (e.g. boot sound)
  if (frequencyEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(frequencyEnd, now + duration)
  }

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(maxGain, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + duration + 0.05) // small buffer so exponentialRamp completes

  // Clean up refs to avoid memory leaks
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSoundEffects(store: { enabled: boolean; toggle: () => void }) {
  const { enabled, toggle } = store
  const ctxRef = useRef<AudioContext | null>(null)

  // -----------------------------------------------------------------------
  // playNotification — short, pleasant high-pitched "ping"
  // 800 Hz sine, 80 ms exponential decay
  // -----------------------------------------------------------------------
  const playNotification = useCallback(() => {
    try {
      if (!enabled) return
      const ctx = getOrCreateContext(ctxRef)
      if (!ctx) return
      tone(ctx, 800, { duration: 0.08, maxGain: 0.1 })
    } catch {
      // Never throw
    }
  }, [enabled])

  // -----------------------------------------------------------------------
  // playAlert — urgent two-tone warning
  // 400 Hz → 600 Hz, 150 ms each (total ≈ 300 ms)
  // -----------------------------------------------------------------------
  const playAlert = useCallback(() => {
    try {
      if (!enabled) return
      const ctx = getOrCreateContext(ctxRef)
      if (!ctx) return
      tone(ctx, 400, { type: 'square', duration: 0.15, maxGain: 0.08 })
      tone(ctx, 600, { type: 'square', duration: 0.15, maxGain: 0.08, startDelay: 0.16 })
    } catch {
      // Never throw
    }
  }, [enabled])

  // -----------------------------------------------------------------------
  // playSuccess — positive ascending three-note chime
  // 600 → 800 → 1000 Hz sine, 200 ms each
  // -----------------------------------------------------------------------
  const playSuccess = useCallback(() => {
    try {
      if (!enabled) return
      const ctx = getOrCreateContext(ctxRef)
      if (!ctx) return
      tone(ctx, 600, { duration: 0.2, maxGain: 0.1 })
      tone(ctx, 800, { duration: 0.2, maxGain: 0.1, startDelay: 0.15 })
      tone(ctx, 1000, { duration: 0.25, maxGain: 0.1, startDelay: 0.3 })
    } catch {
      // Never throw
    }
  }, [enabled])

  // -----------------------------------------------------------------------
  // playBoot — low system startup sweep
  // 200 Hz → 400 Hz sine, 300 ms
  // -----------------------------------------------------------------------
  const playBoot = useCallback(() => {
    try {
      if (!enabled) return
      const ctx = getOrCreateContext(ctxRef)
      if (!ctx) return
      tone(ctx, 200, { duration: 0.3, maxGain: 0.12, frequencyEnd: 400 })
    } catch {
      // Never throw
    }
  }, [enabled])

  // -----------------------------------------------------------------------
  // playClick — subtle UI click
  // 1200 Hz sine, 30 ms
  // -----------------------------------------------------------------------
  const playClick = useCallback(() => {
    try {
      if (!enabled) return
      const ctx = getOrCreateContext(ctxRef)
      if (!ctx) return
      tone(ctx, 1200, { duration: 0.03, maxGain: 0.08 })
    } catch {
      // Never throw
    }
  }, [enabled])

  return { playNotification, playAlert, playSuccess, playBoot, playClick }
}
