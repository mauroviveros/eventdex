"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
}

export const columns: ColumnDef<Event>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'date',
    header: 'Date'
  },
  {
    accessorKey: 'location',
    header: 'Location'
  }
]
