import { requireUser } from "@/app/lib/hooks";
import { nylas } from "@/app/lib/nylas";
import prisma from "@/app/lib/db";
import { EmptyState } from "@/app/components/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, fromUnixTime } from "date-fns";
import { Video } from "lucide-react";
import { SubmitButton } from "@/app/components/SubmitButton";
import { Separator } from "@/components/ui/separator";
import { cancelMeetingAction } from "@/app/actions/actions";

interface NylasEvent {
  id: string;
  title?: string;
  when: {
    startTime: number;
    endTime: number;
    startTimezone: string;
    endTimezone: string;
    object: string;
  };
  conferencing?: {
    details: {
      url: string;
    };
  };
  participants: {
    name: string;
    email: string;
  }[];
}

async function getData(userId: string) {
  const userData = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      grantId: true,
      grantEmail: true,
    },
  });

  if (!userData) {
    throw new Error("User not found");
  }

  const data = (await nylas.events.list({
    identifier: userData.grantId as string,
    queryParams: {
      calendarId: userData.grantEmail as string,
    },
  })) as unknown as { data: NylasEvent[] };

  return data;
}

export default async function meetingRoute() {
  const session = await requireUser();
  const data = await getData(session.user?.id as string);

  console.log("when object:", data.data[0].when);
  console.log("full data:", JSON.stringify(data.data[0], null, 2));

  return (
    <>
      {data.data.length < 1 ? (
        <EmptyState
          title="No meetings found"
          description="You have no meetings scheduled"
          buttonText="Create a meeting"
          href="/dashboard/new"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Meetings</CardTitle>
            <CardDescription>Your upcoming bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.data.map((item: NylasEvent) => (
              <div key={item.id}>
                <form action={cancelMeetingAction}>
                  <input type="hidden" name="eventId" value={item.id} />
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-muted-foreground">
                        {item.when.startTime
                          ? format(
                              fromUnixTime(item.when.startTime),
                              "EEE, dd MMM"
                            )
                          : "No date"}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1">
                        {item.when.startTime
                          ? format(fromUnixTime(item.when.startTime), "hh:mm a")
                          : "No time"}
                        {" - "}
                        {item.when.endTime
                          ? format(fromUnixTime(item.when.endTime), "hh:mm a")
                          : "No time"}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Video className="w-4 h-4" />
                        {item.conferencing?.details?.url && (
                          <a
                            href={item.conferencing.details.url}
                            target="_blank"
                            className="text-xs text-primary underline"
                          >
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <h2 className="text-sm font-medium">{item.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        You and {item.participants?.[0]?.name ?? "Guest"}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <SubmitButton
                        variant="destructive"
                        className="w-fit"
                        text="Cancel"
                      />
                    </div>
                  </div>
                  <Separator className="my-3" />
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
