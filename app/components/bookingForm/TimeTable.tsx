// Server Component
import prisma from "@/app/lib/db";
import {
  addMinutes,
  format,
  fromUnixTime,
  isAfter,
  isBefore,
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

  // Create start/end of day in UTC
  const startOfDay = new Date(
    Date.UTC(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0,
      0,
      0
    )
  );

  const endOfDay = new Date(
    Date.UTC(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      23,
      59,
      59
    )
  );

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
  const selectedDate = new Date(date);

  if (!dbAvailability.fromTime || !dbAvailability.toTime) {
    return [];
  }

  // Get the timezone offset in minutes for the selected date
  const tzOffset = selectedDate.getTimezoneOffset();

  // Use the UTC times directly from DB but adjust to selected date
  const fromTime = new Date(dbAvailability.fromTime);
  const toTime = new Date(dbAvailability.toTime);

  // Create date objects for the selected date's availability window, adjusting for timezone
  const availableFromUtc = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    fromTime.getUTCHours(),
    fromTime.getUTCMinutes()
  );
  availableFromUtc.setMinutes(availableFromUtc.getMinutes() - tzOffset);

  let availableToUtc = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    toTime.getUTCHours(),
    toTime.getUTCMinutes()
  );
  availableToUtc.setMinutes(availableToUtc.getMinutes() - tzOffset);

  // Handle day wraparound if needed
  if (availableToUtc < availableFromUtc) {
    availableToUtc = addDays(availableToUtc, 1);
  }

  console.log("Processing date:", date);
  console.log("Timezone offset (minutes):", tzOffset);
  console.log("Available from (UTC):", availableFromUtc.toISOString());
  console.log("Available to (UTC):", availableToUtc.toISOString());

  // Convert Nylas timestamps to UTC Date objects
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
    allSlots.push(new Date(currentSlot));
    currentSlot = addMinutes(new Date(currentSlot), duration);
  }

  const freeSlots = allSlots.filter((slot) => {
    const slotEnd = addMinutes(new Date(slot), duration);

    // Compare with now in UTC
    if (!isAfter(slot, now)) {
      console.log(`Slot ${slot.toISOString()} is in the past`);
      return false;
    }

    // Check for overlap with busy slots (all in UTC)
    const isOverlapping = busySlots.some((busy) => {
      const hasOverlap =
        (isAfter(slot, busy.start) && isBefore(slot, busy.end)) || // Slot starts during busy period
        (isAfter(slotEnd, busy.start) && isBefore(slotEnd, busy.end)) || // Slot ends during busy period
        (isBefore(slot, busy.start) && isAfter(slotEnd, busy.end)) || // Slot contains busy period
        (isBefore(busy.start, slot) && isAfter(busy.end, slotEnd)) || // Busy period contains slot
        slot.getTime() === busy.start.getTime() || // Exact start match
        slotEnd.getTime() === busy.end.getTime(); // Exact end match

      if (hasOverlap) {
        console.log(
          `Slot ${slot.toISOString()} overlaps with busy period ${busy.start.toISOString()} - ${busy.end.toISOString()}`
        );
      }

      return hasOverlap;
    });

    return !isOverlapping;
  });

  // Convert free slots to display timezone
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
