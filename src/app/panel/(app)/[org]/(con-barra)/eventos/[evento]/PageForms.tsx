"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, TextareaField } from "@/components/ui/Field";
import { LogoField } from "@/components/ui/LogoField";
import { announce, useFormFeedback } from "@/components/ui/useFormFeedback";
import { COVER_MAX_BYTES } from "@/domain/events";
import {
  addFaqAction,
  addPhotoAction,
  deleteFaqAction,
  deletePhotoAction,
  updateEventLinksAction,
  updateFaqAction,
  updatePhotoCaptionAction,
} from "@/lib/actions/event-page";

type Ids = { org: string; organizationId: string; eventId: string };

function Hidden({ ids }: { ids: Record<string, string> }) {
  return Object.entries(ids).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));
}

type Links = {
  website: string | null;
  instagram: string | null;
  tickets: string | null;
  map: string | null;
};

const LINK_FIELDS = [
  ["tickets", "Entradas", "Dónde se consiguen las entradas."],
  ["website", "Sitio web", "La web del evento o de la organización."],
  ["instagram", "Instagram", "El perfil del evento."],
  ["map", "Mapa", "Un link de Google Maps u otro mapa, para «Cómo llegar»."],
] as const;

/** The event's long description and its links: what "Sobre el evento" and the buttons under the banner show. */
export function PageDataForm({
  ids,
  description,
  links,
}: {
  ids: Pick<Ids, "org" | "eventId">;
  description: string | null;
  links: Links;
}) {
  const [state, action, pending] = useActionState(
    announce(updateEventLinksAction, "Datos de la portada guardados."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <Hidden ids={ids} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <TextareaField
        label="Sobre el evento"
        name="description"
        defaultValue={values.description ?? description ?? ""}
        maxLength={2000}
        hint="Opcional. Contá cómo es el evento. Separá los párrafos con una línea en blanco."
        error={fields.description}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        {LINK_FIELDS.map(([name, label, hint]) => (
          <Field
            key={name}
            label={label}
            name={name}
            type="url"
            inputMode="url"
            maxLength={300}
            placeholder="https://"
            defaultValue={values[name] ?? links[name] ?? ""}
            hint={`Opcional. ${hint}`}
            error={fields[name]}
          />
        ))}
      </div>
      <Button
        type="submit"
        variant="secondary"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
      >
        Guardar
      </Button>
    </form>
  );
}

/** A new question for the event's page. */
export function AddFaqForm({ ids }: { ids: Ids }) {
  const [state, action, pending] = useActionState(
    announce(addFaqAction, "Pregunta agregada."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <Hidden ids={ids} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Pregunta"
        name="question"
        maxLength={160}
        defaultValue={values.question}
        placeholder="¿Hay estacionamiento?"
        error={fields.question}
      />
      <TextareaField
        label="Respuesta"
        name="answer"
        maxLength={600}
        className="[&_textarea]:min-h-24"
        defaultValue={values.answer}
        error={fields.answer}
      />
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Agregando…"
        className="justify-self-start"
      >
        Agregar pregunta
      </Button>
    </form>
  );
}

/** A question already loaded: opens to edit it or remove it. */
export function FaqRow({
  org,
  faq,
}: {
  org: string;
  faq: { id: string; question: string; answer: string };
}) {
  const [state, action, pending] = useActionState(
    announce(updateFaqAction, "Pregunta guardada."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <details className="group border-2 border-lcd-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-lcd-1 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-px-1">{faq.question}</span>
        <span className="shrink-0 font-display text-px-1 group-open:hidden">
          Editar
        </span>
      </summary>
      <div className="grid gap-6 border-t-2 border-lcd-3 px-4 py-5">
        <form ref={form} action={action} className="grid gap-6" noValidate>
          <Hidden ids={{ org, faqId: faq.id }} />
          {failed && !failed.fieldErrors && (
            <FormMessage tone="error">{failed.error}</FormMessage>
          )}
          <Field
            label="Pregunta"
            name="question"
            maxLength={160}
            defaultValue={values.question ?? faq.question}
            error={fields.question}
          />
          <TextareaField
            label="Respuesta"
            name="answer"
            maxLength={600}
            className="[&_textarea]:min-h-24"
            defaultValue={values.answer ?? faq.answer}
            error={fields.answer}
          />
          <Button
            type="submit"
            variant="secondary"
            pending={pending}
            pendingLabel="Guardando…"
            className="justify-self-start"
          >
            Guardar
          </Button>
        </form>
        <ActionButton
          action={deleteFaqAction}
          fields={{ org, faqId: faq.id }}
          label="Quitar pregunta"
          pendingLabel="Quitando…"
          ariaLabel={`Quitar «${faq.question}»`}
          confirm={{
            message: "La pregunta se borra de la portada.",
            label: "Sí, quitar",
          }}
        />
      </div>
    </details>
  );
}

/** Uploads a photo of the gallery, with an optional caption. */
export function AddPhotoForm({ ids, left }: { ids: Ids; left: number }) {
  const [state, action, pending] = useActionState(
    announce(addPhotoAction, "Foto agregada."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <Hidden ids={ids} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <LogoField
        label="Foto"
        maxBytes={COVER_MAX_BYTES}
        hint={`PNG, JPG o WebP, hasta 1,5 MB. ${left === 1 ? "Podés sumar 1 más." : `Podés sumar ${left} más.`}`}
        error={fields.photo}
      />
      <Field
        label="Epígrafe"
        name="caption"
        maxLength={120}
        defaultValue={values.caption}
        hint="Opcional. Una línea que se lee abajo de la foto."
        error={fields.caption}
      />
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Subiendo…"
        className="justify-self-start"
      >
        Subir foto
      </Button>
    </form>
  );
}

/** A photo already loaded: its picture, its caption to change, and a way to remove it. */
export function PhotoRow({
  org,
  photo,
  url,
}: {
  org: string;
  photo: { id: string; caption: string | null };
  url: string;
}) {
  const [state, action, pending] = useActionState(
    announce(updatePhotoCaptionAction, "Epígrafe guardado."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <li className="grid gap-4 border-2 border-lcd-3 p-4 sm:grid-cols-[10rem_1fr]">
      {/* biome-ignore lint/performance/noImgElement: a gallery photo from Storage, shown as uploaded */}
      <img
        src={url}
        alt={photo.caption ?? ""}
        loading="lazy"
        className="aspect-[4/3] w-full border-2 border-lcd-3 object-cover"
      />
      <div className="grid content-start gap-4">
        <form ref={form} action={action} className="grid gap-4" noValidate>
          <Hidden ids={{ org, photoId: photo.id }} />
          {failed && !failed.fieldErrors && (
            <FormMessage tone="error">{failed.error}</FormMessage>
          )}
          <Field
            label="Epígrafe"
            name="caption"
            maxLength={120}
            defaultValue={values.caption ?? photo.caption ?? ""}
            error={fields.caption}
          />
          <Button
            type="submit"
            variant="secondary"
            pending={pending}
            pendingLabel="Guardando…"
            className="justify-self-start"
          >
            Guardar epígrafe
          </Button>
        </form>
        <ActionButton
          action={deletePhotoAction}
          fields={{ org, photoId: photo.id }}
          label="Quitar foto"
          pendingLabel="Quitando…"
          ariaLabel={`Quitar la foto${photo.caption ? ` «${photo.caption}»` : ""}`}
          confirm={{
            message: "La foto se borra de la galería y del almacenamiento.",
            label: "Sí, quitar",
          }}
        />
      </div>
    </li>
  );
}
