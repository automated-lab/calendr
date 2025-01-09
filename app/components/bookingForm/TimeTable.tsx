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
      identifier: data.User.grantId,
      requestBody: {
        startTime: Math.floor(startOfDay.getTime() / 1000),
        endTime: Math.floor(endOfDay.getTime() / 1000),
        emails: [data.User.grantEmail],
      },
    });

    console.log(
      "Nylas Calendar Data:",
      JSON.stringify(nylasCalendarData, null, 2)
    );

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
  // Create now in the user's timezone
  const now = new Date();
  const userNow = formatInTimeZone(now, timezone, "yyyy-MM-dd HH:mm");
  const userNowDate = parse(userNow, "yyyy-MM-dd HH:mm", new Date());

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

  console.log(
    "Busy Slots Raw:",
    JSON.stringify(nylasData.data[0]?.timeSlots, null, 2)
  );

  const busySlots =
    nylasData.data[0]?.timeSlots?.map((slot: FreeBusyTimeSlot) => {
      // Convert UTC timestamps to user's timezone
      const startUtc = fromUnixTime(slot.startTime);
      const endUtc = fromUnixTime(slot.endTime);

      // Format in user's timezone then parse back to Date
      const startLocal = parse(
        formatInTimeZone(startUtc, timezone, "yyyy-MM-dd HH:mm"),
        "yyyy-MM-dd HH:mm",
        new Date()
      );
      const endLocal = parse(
        formatInTimeZone(endUtc, timezone, "yyyy-MM-dd HH:mm"),
        "yyyy-MM-dd HH:mm",
        new Date()
      );

      console.log(
        `Busy slot (${timezone}): ${format(startLocal, "HH:mm")} - ${format(endLocal, "HH:mm")}`
      );
      return { start: startLocal, end: endLocal };
    }) || [];

  const allSlots = [];
  let currentSlot = availableFromLocal;
  while (isBefore(currentSlot, availableToLocal)) {
    allSlots.push(currentSlot);
    currentSlot = addMinutes(currentSlot, duration);
  }

  const freeSlots = allSlots.filter((slot) => {
    const slotEnd = addMinutes(slot, duration);

    // Check if slot is in the past using user's timezone
    if (!isAfter(slot, userNowDate)) {
      console.log(`Slot ${format(slot, "HH:mm")} is in the past`);
      return false;
    }

    // Check for overlap with busy slots
    const isOverlapping = busySlots.some((busy: { start: Date; end: Date }) => {
      const hasOverlap =
        (isAfter(slot, busy.start) && isBefore(slot, busy.end)) || // Slot starts during busy period
        (isAfter(slotEnd, busy.start) && isBefore(slotEnd, busy.end)) || // Slot ends during busy period
        (isBefore(slot, busy.start) && isAfter(slotEnd, busy.end)); // Slot contains busy period

      if (hasOverlap) {
        console.log(
          `Slot ${format(slot, "HH:mm")} overlaps with busy period ${format(busy.start, "HH:mm")} - ${format(busy.end, "HH:mm")}`
        );
      }

      return hasOverlap;
    });

    return !isOverlapping;
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
