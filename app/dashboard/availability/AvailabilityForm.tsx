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
import { updateBulkAvailabilityAction } from "@/app/actions/actions";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

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
  const [hasChanges, setHasChanges] = useState(false);

  const formatTime = (timeString: string) => {
    return timeString; // Time strings are already in HH:mm format
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    setAvailabilities((prev) =>
      [...prev]
        .map((item) => (item.id === id ? { ...item, isActive: checked } : item))
        .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
    );
    setHasChanges(true);
  };

  const handleTimeChange = (
    id: string,
    type: "fromTime" | "toTime",
    value: string
  ) => {
    setAvailabilities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [type]: value } : item))
    );
    setHasChanges(true);
  };

  const handleCopyTimes = (fromTime: string, toTime: string) => {
    setAvailabilities((prev) =>
      prev.map((item) => ({
        ...item,
        fromTime,
        toTime,
      }))
    );
    setHasChanges(true);
    toast.success("Times copied to all days");
  };

  const handleSaveChanges = async () => {
    try {
      // Disable further saves while processing
      setHasChanges(false);

      const formData = new FormData();
      formData.append("updates", JSON.stringify(availabilities));

      await updateBulkAvailabilityAction(formData);
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
      // Re-enable save button on error
      setHasChanges(true);
    }
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
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_2fr_2fr_auto] items-center gap-4"
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyTimes(fromTime, toTime)}
                title="Copy these times to all days"
                className="w-10 h-10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          {hasChanges ? "You have unsaved changes" : "All changes saved"}
        </p>
        <Button onClick={handleSaveChanges} disabled={!hasChanges}>
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
