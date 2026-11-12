/**
 * One headline figure of an organization or event, ruled like an LCD cell.
 * On a phone it is a row (label and caption left, figure right) so three of
 * them don't push the screen's content below the fold; from `sm` it stands
 * as a cell, figure under the label.
 */
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
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 border-2 border-lcd-3 px-4 py-3 sm:grid-cols-1 sm:gap-1 sm:p-4">
      <p className="font-display text-px-1 text-muted-foreground">{label}</p>
      <p className="col-start-2 row-span-2 row-start-1 font-display text-px-3 tabular-nums sm:col-start-1 sm:row-span-1 sm:row-start-auto sm:text-px-4">
        {value.toLocaleString("es-AR")}
      </p>
      <p className="text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}
