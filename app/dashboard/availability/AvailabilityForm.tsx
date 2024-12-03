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
  fromTime: Date;
  toTime: Date;
  isActive: boolean;
}

export default function AvailabilityForm({ initialData }: { initialData: Availability[] }) {
  const [availabilities, setAvailabilities] = useState(initialData);

  const handleSwitchChange = async (id: string, checked: boolean) => {
    const availability = availabilities.find(a => a.id === id);
    if (!availability) return;

    const updates = {
      id,
      isActive: checked,
      fromTime: availability.fromTime.toISOString(),
      toTime: availability.toTime.toISOString()
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

    const [hours, minutes] = value.split(':');
    const date = new Date(availability[type]);
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));

    const updates = {
      id,
      isActive: availability.isActive,
      fromTime: type === 'fromTime' ? date.toISOString() : availability.fromTime.toISOString(),
      toTime: type === 'toTime' ? date.toISOString() : availability.toTime.toISOString()
    };

    const formData = new FormData();
    formData.append('updates', JSON.stringify(updates));
    
    await updateAvailabilityAction(formData);

    setAvailabilities(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [type]: date } : item
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
        {availabilities.map((item) => (
          <div key={item.id} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-center gap-4">
            <div className="flex items-center gap-x-3">
              <Switch 
                checked={item.isActive}
                onCheckedChange={(checked) => handleSwitchChange(item.id, checked)}
              />
              <p>{item.day}</p>
            </div>
            <Select 
              value={item.fromTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
              value={item.toTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
        ))}
      </CardContent>
      <CardFooter className="flex justify-end">
        <p className="text-sm text-muted-foreground">Changes are saved automatically</p>
      </CardFooter>
    </Card>
  );
}