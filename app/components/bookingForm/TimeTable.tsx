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
  const now = new Date();
  const selectedDate = new Date(date);

  if (!dbAvailability.fromTime || !dbAvailability.toTime) {
    return [];
  }

  // Use the UTC times directly from DB but adjust to selected date
  const fromTime = new Date(dbAvailability.fromTime);
  const toTime = new Date(dbAvailability.toTime);

  const availableFromUtc = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    fromTime.getUTCHours(),
    fromTime.getUTCMinutes()
  );

  let availableToUtc = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    toTime.getUTCHours(),
    toTime.getUTCMinutes()
  );

  // Handle day wraparound if needed
  if (availableToUtc < availableFromUtc) {
    availableToUtc = addDays(availableToUtc, 1);
  }

  console.log("Processing date:", date);
  console.log("Available from (UTC):", availableFromUtc.toISOString());
  console.log("Available to (UTC):", availableToUtc.toISOString());

  // Use Nylas busy slots directly (they're already in UTC)
  const busySlots =
    nylasData.data[0]?.timeSlots?.map((slot: FreeBusyTimeSlot) => {
      const start = fromUnixTime(slot.startTime);
      const end = fromUnixTime(slot.endTime);
      console.log(
        `Busy slot (UTC): ${start.toISOString()} - ${end.toISOString()}`
      );
      return { start, end };
    }) || [];

  // Generate slots in UTC
  const allSlots = [];
  let currentSlot = availableFromUtc;
  while (isBefore(currentSlot, availableToUtc)) {
    allSlots.push(currentSlot);
    currentSlot = addMinutes(currentSlot, duration);
  }

  const freeSlots = allSlots.filter((slot) => {
    const slotEnd = addMinutes(slot, duration);

    // Compare with now in UTC
    if (!isAfter(slot, now)) {
      console.log(`Slot ${slot.toISOString()} is in the past`);
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
          `Slot ${slot.toISOString()} overlaps with busy period ${busy.start.toISOString()} - ${busy.end.toISOString()}`
        );
      }

      return hasOverlap;
    });

    return !isOverlapping;
  });

  // Only convert to display timezone at the very end
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
