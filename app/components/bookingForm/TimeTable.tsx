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

  console.log("Processing date:", date);
  console.log("User timezone:", timezone);
  console.log(
    "Raw busy slots:",
    JSON.stringify(nylasData.data[0]?.timeSlots, null, 2)
  );

  const busySlots =
    nylasData.data[0]?.timeSlots?.map((slot: FreeBusyTimeSlot) => {
      // First convert UTC timestamps to dates
      const startUtc = fromUnixTime(slot.startTime);
      const endUtc = fromUnixTime(slot.endTime);

      console.log(
        `Original UTC slot: ${format(startUtc, "yyyy-MM-dd HH:mm")} - ${format(endUtc, "yyyy-MM-dd HH:mm")}`
      );

      // Convert to user's timezone while preserving the actual time
      const startInTz = formatInTimeZone(
        startUtc,
        timezone,
        "yyyy-MM-dd HH:mm"
      );
      const endInTz = formatInTimeZone(endUtc, timezone, "yyyy-MM-dd HH:mm");

      console.log(`Timezone adjusted slot: ${startInTz} - ${endInTz}`);

      // Parse back to Date objects
      const startLocal = parse(startInTz, "yyyy-MM-dd HH:mm", new Date());
      const endLocal = parse(endInTz, "yyyy-MM-dd HH:mm", new Date());

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
    const slotTime = format(slot, "HH:mm");

    // Check if slot is in the past using user's timezone
    if (!isAfter(slot, userNowDate)) {
      console.log(`Slot ${slotTime} is in the past`);
      return false;
    }

    // Check for overlap with busy slots
    const isOverlapping = busySlots.some((busy: { start: Date; end: Date }) => {
      const hasOverlap =
        (isAfter(slot, busy.start) && isBefore(slot, busy.end)) || // Slot starts during busy period
        (isAfter(slotEnd, busy.start) && isBefore(slotEnd, busy.end)) || // Slot ends during busy period
        (isBefore(slot, busy.start) && isAfter(slotEnd, busy.end)) || // Slot contains busy period
        slot.getTime() === busy.start.getTime() || // Slot starts exactly at busy start
        slotEnd.getTime() === busy.end.getTime(); // Slot ends exactly at busy end

      if (hasOverlap) {
        console.log(
          `Slot ${slotTime} overlaps with busy period ${format(busy.start, "HH:mm")} - ${format(busy.end, "HH:mm")}`
        );
      }

      return hasOverlap;
    });

    return !isOverlapping;
  });

  // Format times in the user's timezone
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
