// Copia los logos de Burning Tower Fest a la carpeta de su org, dentro de `spot-logos`.
// Va después de 05_split_burning_tower.sql, y se puede correr de nuevo: lo ya copiado
// se saltea. Los originales quedan, para poder volver atrás.
//
//   node --env-file=.env.production.local scripts/migrate/06_copy_burning_tower_logos.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const orgId = async (slug) => {
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data.id;
};
const from = await orgId("lodecharlytcg");
const to = await orgId("burning-tower-fest");

const [eventSpots, spots] = await Promise.all([
  supabase.from("event_spots").select("snapshot").eq("organization_id", to),
  supabase.from("spots").select("logo_path").eq("organization_id", to),
]);
if (eventSpots.error) throw eventSpots.error;
if (spots.error) throw spots.error;

const paths = [
  ...new Set(
    [
      ...eventSpots.data.map((r) => r.snapshot?.logo_path),
      ...spots.data.map((r) => r.logo_path),
    ].filter(Boolean),
  ),
];

const report = { copied: 0, already: 0, failed: [] };
for (const path of paths) {
  const source = from + path.slice(to.length);
  const { error } = await supabase.storage
    .from("spot-logos")
    .copy(source, path);
  if (!error) report.copied += 1;
  else if (/already exists|duplicate/i.test(error.message)) report.already += 1;
  else report.failed.push(`${source}: ${error.message}`);
}

console.log(
  `${paths.length} logos · ${report.copied} copiados · ${report.already} ya estaban · ${report.failed.length} con error`,
);
for (const line of report.failed) console.error(line);
if (report.failed.length > 0) process.exit(1);
