"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";

function download(file: File) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  // Later: Safari drops the download if the URL goes away right after the click.
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Generates the card's image and opens the phone's share sheet, or downloads it. */
export function ShareCardButton({
  href,
  fileName,
}: {
  href: string;
  fileName: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  // Safari refuses to share once generating took too long: a second tap has to do it.
  const [retry, setRetry] = useState(false);

  async function generate() {
    const response = await fetch(href);
    if (!response.ok || response.headers.get("content-type") !== "image/png") {
      throw new Error(`Card image: ${response.status}`);
    }
    return new File([await response.blob()], fileName, { type: "image/png" });
  }

  async function share() {
    setFailed(false);
    setRetry(false);
    setPending(true);
    try {
      const image = file ?? (await generate());
      setFile(image);
      if (navigator.canShare?.({ files: [image] })) {
        await navigator.share({ files: [image] });
      } else {
        download(image);
      }
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError") setRetry(true);
      // AbortError: the visitor closed the share sheet.
      else if (name !== "AbortError") setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid justify-items-start gap-3">
      <Button
        onClick={share}
        pending={pending}
        pendingLabel="Armando tu tarjeta…"
      >
        {retry ? "Compartir ahora" : "Compartir mi tarjeta"}
      </Button>
      <p role="status" className="sr-only">
        {pending && "Armando tu tarjeta."}
        {retry && "Tu tarjeta está lista. Tocá Compartir ahora."}
      </p>
      {failed && (
        <FormMessage tone="error">
          No pudimos armar tu tarjeta. Probá de nuevo.
        </FormMessage>
      )}
    </div>
  );
}
