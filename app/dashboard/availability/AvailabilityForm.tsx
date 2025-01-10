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

export default function AvailabilityForm({ initialData, userTimezone }: Props) {
  const sortedInitialData = [...initialData].sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  const [availabilities, setAvailabilities] = useState(sortedInitialData);

  const formatTime = (timeString: string) => {
    return timeString; // Time strings are already in HH:mm format
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

    const updates = {
      id,
      isActive: availability.isActive,
      fromTime: type === "fromTime" ? value : availability.fromTime,
      toTime: type === "toTime" ? value : availability.toTime,
    };

    const formData = new FormData();
    formData.append("updates", JSON.stringify(updates));

    await updateAvailabilityAction(formData);

    setAvailabilities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [type]: value } : item))
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
        <CardDescription>
          Set your weekly availability ({userTimezone})
        </CardDescription>
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
