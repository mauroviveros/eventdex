'use client'

import { usePathname } from "next/navigation";
import SignIn from "../account/signin";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export const LoginDialog = ({ open = false }: { open?: boolean }) => {
  const pathname = usePathname();

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-press-start text-xs text-foreground text-center">¡ENCONTRASTE UNA MEDALLA!</DialogTitle>
          <DialogDescription className="text-lg text-center text-muted-foreground mt-2">
            Para reclamar la medalla necesitás iniciar sesión.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 mt-4">
          <SignIn size="lg" variant="outline" next={pathname} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
