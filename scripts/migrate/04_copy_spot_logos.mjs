// R10: copia los logos de los spots del bucket `spot` de la v1 a `spot-logos`. Va
// después de 03_import_v1.sql, y se puede correr de nuevo: lo ya copiado se saltea.
//
//   node --env-file=.env.production.local scripts/migrate/04_copy_spot_logos.mjs
//
// La ruta nueva es {organization_id}/{ruta en la v1}, así que de ahí sale la vieja.
// Las de la v1 traen subcarpeta; las subidas después desde el panel, no.

import { createClient } from "@supabase/supabase-js";

const SLUG = "lodecharlytcg";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: org, error: orgError } = await supabase
  .from("organizations")
  .select("id")
  .eq("slug", SLUG)
  .single();
if (orgError) throw orgError;

const { data: rows, error } = await supabase
  .from("event_spots")
  .select("snapshot")
  .eq("organization_id", org.id);
if (error) throw error;

const fromV1 = (path) => path?.slice(org.id.length + 1).includes("/");
const paths = [
  ...new Set(rows.map((r) => r.snapshot?.logo_path).filter(fromV1)),
];

const report = { copied: 0, already: 0, failed: [] };
for (const path of paths) {
  const source = path.slice(org.id.length + 1);
  const { error: copyError } = await supabase.storage
    .from("spot")
    .copy(source, path, { destinationBucket: "spot-logos" });
  if (!copyError) report.copied += 1;
  else if (/already exists|duplicate/i.test(copyError.message))
    report.already += 1;
  else report.failed.push(`${source}: ${copyError.message}`);
}

console.log(
  `${paths.length} logos · ${report.copied} copiados · ${report.already} ya estaban · ${report.failed.length} con error`,
);
for (const line of report.failed) console.error(line);
if (report.failed.length > 0) process.exit(1);
