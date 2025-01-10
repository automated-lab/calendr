// Server Component
import prisma from "@/app/lib/db";
import {
  addMinutes,
  format,
  isBefore,
  isAfter,
  fromUnixTime,
  parseISO,
} from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
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
  const data = (await prisma.availability.findFirst({
    where: {
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
  const currentDay = formatInTimeZone(selectedDate, timezone, "EEEE");

  console.log("=== getData Debug ===");
  console.log("Selected date:", selectedDate);
  console.log("Current day:", currentDay);
  console.log("User timezone:", timezone);

  // Now query with the correct day
  const availabilityData = await prisma.availability.findFirst({
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

  console.log(
    "DB Availability data:",
    JSON.stringify(availabilityData, null, 2)
  );

  if (!availabilityData?.User?.grantId || !availabilityData?.User?.grantEmail) {
    return {
      data: availabilityData,
      nylasCalendarData: {
        data: [
          {
            email: availabilityData?.User?.grantEmail || "",
            timeSlots: [],
            object: "free_busy",
          },
        ] as FreeBusyData[],
      },
    };
  }

  // Create start/end of day in the user's timezone
  console.log("=== Server Timezone Debug ===");
  console.log("Server TIMEZONE:", process.env.TIMEZONE);
  console.log("Server current time:", new Date().toString());
  console.log("Server timezone offset:", new Date().getTimezoneOffset());

  // Force server timezone to match user's timezone
  process.env.TZ = process.env.TIMEZONE || timezone;

  const startOfDay = toDate(
    parseISO(`${format(selectedDate, "yyyy-MM-dd")}T00:00:00`),
    { timeZone: timezone }
  );
  console.log("Start of day (user TZ):", startOfDay.toString());
  console.log("Start of day unix:", Math.floor(startOfDay.getTime() / 1000));

  const endOfDay = toDate(
    parseISO(`${format(selectedDate, "yyyy-MM-dd")}T23:59:59`),
    { timeZone: timezone }
  );

  try {
    const nylasCalendarData = await nylas.calendars.getFreeBusy({
      identifier: availabilityData.User.grantId,
      requestBody: {
        startTime: Math.floor(startOfDay.getTime() / 1000),
        endTime: Math.floor(endOfDay.getTime() / 1000),
        emails: [availabilityData.User.grantEmail],
      },
    });

    return {
      data: availabilityData,
      nylasCalendarData: nylasCalendarData as NylasCalendarResponse,
    };
  } catch (error) {
    console.error("Nylas API Error:", error);
    return {
      data: availabilityData,
      nylasCalendarData: {
        data: [
          {
            email: availabilityData.User.grantEmail,
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
  // Get current time in user's timezone
  const now = toDate(new Date(), { timeZone: timezone });

  // Convert time strings to Date objects in the user's timezone
  const availableFrom = toDate(parseISO(`${date}T${dbAvailability.fromTime}`), {
    timeZone: timezone,
  });

  const availableTo = toDate(parseISO(`${date}T${dbAvailability.toTime}`), {
    timeZone: timezone,
  });

  // Extract busy slots from Nylas data and convert to user timezone
  const busySlots =
    nylasData.data[0]?.timeSlots?.map((slot) => ({
      start: toDate(fromUnixTime(slot.startTime), { timeZone: timezone }),
      end: toDate(fromUnixTime(slot.endTime), { timeZone: timezone }),
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
