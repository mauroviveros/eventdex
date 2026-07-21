"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DaySelect({
  eventId,
  days,
  selectedDay,
}: {
  eventId: string;
  days: { day: string; label: string }[];
  selectedDay: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={selectedDay}
      onValueChange={(day) =>
        router.push(`/analytics?event=${eventId}&day=${day}`)
      }
    >
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {days.map(({ day, label }) => (
          <SelectItem key={day} value={day}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
