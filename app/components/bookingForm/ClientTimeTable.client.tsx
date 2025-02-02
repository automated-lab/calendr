"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { format, parse } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

interface ClientTimeTableProps {
  selectedDate: Date;
  availableSlotsHostTz: string[];
  formattedDate: string;
}

export default function ClientTimeTable({
  selectedDate,
  availableSlotsHostTz,
  formattedDate,
}: ClientTimeTableProps) {
  const [clientTimezone, setClientTimezone] = useState<string>("");

  // Get timezone only once on mount
  useEffect(() => {
    setClientTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Memoize slot conversion to prevent unnecessary recalculations
  const availableSlots = useMemo(() => {
    if (!clientTimezone) return availableSlotsHostTz;

    return availableSlotsHostTz.map((time) => {
      const dateInHostTz = parse(
        `${formattedDate} ${time}`,
        "yyyy-MM-dd HH:mm",
        new Date()
      );
      return formatInTimeZone(dateInHostTz, clientTimezone, "HH:mm");
    });
  }, [availableSlotsHostTz, formattedDate, clientTimezone]);

  if (!clientTimezone) return null;

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-base font-semibold">
        {format(selectedDate, "EEE")}{" "}
        <span className="text-sm text-muted-foreground">
          {format(selectedDate, "MMM d")}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          (Times shown in {clientTimezone})
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
