import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { platformMetadata } from "@/lib/data/viewer";
import { env } from "@/lib/env";
import { NewOrganizationForm } from "./NewOrganizationForm";

export function generateMetadata(): Promise<Metadata> {
  return platformMetadata("Nueva organización · Plataforma");
}

export default function NuevaOrganizacionPage() {
  return (
    <>
      <TopBar
        title="Plataforma"
        actions={
          <Link
            href="/plataforma/organizaciones"
            className="flex min-h-11 items-center font-display text-px-1"
          >
            Volver a organizaciones
          </Link>
        }
      />
      <PageBody>
        <div className="grid max-w-xl gap-8">
          <div className="grid gap-2">
            <h1 className="text-px-3 sm:text-px-4">Nueva organización</h1>
            <p>
              Se crea con su dominio y una invitación para el owner, que la
              acepta entrando a{" "}
              <strong>app.{env.NEXT_PUBLIC_ROOT_DOMAIN}</strong> con ese mail.
            </p>
          </div>
          <NewOrganizationForm />
        </div>
      </PageBody>
    </>
  );
}
