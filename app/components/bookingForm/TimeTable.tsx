import prisma from "@/app/lib/db";
import {
  addMinutes,
  format,
  fromUnixTime,
  isAfter,
  isBefore,
  parse,
  addDays,
} from "date-fns";
import { Prisma } from "@prisma/client";
import { nylas } from "@/app/lib/nylas";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatInTimeZone } from "date-fns-tz";

interface FreeBusyTimeSlot {
  startTime: number;
  endTime: number;
}

interface FreeBusyData {
  email: string;
  timeSlots: FreeBusyTimeSlot[];
  object: "free_busy";
}

interface NylasCalendarResponse {
  data: FreeBusyData[];
}

async function getData(selectedDate: Date, username: string) {
  const currentDay = format(selectedDate, "EEEE");

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const data = await prisma.availability.findFirst({
    where: {
      day: currentDay as Prisma.EnumDayFilter,
      User: {
        username: username,
      },
    },
    select: {
      fromTime: true,
      toTime: true,
      id: true,
      User: {
        select: {
          grantEmail: true,
          grantId: true,
          timezone: true,
        },
      },
    },
  });

  if (!data?.User?.grantId || !data?.User?.grantEmail) {
    return {
      data,
      nylasCalendarData: {
        data: [
          {
            email: data?.User?.grantEmail || "",
            timeSlots: [],
            object: "free_busy",
          },
        ] as FreeBusyData[],
      },
    };
  }

  try {
    const nylasCalendarData = await nylas.calendars.getFreeBusy({
      identifier: "/me/",
      requestBody: {
        startTime: Math.floor(startOfDay.getTime() / 1000),
        endTime: Math.floor(endOfDay.getTime() / 1000),
        emails: [data.User.grantEmail],
      },
    });

    return {
      data,
      nylasCalendarData: nylasCalendarData as NylasCalendarResponse,
    };
  } catch (error) {
    console.error("Nylas API Error:", error);
    return {
      data,
      nylasCalendarData: {
        data: [
          {
            email: data.User.grantEmail,
            timeSlots: [],
            object: "free_busy",
          },
        ] as FreeBusyData[],
      },
    };
  }
}

interface iAppProps {
  selectedDate: Date;
  userName: string;
  duration: number;
}

function calculateAvailableTimeSlots(
  date: string,
  dbAvailability: {
    fromTime: string | undefined;
    toTime: string | undefined;
  },
  nylasData: NylasCalendarResponse,
  duration: number,
  timezone: string
) {
  const now = new Date();

  if (!dbAvailability.fromTime || !dbAvailability.toTime) {
    return [];
  }

  // Parse times from HH:mm format in the user's timezone
  const availableFromLocal = parse(
    `${date} ${format(new Date(dbAvailability.fromTime), "HH:mm")}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  let availableToLocal = parse(
    `${date} ${format(new Date(dbAvailability.toTime), "HH:mm")}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  if (availableToLocal < availableFromLocal) {
    availableToLocal = addDays(availableToLocal, 1);
  }

  const busySlots =
    nylasData.data[0]?.timeSlots?.map((slot: FreeBusyTimeSlot) => ({
      start: fromUnixTime(slot.startTime),
      end: fromUnixTime(slot.endTime),
    })) || [];

  const allSlots = [];
  let currentSlot = availableFromLocal;
  while (isBefore(currentSlot, availableToLocal)) {
    allSlots.push(currentSlot);
    currentSlot = addMinutes(currentSlot, duration);
  }

  const freeSlots = allSlots.filter((slot) => {
    const slotEnd = addMinutes(slot, duration);

    // Check if slot is in the past (including the full duration)
    if (!isAfter(slotEnd, now)) {
      return false;
    }

    // Check for overlap with busy slots
    return !busySlots.some((busy: { start: Date; end: Date }) => {
      // Check if there's any overlap between the slot and the busy period
      const hasOverlap =
        // Slot starts during busy period
        ((isAfter(slot, busy.start) ||
          slot.getTime() === busy.start.getTime()) &&
          isBefore(slot, busy.end)) ||
        // Slot ends during busy period
        (isAfter(slotEnd, busy.start) &&
          (isBefore(slotEnd, busy.end) ||
            slotEnd.getTime() === busy.end.getTime())) ||
        // Slot completely contains busy period
        ((isBefore(slot, busy.start) ||
          slot.getTime() === busy.start.getTime()) &&
          (isAfter(slotEnd, busy.end) ||
            slotEnd.getTime() === busy.end.getTime()));
      return hasOverlap;
    });
  });

  // Format times in the user's timezone
  return freeSlots.map((slot) => {
    return formatInTimeZone(slot, timezone, "HH:mm");
  });
}

export async function TimeTable({
  selectedDate,
  userName,
  duration,
}: iAppProps) {
  const { data, nylasCalendarData } = await getData(selectedDate, userName);

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const dbAvailability = {
    fromTime: data?.fromTime?.toISOString(),
    toTime: data?.toTime?.toISOString(),
  };

  const availableSlots = calculateAvailableTimeSlots(
    formattedDate,
    dbAvailability,
    nylasCalendarData,
    duration,
    data?.User?.timezone || "UTC"
  );

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-base font-semibold">
        {format(selectedDate, "EEE")}{" "}
        <span className="text-sm text-muted-foreground">
          {format(selectedDate, "MMM d")}
        </span>
      </p>

      <div className="mt-3 h-[350px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
        {availableSlots.length > 0 ? (
          availableSlots.map((slot, index) => (
            <Link
              key={index}
              href={`?date=${format(selectedDate, "yyyy-MM-dd")}&time=${slot}`}
            >
              <Button variant="outline" className="w-full mb-2">
                {slot}
              </Button>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No available slots</p>
        )}
      </div>
    </div>
  );
}
