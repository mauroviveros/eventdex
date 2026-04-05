"use client"

import { signInWithGoogle } from "@/app/api/auth/signin/actions"
import { GoogleOriginalIcon } from "@devicon/react"
import { Loader } from "@nsmr/pixelart-react"
import { VariantProps } from "class-variance-authority"
import { useTransition } from "react"
import { Button, buttonVariants } from "../ui/button"

type Props = { next?: string } & React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>
export default function SignIn({ variant, size, className, next }: Props) {
  const [isSigningIn, startSignInTransition] = useTransition()

  const handleSignInWithGoogle = () => {
    startSignInTransition(async () => {
      await signInWithGoogle(next)
    })
  }

  return (
    <Button
      type="button"
      className={className}
      size={size}
      onClick={handleSignInWithGoogle}
      variant={variant}
      disabled={isSigningIn}
    >
      <GoogleOriginalIcon className="text-2xl" />
      <span className="text-xl font-bold">Iniciar sesión</span>

      {isSigningIn && <Loader className="size-6 animate-spin absolute" />}
    </Button>
  )
}
