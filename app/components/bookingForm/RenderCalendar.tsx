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
  const dateParam = searchParams.get("date");

  const [date, setDate] = useState<CalendarDate>(() => {
    // If we have a date in URL, use it, otherwise use today
    return dateParam ? parseDate(dateParam) : today(getLocalTimeZone());
  });

  // Update URL when component mounts if no date is set
  useEffect(() => {
    if (!dateParam) {
      const todayStr = today(getLocalTimeZone()).toString();
      const url = new URL(window.location.href);
      url.searchParams.set("date", todayStr);
      router.replace(url.toString());
    }
  }, [dateParam, router]);

  const handleChangeDate = (date: DateValue) => {
    setDate(date as CalendarDate);
    const url = new URL(window.location.href);
    url.searchParams.set("date", date.toString());
    router.push(url.toString());
  };

  const isDateUnavailable = (date: DateValue) => {
    const dayOfWeek = date.toDate(getLocalTimeZone()).getDay();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[dayOfWeek];
    const dayAvailability = availability.find((a) => a.day === dayName);
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
