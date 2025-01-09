import { requireUser } from "@/app/lib/hooks";
import { NewEventForm } from "./NewEventFormWrapper";

export default async function Layout() {
  const session = await requireUser();
  if (!session.user) return null;

  const username = (session.user as { username: string }).username;
  return <NewEventForm username={username} />;
}
