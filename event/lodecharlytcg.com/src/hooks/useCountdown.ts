import { useEffect, useState } from "react"

type CountdownTime = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const ZERO_TIME: CountdownTime = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
}

const compareTimes = (a: CountdownTime, b: CountdownTime) => {
  return (
    a.days === b.days &&
    a.hours === b.hours &&
    a.minutes === b.minutes &&
    a.seconds === b.seconds
  )
}

const getTimeLeft = (ms: number, now = Date.now()): CountdownTime => {
  const diff = ms - now

  if (diff <= 0) return ZERO_TIME

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export const useCountdown = (ms: number, initial?: number) => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>(() => getTimeLeft(ms, initial))

  useEffect(() => {
    const initialClientTimeLeft = getTimeLeft(ms)
    setTimeLeft((prev) => {
      if (compareTimes(prev, initialClientTimeLeft)) return prev
      return initialClientTimeLeft
    })
    if (compareTimes(initialClientTimeLeft, ZERO_TIME)) return

    const interval = setInterval(() => {
      const currentTimeLeft = getTimeLeft(ms)

      setTimeLeft((prev) => {
        if (compareTimes(prev, currentTimeLeft)) return prev
        return currentTimeLeft
      })

      if (compareTimes(currentTimeLeft, ZERO_TIME)) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [ms])

  const isComplete = compareTimes(timeLeft, ZERO_TIME)
  return { ...timeLeft, isComplete }
}
