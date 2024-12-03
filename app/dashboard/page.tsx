import { requireUser } from "../lib/hooks";
import prisma from "../lib/db";
import { notFound } from "next/navigation";
import { EmptyState } from "../components/EmptyState";

async function getData(userId: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      eventTypes: {
        select: {
          title: true,
          duration: true,
          url: true,
          description: true,
          active: true,
          videoCallSoftware: true,
        }
      }
    }
  });
  if(!data) {
    return notFound();
  }
  return data;
}


export default async function DashboardPage() {
    const session = await requireUser();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = await getData(session.user?.id as string);

  return(
    <>
    {data.eventTypes.length === 0 ? (
      <EmptyState title="No event types found" description="Get started by creating a new event type" buttonText="Create Event Type" href="/dashboard/event-types/new" />
    ) : (
      <div>
        <h1>We have event types</h1>
      </div>
    )}
    </>
  )
}
