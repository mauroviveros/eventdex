/** An amount in cents, in the viewer's format: "$ 1.500,50", "US$ 99,00". */
export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(
    cents / 100,
  );
}
