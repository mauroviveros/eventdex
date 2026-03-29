import { Icon } from "@iconify/react"
import { Button } from "./ui/button"

export const Account = () => {
  return (
    <Button className="rounded-none h-full border-0">
      <Icon icon="pixelarticons:user" className="size-6" />
      <span className="text-lg font-bold">Iniciar sesión</span>
    </Button>
  )
}
