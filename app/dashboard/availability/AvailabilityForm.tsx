"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { times } from "@/app/lib/times";
import { updateAvailabilityAction } from "@/app/actions/actions";
import { formatInTimeZone } from 'date-fns-tz';
import { getTimezoneOffset } from 'date-fns-tz';

interface Availability {
  id: string;
  day: string;
  fromTime: string;
  toTime: string;
  isActive: boolean;
}

interface Props {
  initialData: Availability[];
  userTimezone: string;
}

const dayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AvailabilityForm({
  initialData,
  userTimezone,
}: Props) {
  const sortedInitialData = [...initialData].sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  const [availabilities, setAvailabilities] = useState(sortedInitialData);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return formatInTimeZone(date, userTimezone, 'HH:mm');
  };

  const handleSwitchChange = async (id: string, checked: boolean) => {
    const updates = {
      id,
      isActive: checked,
      fromTime: availabilities.find((a) => a.id === id)?.fromTime,
      toTime: availabilities.find((a) => a.id === id)?.toTime,
    };

    const formData = new FormData();
    formData.append("updates", JSON.stringify(updates));

    await updateAvailabilityAction(formData);

    setAvailabilities((prev) =>
      [...prev]
        .map((item) => (item.id === id ? { ...item, isActive: checked } : item))
        .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
    );
  };

  const handleTimeChange = async (
    id: string,
    type: "fromTime" | "toTime",
    value: string
  ) => {
    const availability = availabilities.find((a) => a.id === id);
    if (!availability) return;

    const [hours, minutes] = value.split(":").map(Number);
    
    // Create a date object for today
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Get the timezone offset in minutes for the user's timezone
    const tzOffset = getTimezoneOffset(userTimezone, date) / 1000 / 60;
    
    // Create UTC time by adjusting for the timezone offset
    // We subtract the offset because we're converting from local to UTC
    // For example: Sydney is +11, so 9:00 AM Sydney = 22:00 UTC (previous day)
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours - (tzOffset / 60),
      minutes,
      0,
      0
    ));
    const utcTime = utcDate.toISOString();

    const updates = {
      id,
      isActive: availability.isActive,
      fromTime: type === "fromTime" ? utcTime : availability.fromTime,
      toTime: type === "toTime" ? utcTime : availability.toTime,
    };

    const formData = new FormData();
    formData.append("updates", JSON.stringify(updates));

    await updateAvailabilityAction(formData);

    setAvailabilities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [type]: utcTime } : item
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
        <CardDescription>Set your weekly availability ({userTimezone})</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        {availabilities.map((item) => {
          const fromTime = formatTime(item.fromTime);
          const toTime = formatTime(item.toTime);

          return (
            <div
              key={item.id}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-center gap-4"
            >
              <div className="flex items-center gap-x-3">
                <Switch
                  checked={item.isActive}
                  onCheckedChange={(checked) =>
                    handleSwitchChange(item.id, checked)
                  }
                />
                <p>{item.day}</p>
              </div>
              <Select
                value={fromTime}
                onValueChange={(value) =>
                  handleTimeChange(item.id, "fromTime", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="From Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {times.map((time) => (
                      <SelectItem key={time.id} value={time.time}>
                        {time.time}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={toTime}
                onValueChange={(value) =>
                  handleTimeChange(item.id, "toTime", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="To Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {times.map((time) => (
                      <SelectItem key={time.id} value={time.time}>
                        {time.time}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="flex justify-end">
        <p className="text-sm text-muted-foreground">
          Changes are saved automatically
        </p>
      </CardFooter>
    </Card>
  );
}
