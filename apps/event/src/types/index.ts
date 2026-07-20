// Re-exporta el paquete de tipos compartido. Mantener `@/types` como punto de
// entrada evita tocar los imports de la app si el paquete cambia de estructura.
export * from "@eventdex/database";
