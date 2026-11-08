/** While the medal is claimed: the celebration's panel, still empty. */
export default function Loading() {
  return (
    <main className="mx-auto grid w-full max-w-3xl justify-items-center px-4 py-10 sm:px-6">
      <div
        role="status"
        aria-busy
        className="panel grid w-full max-w-sm justify-items-center gap-5 px-6 py-8 text-center"
      >
        <div className="size-40 border-2 border-dashed border-lcd-2" />
        <p className="font-display text-px-2">Sumando la medalla…</p>
      </div>
    </main>
  );
}
