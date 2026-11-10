"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Toaster } from "@/components/ui/shadcn/sonner";

/** The admin's success toast, on demand. */
export function ToastDemo() {
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => toast.success("Cambios guardados.")}
      >
        Mostrar aviso
      </Button>
      <Toaster />
    </>
  );
}
