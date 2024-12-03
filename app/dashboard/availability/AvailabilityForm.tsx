'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function AvailabilityForm({ initialData }: { initialData: Availability[] }) {
  const [availabilities, setAvailabilities] = useState(initialData);

  const formatUTC = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const handleSwitchChange = async (id: string, checked: boolean) => {
    const updates = {
      id,
      isActive: checked,
      fromTime: availabilities.find(a => a.id === id)?.fromTime,
      toTime: availabilities.find(a => a.id === id)?.toTime
    };

    const formData = new FormData();
    formData.append('updates', JSON.stringify(updates));
    
    await updateAvailabilityAction(formData);
    
    setAvailabilities(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isActive: checked } : item
      )
    );
  };

  const handleTimeChange = async (id: string, type: 'fromTime' | 'toTime', value: string) => {
    const availability = availabilities.find(a => a.id === id);
    if (!availability) return;

    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);

    const updatedTime = date.toISOString();

    const updates = {
      id,
      isActive: availability.isActive,
      fromTime: type === 'fromTime' ? updatedTime : availability.fromTime,
      toTime: type === 'toTime' ? updatedTime : availability.toTime
    };

    const formData = new FormData();
    formData.append('updates', JSON.stringify(updates));
    
    await updateAvailabilityAction(formData);

    setAvailabilities(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [type]: updatedTime } : item
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
        <CardDescription>Set your weekly availability</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        {availabilities.map((item) => {
          const fromTime = formatUTC(item.fromTime);
          const toTime = formatUTC(item.toTime);

          return (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-center gap-4">
              <div className="flex items-center gap-x-3">
                <Switch 
                  checked={item.isActive}
                  onCheckedChange={(checked) => handleSwitchChange(item.id, checked)}
                />
                <p>{item.day}</p>
              </div>
              <Select 
                value={fromTime}
                onValueChange={(value) => handleTimeChange(item.id, 'fromTime', value)}
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
                onValueChange={(value) => handleTimeChange(item.id, 'toTime', value)}
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
          )
        })}
      </CardContent>
      <CardFooter className="flex justify-end">
        <p className="text-sm text-muted-foreground">Changes are saved automatically</p>
      </CardFooter>
    </Card>
  );
}