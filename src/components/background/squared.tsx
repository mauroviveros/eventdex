export default function SquaredBackground() {
  return (
    <>
      <div className="-z-1 absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(252_87%_67%/0.12),transparent_50%)]" />
      <div className="-z-1 absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(200_80%_60%/0.08),transparent_50%)]" />
      <div className="-z-1 absolute top-1/4 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-primary/5 blur-[120px] max-w-1/2 max-h-3/4" />

      <div
        className="-z-1 absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </>
  );
}
