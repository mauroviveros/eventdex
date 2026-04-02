"use client"

import { createClient } from "@/libs/supabase/client"
import { Loader } from "@nsmr/pixelart-react"
import type { User } from "@supabase/supabase-js"
import { useEffect, useMemo, useState } from "react"
import { Profile } from "./profile"
import { SignIn } from "./signin"

export const Account = () => {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null

      setUser((previousUser) => {
        if (nextUser === null) return null
        if (previousUser?.id === nextUser.id) return previousUser
        return nextUser
      })
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <article className="h-16 max-w-20 md:max-w-none w-62.5 flex items-center justify-center">
      {user === undefined && <Loader className="size-6 animate-spin text-foreground/50" />}
      {user === null && <SignIn />}
      {user && <Profile user={user} />}
    </article>
  )
}
