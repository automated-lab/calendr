import { requireUser } from "@/app/lib/hooks";
import prisma from "@/app/lib/db";
import AvailabilityForm from "./AvailabilityForm";

async function getData(userId: string) {
  const data = await prisma.availability.findMany({
    where: {
      userId: userId,
    },
  });
  return data;
}

export default async function AvailabilityPage() {
  const session = await requireUser();
  const data = await getData(session.user?.id as string);
  
  return <AvailabilityForm initialData={data} />;
}