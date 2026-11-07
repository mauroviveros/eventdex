import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Términos de uso · Eventdex",
  description: "Las reglas para usar Eventdex.",
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso">
      <p>
        Al usar Eventdex aceptás estos términos. Si no estás de acuerdo, no uses
        la plataforma.
      </p>

      <h2>El servicio</h2>
      <p>
        Eventdex permite a organizaciones de eventos armar un recorrido de
        medallas por QR y hacer sorteos entre quienes participan. Cada evento lo
        organiza y lo publica su organización, que define sus propias reglas y
        premios.
      </p>

      <h2>Tu cuenta</h2>
      <ul>
        <li>Ingresás con tu cuenta de Google y sos responsable de su uso.</li>
        <li>
          Una medalla se consigue escaneando el QR del stand en el evento.
        </li>
        <li>
          La organización puede invalidar participaciones que no cumplan sus
          reglas, por ejemplo medallas conseguidas sin estar en el lugar.
        </li>
      </ul>

      <h2>Sorteos</h2>
      <p>
        Las condiciones, los premios y la entrega de cada sorteo son
        responsabilidad de la organización del evento. Eventdex registra cada
        extracción para que el resultado se pueda verificar.
      </p>

      <h2>Datos personales</h2>
      <p>
        Cómo usamos tus datos está en la página de{" "}
        <Link href="/privacidad">privacidad</Link>.
      </p>

      <h2>Contacto</h2>
      <p>
        Por cualquier consulta, escribinos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
