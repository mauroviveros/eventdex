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

const getTimeLeft = (targetDate: number): CountdownTime => {
  const diff = targetDate - Date.now()

  if (diff <= 0) return ZERO_TIME

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export const useCountdown = (targetDate: number) => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>(ZERO_TIME)

  useEffect(() => {
    const { days, hours, minutes, seconds } = getTimeLeft(targetDate)
    setTimeLeft({ days, hours, minutes, seconds })

    if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) return

    const interval = setInterval(() => {
      const { days, hours, minutes, seconds } = getTimeLeft(targetDate)
      setTimeLeft({ days, hours, minutes, seconds })
      if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  const isComplete =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0

  return { ...timeLeft, isComplete }
}
