import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** The local stack's secret key: from .env.local, else from `supabase status`. */
function secretKey() {
  if (process.env.SUPABASE_SECRET_KEY) return process.env.SUPABASE_SECRET_KEY;
  const status = execSync("pnpm exec supabase status -o env", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const key = status.match(/^SECRET_KEY="?([^"\n]+)"?$/m)?.[1];
  if (!key)
    throw new Error("No local Supabase secret key: is `pnpm db:start` up?");
  return key;
}

const options = { auth: { persistSession: false } };

/** The data of a Supabase response, or its error thrown. */
function must<T>({ data, error }: { data: T; error: unknown }) {
  if (error) throw error;
  // Without an error, a read with .select() has its rows; plain writes return null and nobody reads it.
  return data as NonNullable<T>;
}

// Like the ids imported from the v1, from md5(...)::uuid: not RFC 4122.
const importedId = () => crypto.randomUUID().replace(/^(.{14})./, "$1c");

/**
 * An org of its own on a fresh host, with a live published event and two
 * spots, and its owner. Published by the owner through publish_event(), the
 * real path, so the spots carry their snapshot. `cleanup` removes it all.
 */
export async function seedLiveEvent() {
  if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
    throw new Error("The e2e seed only runs against local Supabase");
  }
  const admin = createClient<Database>(url, secretKey(), options);
  const id = Date.now().toString(36);
  const host = `e2e-${id}.localhost:3000`;
  const ownerEmail = `owner-${id}@e2e.local`;
  const visitorEmail = `visitante-${id}@e2e.local`;
  const password = `e2e-${id}-pass`;

  const created = await admin.auth.admin.createUser({
    email: ownerEmail,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  const owner = created.data.user;
  const org = must(
    await admin
      .from("organizations")
      .insert({ slug: `e2e-${id}`, name: `Feria E2E ${id}` })
      .select("id, slug, name")
      .single(),
  );
  must(
    await admin
      .from("organization_domains")
      .insert({ organization_id: org.id, hostname: host, is_primary: true }),
  );
  must(
    await admin
      .from("organization_members")
      .insert({ organization_id: org.id, user_id: owner.id, role: "owner" }),
  );
  const event = must(
    await admin
      .from("events")
      .insert({ organization_id: org.id, slug: "feria", title: "Feria E2E" })
      .select("id, slug")
      .single(),
  );
  const hour = 3_600_000;
  must(
    await admin.from("event_schedules").insert({
      event_id: event.id,
      organization_id: org.id,
      starts_at: new Date(Date.now() - hour).toISOString(),
      ends_at: new Date(Date.now() + 6 * hour).toISOString(),
    }),
  );
  const spots = must(
    await admin
      .from("spots")
      .insert([
        {
          id: importedId(),
          organization_id: org.id,
          name: "Café de la Esquina",
          type: "stand",
        },
        {
          id: importedId(),
          organization_id: org.id,
          name: "Rueda gigante",
          type: "attraction",
        },
      ])
      .select("id"),
  );
  const eventSpots = must(
    await admin
      .from("event_spots")
      .insert(
        spots.map((s, i) => ({
          event_id: event.id,
          organization_id: org.id,
          spot_id: s.id,
          code: `A0${i + 1}`,
          sort_order: i,
        })),
      )
      .select("id, code, sort_order")
      .order("sort_order"),
  );

  const asOwner = createClient<Database>(url, publishable, options);
  const signIn = await asOwner.auth.signInWithPassword({
    email: ownerEmail,
    password,
  });
  if (signIn.error) throw signIn.error;
  must(await asOwner.rpc("publish_event", { p_event_id: event.id }));

  return {
    host,
    origin: `http://${host}`,
    org,
    event,
    spots: eventSpots,
    catalog: spots,
    ownerEmail,
    visitorEmail,
    /** A finished event where the visitor already collected, as the v1 import leaves it. */
    async addPastCollection() {
      const profile = must(
        await admin
          .from("profiles")
          .select("id")
          .eq("email", visitorEmail)
          .single(),
      );
      const past = must(
        await admin
          .from("events")
          .insert({
            organization_id: org.id,
            slug: "feria-vieja",
            title: "Feria E2E",
            edition_label: "Abril",
            status: "published",
            published_at: new Date().toISOString(),
          })
          .select("id, slug")
          .single(),
      );
      must(
        await admin.from("event_schedules").insert({
          event_id: past.id,
          organization_id: org.id,
          starts_at: new Date(Date.now() - 48 * hour).toISOString(),
          ends_at: new Date(Date.now() - 40 * hour).toISOString(),
        }),
      );
      const spot = must(
        await admin
          .from("spots")
          .insert({ organization_id: org.id, name: "Stand viejo" })
          .select("id")
          .single(),
      );
      const eventSpot = must(
        await admin
          .from("event_spots")
          .insert({
            event_id: past.id,
            organization_id: org.id,
            spot_id: spot.id,
            code: "V01",
          })
          .select("id")
          .single(),
      );
      const registration = must(
        await admin
          .from("event_registrations")
          .insert({
            event_id: past.id,
            organization_id: org.id,
            user_id: profile.id,
            created_at: new Date(Date.now() - 44 * hour).toISOString(),
          })
          .select("id")
          .single(),
      );
      must(
        await admin.from("spot_claims").insert({
          event_spot_id: eventSpot.id,
          registration_id: registration.id,
          event_id: past.id,
          organization_id: org.id,
          user_id: profile.id,
        }),
      );
    },
    async cleanup() {
      // Medals restrict deleting their spots: they go first.
      await admin.from("spot_claims").delete().eq("organization_id", org.id);
      await admin
        .from("event_registrations")
        .delete()
        .eq("organization_id", org.id);
      // Invoices restrict deleting their org, on purpose.
      await admin.from("invoices").delete().eq("organization_id", org.id);
      await admin.from("organizations").delete().eq("id", org.id);
      const { data } = await admin
        .from("profiles")
        .select("id")
        .in("email", [ownerEmail, visitorEmail]);
      for (const p of data ?? []) await admin.auth.admin.deleteUser(p.id);
    },
  };
}

/** A platform developer of their own. `cleanup` removes the account. */
export async function seedDeveloper() {
  const admin = createClient<Database>(url, secretKey(), options);
  const id = Date.now().toString(36);
  const email = `dev-${id}@e2e.local`;
  const created = await admin.auth.admin.createUser({
    email,
    password: `e2e-${id}-pass`,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  const userId = created.data.user.id;
  must(await admin.from("platform_admins").insert({ user_id: userId }));
  return {
    email,
    async cleanup() {
      await admin.auth.admin.deleteUser(userId);
    },
  };
}
