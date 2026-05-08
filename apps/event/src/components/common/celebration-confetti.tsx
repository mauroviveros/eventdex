'use client'

import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface CelebrationConfettiProps {
  /** Whether to trigger celebration when component mounts */
  trigger?: boolean
}

export function CelebrationConfetti({ trigger = true }: CelebrationConfettiProps) {
  useEffect(() => {
    if (!trigger) return

    // Slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      launchCelebration()
    }, 300)

    return () => clearTimeout(timer)
  }, [trigger])

  return null
}

function launchCelebration() {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
  }

  // Confetti burst 1 - Center
  confetti({
    ...defaults,
    particleCount: 80,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
  })

  // Confetti burst 2 - Left side
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
    })
  }, 100)

  // Confetti burst 3 - Right side
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
    })
  }, 200)

  // Confetti burst 4 - Top center
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 100,
      spread: 360,
      origin: { x: 0.5, y: 0 },
    })
  }, 300)

  // Rain-like confetti - slow descending
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 150,
      spread: 360,
      startVelocity: 15,
      decay: 0.95,
      gravity: 0.8,
      origin: { x: 0.5, y: 0 },
    })
  }, 500)

  // Final burst - fireworks style
  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 120,
          spread: 360,
          origin: { x: 0.5, y: 0.5 },
          startVelocity: 40 + i * 5,
        })
      }, i * 150)
    }
  }, 1000)
}
