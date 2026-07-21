import { required } from "./env";

/**
 * Config server-only: secretos del deployment.
 *
 * NO importar desde componentes cliente. Estas variables no llevan el prefijo
 * `NEXT_PUBLIC_`, así que en el navegador serían `undefined` (Next no las inyecta).
 * A diferencia de apps/event, acá no hay `EVENTDEX_EVENT_ID`: el scope del admin
 * es la organización del usuario, derivada de su membresía.
 */
export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
};
