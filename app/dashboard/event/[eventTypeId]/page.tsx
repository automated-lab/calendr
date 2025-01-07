import { EditEventTypeForm } from "@/app/components/EditEventTypeForm";
import prisma from "@/app/lib/db";

async function getData(eventTypeId: string) {
  const data = await prisma.eventType.findUnique({
    where: {
      id: eventTypeId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      videoCallSoftware: true,
      url: true,
    },
  });

  if (!data) {
    throw new Error("Event type not found");
  }

  return data;
}

export default async function EventTypePage({
  params,
}: {
  params: Promise<{ eventTypeId: string }>;
}) {
  const resolvedParams = await params;
  const data = await getData(resolvedParams.eventTypeId);
  return (
    <EditEventTypeForm
      id={data.id}
      callProvider={data.videoCallSoftware}
      description={data.description}
      duration={data.duration}
      title={data.title}
      url={data.url}
      videoCallSoftware={data.videoCallSoftware}
    />
  );
}
