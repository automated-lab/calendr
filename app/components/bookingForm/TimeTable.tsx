// Server Component
import prisma from "@/app/lib/db";
import { addMinutes, format, isBefore } from "date-fns";
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
  console.log("\n=== Time Slot Calculation Debug ===");
  console.log("Server time:", new Date().toISOString());
  console.log("Input date:", date);
  console.log(
    "Input date in user timezone:",
    formatInTimeZone(new Date(date), timezone, "yyyy-MM-dd HH:mm:ssXXX")
  );

  const now = new Date();
  const selectedDate = new Date(date);

  if (!dbAvailability.fromTime || !dbAvailability.toTime) {
    return [];
  }

  // Convert the DB times to the user's timezone
  const fromTimeLocal = formatInTimeZone(
    new Date(dbAvailability.fromTime),
    timezone,
    "HH:mm:ss"
  );
  const toTimeLocal = formatInTimeZone(
    new Date(dbAvailability.toTime),
    timezone,
    "HH:mm:ss"
  );

  // Parse hours and minutes from the local time strings
  const [fromHours, fromMinutes] = fromTimeLocal.split(":").map(Number);
  const [toHours, toMinutes] = toTimeLocal.split(":").map(Number);

  // Create new dates in the user's timezone
  const availableFromUtc = new Date(selectedDate);
  availableFromUtc.setHours(fromHours, fromMinutes, 0, 0);

  const availableToUtc = new Date(selectedDate);
  availableToUtc.setHours(toHours, toMinutes, 0, 0);

  // Handle day wraparound - if end time is before start time, it means it's the next day
  if (availableToUtc < availableFromUtc) {
    availableToUtc.setDate(availableToUtc.getDate() + 1);
  }

  console.log("Selected date:", selectedDate.toISOString());
  console.log("DB from time:", dbAvailability.fromTime);
  console.log("DB to time:", dbAvailability.toTime);
  console.log("Local from time:", fromTimeLocal);
  console.log("Local to time:", toTimeLocal);
  console.log("Processing date:", date);
  console.log("Timezone being used:", timezone);
  console.log("Available from:", availableFromUtc.toISOString());
  console.log("Available to:", availableToUtc.toISOString());

  // Get all busy slots
  const busySlots =
    nylasData.data[0]?.timeSlots?.map((slot: FreeBusyTimeSlot) => {
      const startDate = new Date(slot.startTime * 1000);
      const endDate = new Date(slot.endTime * 1000);
      console.log("\n=== Busy Slot Analysis ===");
      console.log(`Raw timestamps: ${slot.startTime} - ${slot.endTime}`);
      console.log(
        `UTC times: ${startDate.toISOString()} - ${endDate.toISOString()}`
      );
      console.log(
        `User timezone (${timezone}): ${formatInTimeZone(startDate, timezone, "yyyy-MM-dd HH:mm:ssXXX")} - ${formatInTimeZone(endDate, timezone, "yyyy-MM-dd HH:mm:ssXXX")}`
      );
      return {
        start: slot.startTime,
        end: slot.endTime,
      };
    }) || [];

  // Generate available slots
  const allSlots = [];
  let currentSlot = availableFromUtc;

  while (isBefore(currentSlot, availableToUtc)) {
    if (isBefore(currentSlot, now)) {
      console.log(`Slot ${currentSlot.toISOString()} is in the past`);
    } else {
      const slotEnd = addMinutes(currentSlot, duration);
      const slotStart = Math.floor(currentSlot.getTime() / 1000);
      const slotEndTime = Math.floor(slotEnd.getTime() / 1000);

      console.log("\n=== Checking Slot ===");
      console.log(
        `Slot UTC: ${currentSlot.toISOString()} - ${slotEnd.toISOString()}`
      );
      console.log(
        `Slot Local: ${formatInTimeZone(currentSlot, timezone, "yyyy-MM-dd HH:mm:ssXXX")} - ${formatInTimeZone(slotEnd, timezone, "yyyy-MM-dd HH:mm:ssXXX")}`
      );
      console.log(`Slot timestamps: ${slotStart} - ${slotEndTime}`);

      const isAvailable = !busySlots.some((busy) => {
        console.log(
          `Comparing against busy period: ${busy.start} - ${busy.end}`
        );
        console.log(
          `UTC: ${new Date(busy.start * 1000).toISOString()} - ${new Date(busy.end * 1000).toISOString()}`
        );
        console.log(
          `Local: ${formatInTimeZone(new Date(busy.start * 1000), timezone, "yyyy-MM-dd HH:mm:ssXXX")} - ${formatInTimeZone(new Date(busy.end * 1000), timezone, "yyyy-MM-dd HH:mm:ssXXX")}`
        );

        const hasOverlap = slotStart < busy.end && slotEndTime > busy.start;
        console.log(
          `Overlap check: ${slotStart} < ${busy.end} && ${slotEndTime} > ${busy.start} = ${hasOverlap}`
        );

        if (hasOverlap) {
          console.log("OVERLAP DETECTED!");
        }
        return hasOverlap;
      });

      if (isAvailable) {
        console.log("Slot is AVAILABLE");
        allSlots.push(new Date(currentSlot));
      } else {
        console.log("Slot is BLOCKED");
      }
    }
    currentSlot = addMinutes(new Date(currentSlot), duration);
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
