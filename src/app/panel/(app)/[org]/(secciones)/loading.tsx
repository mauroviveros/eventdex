/** Skeleton shaped like a page title and a list. */
export default function Loading() {
  return (
    <div aria-busy className="grid gap-6 px-4 py-8 sm:px-6" role="status">
      <span className="sr-only">Cargando…</span>
      <div className="h-10 w-64 bg-lcd-1" />
      <div className="grid gap-2">
        <div className="h-14 border-2 border-dashed border-lcd-2" />
        <div className="h-14 border-2 border-dashed border-lcd-2" />
        <div className="h-14 border-2 border-dashed border-lcd-2" />
      </div>
    </div>
  );
}
