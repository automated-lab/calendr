"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "./Calendar";
import { useState, useEffect } from "react";
import {
  CalendarDate,
  DateValue,
  getLocalTimeZone,
  today,
  parseDate,
} from "@internationalized/date";

interface iAppProps {
  availability: {
    day: string;
    isActive: boolean;
  }[];
}

export function RenderCalendar({ availability }: iAppProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [date, setDate] = useState<CalendarDate>(() => {
    const dateParam = searchParams.get("date");
    return dateParam ? parseDate(dateParam) : today(getLocalTimeZone());
  });

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setDate(parseDate(dateParam));
    }
  }, [searchParams]);

  const handleChangeDate = (date: DateValue) => {
    console.log(date);
    setDate(date as CalendarDate);
    const url = new URL(window.location.href);
    url.searchParams.set("date", date.toString());
    router.push(url.toString());
  };

  const isDateUnavailable = (date: DateValue) => {
    const dayOfWeek = date.toDate(getLocalTimeZone()).getDay();
    // Convert 0-6 (Sun-Sat) to Monday-Sunday format
    const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Log the availability check
    console.log("Current availability:", availability);
    console.log("Checking day index:", adjustedIndex);

    // Make sure we have availability data and it's properly ordered
    if (!availability || availability.length !== 7) {
      console.error("Invalid availability data:", availability);
      return true; // Mark as unavailable if data is invalid
    }

    const dayAvailability = availability[adjustedIndex];
    console.log(
      `Checking availability for day ${adjustedIndex} (${dayAvailability?.day}): ${dayAvailability?.isActive}`
    );
    return !dayAvailability?.isActive;
  };

  return (
    <Calendar
      minValue={today(getLocalTimeZone())}
      defaultValue={date}
      value={date}
      onChange={handleChangeDate}
      isDateUnavailable={isDateUnavailable}
    />
  );
}
