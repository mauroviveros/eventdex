/** One headline figure of an organization or event, ruled like an LCD cell. */
export function StatTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="grid gap-1 border-2 border-lcd-3 p-4">
      <p className="font-display text-px-1 text-muted-foreground">{label}</p>
      <p className="font-display text-px-4 tabular-nums">
        {value.toLocaleString("es-AR")}
      </p>
      <p className="text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}
