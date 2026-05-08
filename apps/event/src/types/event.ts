import type { Tables } from "./database";

export interface Event extends Tables<'events'> {
  location: Tables<'event_locations'>;
  schedules: Tables<'event_schedules'>[];
}
