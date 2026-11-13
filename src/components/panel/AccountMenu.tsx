"use client";

import { useRef } from "react";
import { Chevron } from "@/components/pixel/Chevron";
import { initialsOf } from "@/components/ui/Monogram";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/shadcn/sidebar";

export type Account = {
  name: string;
  email: string;
  /** Google's photo, when the account has one. */
  avatarUrl: string | null;
};

/** Who is signed in, at the foot of the sidebar: a menu with their name, mail and Salir. */
export function AccountMenu({ account }: { account: Account }) {
  const { isMobile } = useSidebar();
  // Outside the menu: the menu unmounts on select, and a form inside it would
  // be gone before its submit.
  const signOut = useRef<HTMLFormElement>(null);
  const name = account.name || "Tu cuenta";

  const face = (
    <Avatar>
      {account.avatarUrl && (
        <AvatarImage
          src={account.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
  const who = (className = "") => (
    <span className={`grid min-w-0 flex-1 text-left ${className}`}>
      <span className="truncate font-display text-px-1">{name}</span>
      {account.email && account.email !== name && (
        <span className="truncate font-sans text-sm text-muted-foreground">
          {account.email}
        </span>
      )}
    </span>
  );

  return (
    <>
      <form
        ref={signOut}
        action="/auth/salir?next=/ingresar"
        method="post"
        hidden
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="px-1.5">
            {face}
            {who("group-data-[collapsible=icon]:hidden")}
            <Chevron className="rotate-180 group-data-[collapsible=icon]:hidden" />
            <span className="sr-only">Opciones de la cuenta</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align="end"
          className="w-(--radix-dropdown-menu-trigger-width) min-w-64"
        >
          <DropdownMenuLabel className="flex items-center gap-3 text-foreground">
            {face}
            {who()}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => signOut.current?.requestSubmit()}>
              Salir
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
