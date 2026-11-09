"use client";

import { type ChangeEvent, useState } from "react";
import { Field } from "./Field";

/** An image file input. Too big a file never reaches the action: it's over the Server Action's body limit. */
export function LogoField({
  hint,
  error,
  label = "Logo",
  maxBytes = 1024 * 1024,
}: {
  hint: string;
  error?: string;
  label?: string;
  maxBytes?: number;
}) {
  const [tooBig, setTooBig] = useState(false);
  const megabytes = (maxBytes / 1024 / 1024).toLocaleString("es-AR");

  function check(e: ChangeEvent<HTMLInputElement>) {
    const big = (e.target.files?.[0]?.size ?? 0) > maxBytes;
    setTooBig(big);
    if (big) e.target.value = "";
  }

  return (
    <Field
      label={label}
      name="logo"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={check}
      hint={hint}
      error={
        tooBig
          ? `El ${label.toLowerCase()} puede pesar hasta ${megabytes} MB.`
          : error
      }
    />
  );
}
