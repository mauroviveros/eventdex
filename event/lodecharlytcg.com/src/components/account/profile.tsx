"use client"

import { createClient } from "@/libs/supabase/client"
import { ChevronDown, Logout, User as UserIcon } from "@nsmr/pixelart-react"
import { User } from "@supabase/supabase-js"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

export const Profile = ({ user }: { user: User }) => {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-full rounded-none max-w-full" type="button" variant="default">
          <Image
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name}
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="size-10"
          />

          <div className="hidden md:flex flex-col min-w-0 text-left">
            <span className="text-xl leading-5 font-bold truncate">{user.user_metadata.full_name}</span>
            <span className="text-lg leading-3 opacity-70 truncate">{user.email}</span>
          </div>

          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-none">
        <DropdownMenuItem variant="default" asChild>
          <Link href="/perfil">
            <UserIcon />
            Mi perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <Logout />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
