"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EventSelect({
  events,
  selectedId,
}: {
  events: { id: string; title: string; edition: string | null }[];
  selectedId: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={selectedId}
      onValueChange={(id) => router.push(`/analytics?event=${id}`)}
    >
      <SelectTrigger size="sm" className="min-w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id}>
            {event.title}
            {event.edition ? ` · ${event.edition}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
