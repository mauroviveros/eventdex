export default function Brand() {
  return (
    <div className="flex items-center gap-2 p-2">
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground" />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">Lo de Charly</span>
        <span className="truncate text-xs">Eventdex</span>
      </div>
    </div>
  )
}
