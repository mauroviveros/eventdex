"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { PixelIcon } from "@/components/pixel/icons";

// shadcn/ui sonner, without next-themes: the toast takes the LCD tokens, which
// already follow the scheme. An inverted cell at the bottom, square, no
// shadow, with the pixel check. Sonner announces each toast in a polite live region.

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      icons={{ success: <PixelIcon name="check" /> }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 border-2 border-primary bg-primary px-4 py-3 text-primary-foreground",
          title: "font-display text-px-1",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
