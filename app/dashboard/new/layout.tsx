import { requireUser } from "@/app/lib/hooks";
import NewEventForm from "./page";

export default async function Layout() {
  const session = await requireUser();
  return (
    <NewEventForm username={(session.user as { username: string }).username} />
  );
}
