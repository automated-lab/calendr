import { requireUser } from "@/app/lib/hooks";
import prisma from "@/app/lib/db";

export async function GET() {
  const session = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
    select: {
      id: true,
      email: true,
      grantId: true,
      grantEmail: true,
    },
  });

  return Response.json({ user });
}
