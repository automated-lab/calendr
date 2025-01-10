import { Card, CardContent } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { CalendarX2, Clock, Video } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RenderCalendar } from "@/app/components/bookingForm/RenderCalendar";
import { TimeTable } from "@/app/components/bookingForm/TimeTable";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/app/components/SubmitButton";
import { createMeetingAction } from "@/app/actions/actions";
import { formatInTimeZone } from "date-fns-tz";

async function getData(userName: string, eventUrl: string) {
  const data = await prisma.eventType.findFirst({
    where: {
      url: eventUrl,
      User: {
        username: userName,
      },
      active: true,
    },
    select: {
      id: true,
      description: true,
      title: true,
      duration: true,
      videoCallSoftware: true,
      User: {
        select: {
          image: true,
          name: true,
          availability: {
            select: {
              day: true,
              isActive: true,
            },
            orderBy: {
              day: "asc",
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  // Sort availability if it exists
  if (data.User?.availability) {
    const dayOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    data.User.availability.sort(
      (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    );
  }

  console.log("Availability data:", data.User?.availability);
  return data;
}

interface Props {
  params: Promise<{ username: string; eventUrl: string }>;
  searchParams: Promise<{ date?: string; time?: string }>;
}

export default async function EventTypePage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { username, eventUrl } = resolvedParams;

  // Get user's timezone first
  const userData = await prisma.user.findUnique({
    where: { username },
    select: { timezone: true },
  });
  const userTimezone = userData?.timezone || "UTC";

  // If no date is provided, redirect to today's date in user's timezone
  if (!resolvedSearchParams.date) {
    const now = new Date();
    const todayInUserTz = formatInTimeZone(now, userTimezone, "yyyy-MM-dd");
    return redirect(`/${username}/${eventUrl}?date=${todayInUserTz}`);
  }

  const data = await getData(username, eventUrl);
  const selectedDate = resolvedSearchParams.date
    ? new Date(`${resolvedSearchParams.date}T00:00:00`)
    : new Date();

  const formattedDate = formatInTimeZone(
    selectedDate,
    userTimezone,
    "EEEE, MMMM do"
  );

  const showForm = !!resolvedSearchParams.date && !!resolvedSearchParams.time;

  return (
    <div className="flex items-center justify-center min-h-screen w-screen">
      {showForm ? (
        <Card className="w-full max-w-[800px]">
          <CardContent className="gap-4 p-5 md:grid md:grid-cols-[1fr,auto,1fr]">
            <div className="flex flex-col gap-2">
              <Image
                src={data.User?.image as string}
                alt="Profile Image"
                className="rounded-full"
                width={40}
                height={40}
              />
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {data.User?.name}
              </p>
              <h1 className="text-xl font-semibold mt-2">{data.title}</h1>
              <p className="text-sm font-medium text-muted-foreground">
                {data.description}
              </p>
              <div className="mt-5 flex flex-col gap-y-3">
                <p className="flex items-center">
                  <CalendarX2 className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formattedDate}
                  </span>
                </p>
                <p className="flex items-center">
                  <Clock className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.duration} Minutes
                  </span>
                </p>
                <p className="flex items-center">
                  <Video className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.videoCallSoftware}
                  </span>
                </p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-full w-[1px]" />
            <form
              className="flex flex-col gap-y-2"
              action={createMeetingAction}
            >
              <input
                type="hidden"
                name="fromTime"
                value={resolvedSearchParams.time}
              />
              <input
                type="hidden"
                name="eventDate"
                value={resolvedSearchParams.date}
              />
              <input type="hidden" name="meetingLength" value={data.duration} />
              <input
                type="hidden"
                name="provider"
                value={data.videoCallSoftware}
              />
              <input type="hidden" name="username" value={username} />
              <input type="hidden" name="eventTypeId" value={data.id} />
              <div className="flex flex-col gap-y-2 mt-8">
                <Label>Name</Label>
                <Input
                  name="name"
                  placeholder="Name"
                  className="w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="johndoe@example.com"
                  required
                />
              </div>
              <SubmitButton className="w-full mt-5" text="Book Meeting" />
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-[1000px] w-full mx-auto">
          <CardContent className="gap-4 p-5 md:grid md:grid-cols-[1fr,auto,1fr,auto,1fr] flex flex-col space-y-8 md:space-y-0">
            <div className="flex flex-col gap-2">
              <Image
                src={data.User?.image as string}
                alt="Profile Image"
                className="rounded-full"
                width={40}
                height={40}
              />
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {data.User?.name}
              </p>
              <h1 className="text-xl font-semibold mt-2">{data.title}</h1>
              <p className="text-sm font-medium text-muted-foreground">
                {data.description}
              </p>
              <div className="mt-5 flex flex-col gap-y-3">
                <p className="flex items-center">
                  <CalendarX2 className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formattedDate}
                  </span>
                </p>
                <p className="flex items-center">
                  <Clock className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.duration} Minutes
                  </span>
                </p>
                <p className="flex items-center">
                  <Video className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.videoCallSoftware}
                  </span>
                </p>
              </div>
            </div>

            <Separator
              orientation="vertical"
              className="h-full w-[1px] hidden md:block"
            />

            <RenderCalendar availability={data.User?.availability ?? []} />

            <Separator
              orientation="vertical"
              className="h-full w-[1px] hidden md:block"
            />

            <TimeTable
              duration={data.duration}
              selectedDate={selectedDate}
              userName={username}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
