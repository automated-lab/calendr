// Server Component
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
import { formatInTimeZone } from "date-fns-tz";
import ClientTimeTable from "./ClientTimeTable.client";

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

  // Create start/end of day in user's timezone
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

  const timezone = data.User.timezone || "UTC";

  // Create start/end of day in user's timezone
  const startOfDayLocal = parse(
    format(selectedDate, "yyyy-MM-dd") + " 00:00",
    "yyyy-MM-dd HH:mm",
    new Date()
  );
  const endOfDayLocal = parse(
    format(selectedDate, "yyyy-MM-dd") + " 23:59",
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  try {
    console.log(
      `Fetching busy times for ${format(selectedDate, "yyyy-MM-dd")} in ${timezone}`
    );
    console.log(`Start time: ${format(startOfDayLocal, "yyyy-MM-dd HH:mm")}`);
    console.log(`End time: ${format(endOfDayLocal, "yyyy-MM-dd HH:mm")}`);

    const nylasCalendarData = await nylas.calendars.getFreeBusy({
      identifier: data.User.grantId,
      requestBody: {
        startTime: Math.floor(startOfDayLocal.getTime() / 1000),
        endTime: Math.floor(endOfDayLocal.getTime() / 1000),
        emails: [data.User.grantEmail],
      },
    });

    console.log("Nylas Response:", JSON.stringify(nylasCalendarData, null, 2));

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

async function calculateAvailableTimeSlots(
  date: string,
  dbAvailability: {
    fromTime: string | undefined;
    toTime: string | undefined;
  },
  nylasData: NylasCalendarResponse,
  duration: number,
  timezone: string
) {
  // Create now in UTC
  const now = new Date();

  if (!dbAvailability.fromTime || !dbAvailability.toTime) {
    return [];
  }

  // Convert availability times from user's timezone to UTC for comparison
  const availableFromUtc = parse(
    `${date} ${format(new Date(dbAvailability.fromTime), "HH:mm")}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  let availableToUtc = parse(
    `${date} ${format(new Date(dbAvailability.toTime), "HH:mm")}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  if (availableToUtc < availableFromUtc) {
    availableToUtc = addDays(availableToUtc, 1);
  }

  console.log("Processing date:", date);
  console.log("User timezone:", timezone);
  console.log("Available from (UTC):", format(availableFromUtc, "HH:mm"));
  console.log("Available to (UTC):", format(availableToUtc, "HH:mm"));

  // Nylas busy slots are already in UTC, just convert to Date objects
  const busySlots =
    nylasData.data[0]?.timeSlots?.map((slot: FreeBusyTimeSlot) => {
      const start = fromUnixTime(slot.startTime);
      const end = fromUnixTime(slot.endTime);
      console.log(
        `Busy slot (UTC): ${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
      );
      return { start, end };
    }) || [];

  // Generate all possible slots in UTC
  const allSlots = [];
  let currentSlot = availableFromUtc;
  while (isBefore(currentSlot, availableToUtc)) {
    allSlots.push(currentSlot);
    currentSlot = addMinutes(currentSlot, duration);
  }

  const freeSlots = allSlots.filter((slot) => {
    const slotEnd = addMinutes(slot, duration);

    // Check if slot is in the past
    if (!isAfter(slot, now)) {
      console.log(`Slot ${format(slot, "HH:mm")} UTC is in the past`);
      return false;
    }

    // Check for overlap with busy slots (all in UTC)
    const isOverlapping = busySlots.some((busy: { start: Date; end: Date }) => {
      const hasOverlap =
        (isAfter(slot, busy.start) && isBefore(slot, busy.end)) || // Slot starts during busy period
        (isAfter(slotEnd, busy.start) && isBefore(slotEnd, busy.end)) || // Slot ends during busy period
        (isBefore(slot, busy.start) && isAfter(slotEnd, busy.end)) || // Slot contains busy period
        slot.getTime() === busy.start.getTime() || // Slot starts exactly at busy start
        slotEnd.getTime() === busy.end.getTime(); // Slot ends exactly at busy end

      if (hasOverlap) {
        console.log(
          `Slot ${format(slot, "HH:mm")} UTC overlaps with busy period ${format(busy.start, "HH:mm")} - ${format(busy.end, "HH:mm")} UTC`
        );
      }

      return hasOverlap;
    });

    return !isOverlapping;
  });

  // Convert free slots from UTC to user's timezone for display
  return freeSlots.map((slot) => formatInTimeZone(slot, timezone, "HH:mm"));
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

  const availableSlotsHostTz = await calculateAvailableTimeSlots(
    formattedDate,
    dbAvailability,
    nylasCalendarData,
    duration,
    data?.User?.timezone || "UTC"
  );

  return (
    <ClientTimeTable
      selectedDate={selectedDate}
      availableSlotsHostTz={availableSlotsHostTz}
      formattedDate={formattedDate}
    />
  );
}
