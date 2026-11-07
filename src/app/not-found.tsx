import Link from "next/link";
import { Sprite } from "@/components/pixel/Sprite";

/** 404 for every surface: what happened and the way back. */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="panel grid max-w-sm justify-items-center gap-4 px-6 py-8 text-center">
        <Sprite type="attraction" mode="inactivo" label="" />
        <h1 className="text-px-3">Esta página no existe</h1>
        <p>Puede que el link esté mal escrito o que la página ya no esté.</p>
        <Link href="/" className="font-display text-px-1">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
