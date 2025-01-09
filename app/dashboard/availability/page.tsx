import { requireUser } from "@/app/lib/hooks";
import prisma from "@/app/lib/db";
import AvailabilityForm from "./AvailabilityForm";

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

interface Availability {
  id: string;
  day: Day;
  fromTime: Date;
  toTime: Date;
  isActive: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

async function getData(userId: string) {
  const data = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      timezone: true,
      availability: true,
    },
  });

  if (!data) return { timezone: "UTC", availability: [] };

  // Convert Date objects to strings
  return {
    timezone: data.timezone,
    availability: data.availability.map((item: Availability) => ({
      ...item,
      fromTime: item.fromTime.toISOString(),
      toTime: item.toTime.toISOString(),
    }))
  };
}

export default async function AvailabilityPage() {
  const session = await requireUser();
  const data = await getData(session.user?.id as string);

  return <AvailabilityForm initialData={data.availability} userTimezone={data.timezone} />;
}