"use client";

import { type ChangeEvent, useState } from "react";
import { Field } from "./Field";

const MAX_BYTES = 1024 * 1024;

/** A logo file input. Too big a file never reaches the action: it's over the Server Action's body limit. */
export function LogoField({ hint, error }: { hint: string; error?: string }) {
  const [tooBig, setTooBig] = useState(false);

  function check(e: ChangeEvent<HTMLInputElement>) {
    const big = (e.target.files?.[0]?.size ?? 0) > MAX_BYTES;
    setTooBig(big);
    if (big) e.target.value = "";
  }

  return (
    <Field
      label="Logo"
      name="logo"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={check}
      hint={hint}
      error={tooBig ? "El logo puede pesar hasta 1 MB." : error}
    />
  );
}
