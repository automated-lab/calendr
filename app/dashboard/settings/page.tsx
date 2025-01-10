import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import prisma from "@/app/lib/db";
import { requireUser } from "@/app/lib/hooks";
import SettingsForm from "@/app/components/ui/SettingsForm";
import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";

async function getData(id: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      name: true,
      email: true,
      timezone: true,
      username: true,
    },
  });

  if (!data) {
    return notFound();
  }
  return data;
}

export default async function SettingsRoute() {
  const session = await requireUser();
  if (!session?.user?.id) return notFound();

  const data = await getData(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Update your profile settings
        </p>
      </div>

      <SettingsForm
        fullName={data.name || ""}
        email={data.email}
        profileImage=""
        timezone={data.timezone}
      />

      <div className="space-y-4 mt-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Calendar Connection</h3>
            <p className="text-sm text-muted-foreground">
              Reconnect your calendar if you&apos;re having sync issues
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/api/auth">
              <CalendarCheck2 className="size-4 mr-2" />
              Reconnect Calendar
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
