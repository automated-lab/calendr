import { requireUser } from "@/app/lib/hooks";
import prisma from "@/app/lib/db";
import AvailabilityForm from "./AvailabilityForm";
import { Availability } from "@prisma/client";

type AvailabilityWithStringDates = Omit<Availability, 'fromTime' | 'toTime'> & {
  fromTime: string;
  toTime: string;
};

async function getData(userId: string) {
  const data = await prisma.availability.findMany({
    where: {
      userId: userId,
    },
  });

  // Convert Date objects to strings
  return data.map(item => ({
    ...item,
    fromTime: item.fromTime.toISOString(),
    toTime: item.toTime.toISOString(),
  }));
}

export default async function AvailabilityPage() {
  const session = await requireUser();
  const data = await getData(session.user?.id as string);

  return <AvailabilityForm initialData={data as AvailabilityWithStringDates[]} />;
}