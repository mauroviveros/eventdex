"use client"

import { createClient } from "@/libs/supabase/client"
import { GoogleOriginalIcon } from "@devicon/react"
import type { User } from "@supabase/supabase-js"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"

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
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" })
    if (error) console.error("No se pudo iniciar sesion con Google", error);
  }

  if (user === undefined) return null

  return (
    <Button
      className="rounded-none h-full max-w-16 md:max-w-none border-0 w-62.5"
      type="button"
      onClick={!!user ? undefined : () => signInWithGoogle()}
      variant={!!user ? "default" : "outline"}
      asChild={!!user}
    >
      {!!user ? (
        <Link href="/perfil">
          <Profile user={user} />
        </Link>
      ) : (
        <>
          <GoogleOriginalIcon className="text-2xl" />
          <span className="text-xl font-bold hidden md:block">Iniciar sesión</span>
        </>
      )}
    </Button>
  )
}
