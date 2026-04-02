"use client"

import { signInWithGoogle } from "@/app/api/auth/signin/actions"
import { GoogleOriginalIcon } from "@devicon/react"
import { useTransition } from "react"
import { Button } from "../ui/button"

export const SignIn = () => {
  const [isSigningIn, startSignInTransition] = useTransition()

  const handleSignInWithGoogle = () => {
    startSignInTransition(async () => {
      await signInWithGoogle()
    })
  }

  return (
    <Button
      type="button"
      className="h-full rounded-none border-y-0 max-w-full w-full gap-0"
      onClick={handleSignInWithGoogle}
      variant="outline"
      disabled={isSigningIn}
    >
      <GoogleOriginalIcon className="text-2xl" />
      <span className="text-xl font-bold hidden md:block">Iniciar sesión</span>
    </Button>
  )
}
