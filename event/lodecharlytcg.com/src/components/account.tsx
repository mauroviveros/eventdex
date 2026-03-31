"use client"
import { Button } from "./ui/button"
import { createClient } from "@/libs/supabase/client"
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import { User as UserIcon } from "@nsmr/pixelart-react";

const Profile = ({ user }: { user: User }) => {
  return (
    <Link href="/perfil">
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
    </Link>
  )
}

export const Account = () => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    });
  }, [supabase]);

  const handleClick = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  if(user === undefined) return '';
  return (
    <Button
      className="rounded-none h-full border-0 w-62.5"
      type={user ? "button" : "submit"}
      onClick={user ? undefined : handleClick}
      variant="default"
      asChild={!!user}
    >
      {
        user ? (
          <Profile user={user} />
        ) : (
          <>
            <UserIcon className="size-6" />
            <span className="text-lg font-bold">Iniciar sesión</span>
          </>
        )
      }
    </Button>
  )
}
