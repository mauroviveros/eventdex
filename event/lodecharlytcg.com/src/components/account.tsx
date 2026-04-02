"use client"

import { signInWithGoogle } from "@/app/api/auth/signin/actions"
import { createClient } from "@/libs/supabase/client"
import { GoogleOriginalIcon } from "@devicon/react"
import { Loader } from "@nsmr/pixelart-react"
import type { User } from "@supabase/supabase-js"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
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
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [isSigningIn, startSignInTransition] = useTransition()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser((prev) => {
        if (user === null) return null;
        if (prev?.id === user.id) return prev;
        return user;
      });
    })
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignInWithGoogle = () => {
    startSignInTransition(async () => {
      await signInWithGoogle()
    })
  }

  const isLoading = user === undefined;
  const isActionLoading = !user && isSigningIn;
  const isAuthenticated = !!user;
  return (
    <Button
      className="rounded-none h-full max-w-16 md:max-w-none border-0 w-62.5"
      type="button"
      onClick={!isAuthenticated ? handleSignInWithGoogle : undefined}
      variant={isAuthenticated ? "default" : "outline"}
      asChild={isAuthenticated}
      disabled={isLoading || isActionLoading}
    >
      {isLoading || isActionLoading ? (
        <Loader className="size-6 animate-spin" />
      ) : (
        isAuthenticated ? (
          <Link href="/perfil">
            <Profile user={user} />
          </Link>
        ) : (
          <>
            <GoogleOriginalIcon className="text-2xl" />
            <span className="text-xl font-bold hidden md:block">Iniciar sesión</span>
          </>
        )
      )}
    </Button>
  )
}
