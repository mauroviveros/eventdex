"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/shadcn/chart";
import type { HourCount } from "@/domain/overview";

const config = {
  newcomers: { label: "Primeras medallas", color: "var(--lcd-2)" },
  returning: { label: "De quienes ya tenían", color: "var(--lcd-3)" },
  medals: { label: "Medallas", color: "var(--lcd-3)" },
} satisfies ChartConfig;

type Props = {
  hours: readonly HourCount[];
  timeZone: string;
  /** The current hour (ISO): marked «Ahora» when it falls in this schedule. */
  now?: string;
  /** Stacked bars, or stepped medals with the first medals as a second step line. */
  look?: "barras" | "escalones";
  /** Read aloud instead of the drawing, which a screen reader cannot. */
  label: string;
};

/**
 * Medals per hour of one schedule, square and still: no radius, no animation,
 * the four tones only. Each bar stacks the first medals (visitors arriving) under
 * the rest. A table with the same figures sits under it for screen readers.
 */
export function HourlyChart({
  hours,
  timeZone,
  now,
  look = "barras",
  label,
}: Props) {
  const hourOf = new Intl.DateTimeFormat("es-AR", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  });
  const labelOf = (iso: string) => `${hourOf.format(new Date(iso))} h`;
  const data = hours.map((h) => ({
    label: labelOf(h.hour),
    medals: h.medals,
    newcomers: h.newcomers,
    returning: h.medals - h.newcomers,
  }));
  const current =
    now && hours.some((h) => Date.parse(h.hour) === Date.parse(now))
      ? labelOf(now)
      : null;

  return (
    <figure className="grid gap-2">
      <ChartContainer
        config={config}
        className="aspect-auto h-56 w-full sm:h-64"
        aria-hidden
      >
        {look === "barras" ? (
          <BarChart data={data} barCategoryGap={4}>
            <CartesianGrid vertical={false} strokeWidth={2} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--lcd-3)", strokeWidth: 2 }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <ChartTooltip cursor content={<ChartTooltipContent />} />
            <Bar
              dataKey="newcomers"
              stackId="h"
              fill="var(--color-newcomers)"
              isAnimationActive={false}
            />
            <Bar
              dataKey="returning"
              stackId="h"
              fill="var(--color-returning)"
              isAnimationActive={false}
            />
            {current && (
              <ReferenceLine
                x={current}
                stroke="var(--lcd-3)"
                strokeWidth={2}
                label={{
                  value: "Ahora",
                  position: "insideTopRight",
                  fill: "var(--lcd-3)",
                }}
              />
            )}
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <CartesianGrid vertical={false} strokeWidth={2} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--lcd-3)", strokeWidth: 2 }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <ChartTooltip cursor content={<ChartTooltipContent />} />
            <Area
              dataKey="medals"
              type="step"
              stroke="var(--color-medals)"
              strokeWidth={2}
              fill="var(--lcd-1)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            <Area
              dataKey="newcomers"
              type="step"
              stroke="var(--color-newcomers)"
              strokeWidth={2}
              fill="none"
              isAnimationActive={false}
            />
            {current && (
              <ReferenceLine
                x={current}
                stroke="var(--lcd-3)"
                strokeWidth={2}
                label={{
                  value: "Ahora",
                  position: "insideTopRight",
                  fill: "var(--lcd-3)",
                }}
              />
            )}
          </AreaChart>
        )}
      </ChartContainer>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Hora</th>
            <th scope="col">Medallas</th>
            <th scope="col">Primeras medallas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">
                {d.label}
                {d.label === current && " (ahora)"}
              </th>
              <td>{d.medals}</td>
              <td>{d.newcomers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
