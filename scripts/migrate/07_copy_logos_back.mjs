// Copia los archivos de la carpeta de Burning Tower Fest a la de Lo de Charly TCG, en
// `spot-logos` y `event-covers`. Va ANTES de 08_merge_burning_tower.sql, así las rutas
// que reescribe ya tienen su archivo. Se puede correr de nuevo: lo ya copiado se
// saltea. Los originales quedan, para poder volver atrás.
//
//   node --env-file=.env.production.local scripts/migrate/07_copy_logos_back.mjs

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
  if (error) throw new Error(`No encuentro la org ${slug}: ${error.message}`);
  return data.id;
};
const from = await orgId("burning-tower-fest");
const to = await orgId("lodecharlytcg");

/** Every object under a folder, walking subfolders (list() returns one level). */
const listAll = async (bucket, prefix) => {
  const paths = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const item of data) {
      const path = `${prefix}/${item.name}`;
      // Folders come back without an id.
      if (item.id) paths.push(path);
      else paths.push(...(await listAll(bucket, path)));
    }
    if (data.length < 1000) return paths;
  }
};

const report = { copied: 0, already: 0, failed: [] };
for (const bucket of ["spot-logos", "event-covers"]) {
  for (const source of await listAll(bucket, from)) {
    const target = to + source.slice(from.length);
    const { error } = await supabase.storage.from(bucket).copy(source, target);
    if (!error) report.copied += 1;
    else if (/already exists|duplicate/i.test(error.message))
      report.already += 1;
    else report.failed.push(`${bucket}/${source}: ${error.message}`);
  }
}

console.log(
  `${report.copied} copiados · ${report.already} ya estaban · ${report.failed.length} con error`,
);
for (const line of report.failed) console.error(line);
if (report.failed.length > 0) process.exit(1);
