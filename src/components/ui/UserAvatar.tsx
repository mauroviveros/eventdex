"use client";

import { initialsOf } from "@/components/ui/Monogram";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/shadcn/avatar";
import { largeAvatar } from "@/domain/avatar";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-px-1",
  md: "size-10 text-px-2",
  lg: "size-36 text-px-4",
  xl: "size-48 text-px-5",
};

/**
 * A person's photo, or their initials when there is none or it fails to load.
 * Every photo in the app goes through here.
 */
export function UserAvatar({
  name,
  src,
  size = "md",
  className,
  fallbackClassName,
}: {
  /** Whatever names them: the initials come from here. */
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  /** For the ground the initials sit on, when ink on paper is not it. */
  fallbackClassName?: string;
}) {
  return (
    <Avatar aria-hidden className={cn(SIZES[size], className)}>
      {src && (
        <AvatarImage
          // Google serves 96 px by default: ask for a sharp one on the big sizes.
          src={size === "lg" || size === "xl" ? largeAvatar(src) : src}
          alt=""
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback
        className={cn("text-[length:inherit]", fallbackClassName)}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
