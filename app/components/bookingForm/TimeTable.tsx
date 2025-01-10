// Server Component
import prisma from "@/app/lib/db";
import {
  addMinutes,
  format,
  isBefore,
  isAfter,
  parse,
  fromUnixTime,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Prisma } from "@prisma/client";
import { nylas } from "@/app/lib/nylas";
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

interface AvailabilityData {
  fromTime: string;
  toTime: string;
  id: string;
  User: {
    grantEmail: string | null;
    grantId: string | null;
    timezone: string;
  } | null;
}

async function getData(selectedDate: Date, username: string) {
  const currentDay = format(selectedDate, "EEEE");
  console.log("=== getData Debug ===");
  console.log("Selected date:", selectedDate);
  console.log("Current day:", currentDay);

  const data = (await prisma.availability.findFirst({
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
  })) as AvailabilityData | null;

  const timezone = data?.User?.timezone || "UTC";
  console.log("User timezone:", timezone);
  console.log("DB Availability data:", JSON.stringify(data, null, 2));

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

  // Create start/end of day in the user's timezone
  const startOfDay = parse(
    format(selectedDate, "yyyy-MM-dd"),
    "yyyy-MM-dd",
    new Date()
  );
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const nylasCalendarData = await nylas.calendars.getFreeBusy({
      identifier: data.User.grantId,
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

  // Convert time strings to Date objects for comparison in user's timezone
  const availableFrom = parse(
    `${date} ${dbAvailability.fromTime}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  const availableTo = parse(
    `${date} ${dbAvailability.toTime}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  // Extract busy slots from Nylas data
  const busySlots =
    nylasData.data[0]?.timeSlots?.map((slot) => ({
      start: fromUnixTime(slot.startTime),
      end: fromUnixTime(slot.endTime),
    })) || [];

  // Generate all possible slots within the available time
  const allSlots = [];
  let currentSlot = availableFrom;

  while (isBefore(currentSlot, availableTo)) {
    // Skip slots in the past
    if (isBefore(currentSlot, now)) {
      currentSlot = addMinutes(currentSlot, duration);
      continue;
    }

    const slotEnd = addMinutes(currentSlot, duration);

    // Check if slot overlaps with any busy period
    const isAvailable = !busySlots.some(
      (busy) =>
        (!isBefore(currentSlot, busy.start) &&
          isBefore(currentSlot, busy.end)) || // Slot starts during busy period
        (isAfter(slotEnd, busy.start) && !isAfter(slotEnd, busy.end)) || // Slot ends during busy period
        (isBefore(currentSlot, busy.start) && isAfter(slotEnd, busy.end)) // Slot completely contains busy period
    );

    if (isAvailable) {
      allSlots.push(formatInTimeZone(currentSlot, timezone, "HH:mm"));
    }

    currentSlot = addMinutes(currentSlot, duration);
  }

  return allSlots;
}

export async function TimeTable({
  selectedDate,
  userName,
  duration,
}: iAppProps) {
  const { data, nylasCalendarData } = await getData(selectedDate, userName);
  const timezone = data?.User?.timezone || "UTC";

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const dbAvailability: {
    fromTime: string | undefined;
    toTime: string | undefined;
  } = {
    fromTime: data?.fromTime || undefined,
    toTime: data?.toTime || undefined,
  };

  const availableSlotsHostTz = await calculateAvailableTimeSlots(
    formattedDate,
    dbAvailability,
    nylasCalendarData,
    duration,
    timezone
  );

  return (
    <ClientTimeTable
      selectedDate={selectedDate}
      availableSlotsHostTz={availableSlotsHostTz}
      formattedDate={formattedDate}
    />
  );
}
