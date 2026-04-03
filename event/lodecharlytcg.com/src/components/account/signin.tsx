"use client"

import { signInWithGoogle } from "@/app/api/auth/signin/actions"
import { GoogleOriginalIcon } from "@devicon/react"
import { Loader } from "@nsmr/pixelart-react"
import { useTransition } from "react"
import { Button } from "../ui/button"

export default function SignIn() {
  const [isSigningIn, startSignInTransition] = useTransition()

  const handleSignInWithGoogle = () => {
    startSignInTransition(async () => {
      await signInWithGoogle()
    })
  }

  return (
    <Button
      type="button"
      className="relative h-full rounded-none border-y-0 max-w-full w-full"
      onClick={handleSignInWithGoogle}
      variant="outline"
      disabled={isSigningIn}
    >
      <GoogleOriginalIcon className="text-2xl" />
      <span className="text-xl font-bold hidden md:block">Iniciar sesión</span>

      {isSigningIn && <Loader className="size-6 animate-spin absolute" />}
    </Button>
  )
}
