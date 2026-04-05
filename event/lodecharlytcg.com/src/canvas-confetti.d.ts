declare module 'canvas-confetti' {
  interface ConfettiOptions {
    angle?: number
    decay?: number
    spread?: number
    startVelocity?: number
    particleCount?: number
    gravity?: number
    ticks?: number
    zIndex?: number
    origin?: {
      x?: number
      y?: number
    }
  }

  function confetti(options?: ConfettiOptions): Promise<void>
  export default confetti
}
