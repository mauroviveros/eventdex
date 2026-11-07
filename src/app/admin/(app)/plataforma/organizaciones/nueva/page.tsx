import type { Metadata } from "next";
import Link from "next/link";
import { platformMetadata } from "@/lib/data/viewer";
import { env } from "@/lib/env";
import { NewOrganizationForm } from "./NewOrganizationForm";

export function generateMetadata(): Promise<Metadata> {
  return platformMetadata("Nueva organización · Plataforma");
}

export default function NuevaOrganizacionPage() {
  return (
    <div className="grid max-w-xl gap-8">
      <div className="grid gap-2">
        <Link
          href="/plataforma/organizaciones"
          className="justify-self-start font-display text-px-1"
        >
          Volver a organizaciones
        </Link>
        <h1 className="text-px-3 sm:text-px-4">Nueva organización</h1>
        <p>
          Se crea con su dominio y una invitación para el owner, que la acepta
          entrando a <strong>app.{env.NEXT_PUBLIC_ROOT_DOMAIN}</strong> con ese
          mail.
        </p>
      </div>
      <NewOrganizationForm />
    </div>
  );
}
