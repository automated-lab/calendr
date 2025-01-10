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
import { Prisma } from "@prisma/client";
import { nylas } from "@/app/lib/nylas";
import { formatInTimeZone } from "date-fns-tz";
import ClientTimeTable from "./ClientTimeTable.client";

// Set timezone for server-side operations
process.env.TZ = process.env.TIMEZONE || "UTC";

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
  console.log("=== getData Debug ===");
  console.log("Server location: Washington, D.C.");
  console.log("Server time:", new Date().toISOString());
  console.log("Selected date (raw):", selectedDate);
  console.log("Selected date (ISO):", selectedDate.toISOString());
  console.log("Current day:", currentDay);

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

  const timezone = data?.User?.timezone || "UTC";
  console.log("User timezone:", timezone);
  console.log(
    "Selected date in user timezone:",
    formatInTimeZone(selectedDate, timezone, "yyyy-MM-dd HH:mm:ssXXX")
  );

  // Create start/end of day in UTC for the SELECTED date
  // Start from previous day to handle timezone differences
  const startOfDay = new Date(selectedDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  startOfDay.setDate(startOfDay.getDate() - 1); // Start from previous day

  const endOfDay = new Date(selectedDate);
  endOfDay.setUTCHours(23, 59, 59, 999);
  endOfDay.setDate(endOfDay.getDate() + 1); // End at next day

  console.log("Fetch window start (UTC):", startOfDay.toISOString());
  console.log(
    "Fetch window start (User TZ):",
    formatInTimeZone(startOfDay, timezone, "yyyy-MM-dd HH:mm:ssXXX")
  );
  console.log("Fetch window end (UTC):", endOfDay.toISOString());
  console.log(
    "Fetch window end (User TZ):",
    formatInTimeZone(endOfDay, timezone, "yyyy-MM-dd HH:mm:ssXXX")
  );

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

  try {
    console.log(
      `Fetching busy times for ${format(selectedDate, "yyyy-MM-dd")} in ${timezone}`
    );
    console.log(`Start time (UTC): ${startOfDay.toISOString()}`);
    console.log(`End time (UTC): ${endOfDay.toISOString()}`);

    const nylasCalendarData = await nylas.calendars.getFreeBusy({
      identifier: data.User.grantId,
      requestBody: {
        startTime: Math.floor(startOfDay.getTime() / 1000),
        endTime: Math.floor(endOfDay.getTime() / 1000),
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

  // Convert DB availability to Date objects in the user's timezone
  const availableFrom = parse(
    `${date} ${format(new Date(dbAvailability.fromTime!), "HH:mm")}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  const availableTo = parse(
    `${date} ${format(new Date(dbAvailability.toTime!), "HH:mm")}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  // Handle day wraparound
  if (availableTo < availableFrom) {
    availableTo.setDate(availableTo.getDate() + 1);
  }

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
      allSlots.push(new Date(currentSlot));
    }

    currentSlot = addMinutes(currentSlot, duration);
  }

  return allSlots.map((slot) => formatInTimeZone(slot, timezone, "HH:mm"));
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
