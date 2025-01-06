import { Card, CardContent } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CalendarX2, Clock, Video } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RenderCalendar } from "@/app/components/bookingForm/RenderCalendar";
import { TimeTable } from "@/app/components/bookingForm/TimeTable";

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

  return data;
}

function getOrdinalSuffix(day: number) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export default async function BookingFormRoute({
  params,
  searchParams,
}: {
  params: { username: string; eventUrl: string };
  searchParams: { date?: string };
}) {
  const { username, eventUrl } = await params;
  const { date } = await searchParams;
  const data = await getData(username, eventUrl);
  const selectedDate = date ? new Date(date) : new Date();

  const day = selectedDate.getDate();
  const formattedDate = `${new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(selectedDate)}, ${new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(selectedDate)} ${day}${getOrdinalSuffix(day)}`;

  return (
    <div className="flex items-center justify-center min-h-screen w-screen">
      <Card className="max-w-[1000px] w-full mx-auto">
        <CardContent className="gap-4 p-5 md:grid md:grid-cols-[1fr,auto,1fr,auto,1fr]">
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
          <RenderCalendar availability={data.User?.availability ?? []} />
          <Separator orientation="vertical" className="h-full w-[1px]" />
          <TimeTable
            duration={data.duration}
            selectedDate={selectedDate}
            userName={username}
          />
        </CardContent>
      </Card>
    </div>
  );
}
