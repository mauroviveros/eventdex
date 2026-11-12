import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "../legal";

export const metadata: Metadata = {
  title: "Privacidad · Eventdex",
  description:
    "Qué datos usa Eventdex, para qué y cómo pedir que los borremos.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Privacidad">
      <p>
        Eventdex es la plataforma con la que organizaciones de eventos arman un
        recorrido de medallas: escaneás el QR de cada stand y juntás medallas.
        Acá contamos qué datos usamos y para qué.
      </p>

      <h2>Qué datos usamos</h2>
      <ul>
        <li>
          <strong>Tu cuenta:</strong> nombre, mail y foto de perfil, que nos
          pasa Google cuando ingresás.
        </li>
        <li>
          <strong>Tu participación:</strong> a qué eventos te registraste, qué
          medallas conseguiste y cuándo, y si ganaste un sorteo.
        </li>
        <li>
          <strong>Si sos parte de una organización:</strong> tu rol y las
          acciones que hacés en el panel, que quedan registradas.
        </li>
      </ul>

      <h2>Para qué</h2>
      <ul>
        <li>Para que puedas juntar medallas y participar de los sorteos.</li>
        <li>
          Para que la organización del evento vea quién participó y pueda hacer
          el sorteo.
        </li>
        <li>Para mantener la plataforma segura y resolver problemas.</li>
      </ul>
      <p>No vendemos tus datos ni los usamos para publicidad.</p>

      <h2>Quién los ve</h2>
      <p>
        La organización del evento ve tu nombre, tu mail y tus medallas de sus
        eventos; no ve tu actividad en eventos de otras organizaciones. Los
        datos se guardan en Supabase, nuestro proveedor de base de datos.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedirnos ver, corregir o borrar tus datos escribiendo a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
