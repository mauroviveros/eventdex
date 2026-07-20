import { getEvent } from "@/server/events";
import PageUpcoming from "./_components/status/upcoming";

export default async function Home() {
  const event = await getEvent();
  return <PageUpcoming event={event} />;
}
