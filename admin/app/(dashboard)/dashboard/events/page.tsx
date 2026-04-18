import Container from "@/components/container";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export default function DashboardHome() {

  return (
    <Container title="Events">
      <section className="grid gap-4">
        <DataTable columns={columns} data={[
          {
            id: "1",
            name: "Event 1",
            date: "2024-07-01",
            location: "New York"
          }
        ]} />

      </section>
    </Container>
  )
}
