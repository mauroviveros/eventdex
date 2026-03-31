"use client"

import { Button } from "./ui/button"
import { createClient } from "@/libs/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { User as UserIcon } from "@nsmr/pixelart-react"

const Profile = ({ user }: { user: User }) => (
  <>
    <Image
      src={user.user_metadata.avatar_url}
      alt={user.user_metadata.full_name}
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
      className="size-10"
    />

    <div className="hidden md:flex flex-col min-w-0">
      <span className="text-xl leading-5 font-bold truncate">{user.user_metadata.full_name}</span>
      <span className="text-lg leading-3 opacity-70 truncate">{user.email}</span>
    </div>
  </>
)

export const Account = () => {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  if (!supabaseRef.current) supabaseRef.current = createClient()
  const supabase = supabaseRef.current
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    let mounted = true

    const syncUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(data.user)
    }

    void syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleClick = useCallback(async () => {
    if (user) return
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" })
    if (error) console.error("No se pudo iniciar sesion con Google", error)
  }, [supabase, user])

  if (user === undefined) return null

  return (
    <Button
      className="rounded-none h-full border-0 w-62.5"
      type="button"
      onClick={!!user ? undefined : () => void handleClick()}
      variant="default"
      asChild={!!user}
    >
      {!!user ? (
        <Link href="/perfil">
          <Profile user={user} />
        </Link>
      ) : (
        <>
          <UserIcon className="size-6" />
          <span className="text-lg font-bold">Iniciar sesión</span>
        </>
      )}
    </Button>
  )
}
