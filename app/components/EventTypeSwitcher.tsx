"use client";

import { updateEventTypeStatusAction } from "@/app/actions/actions";
import { Switch } from "@/components/ui/switch";
import React, { useEffect, useTransition } from "react";
import { useActionState } from "react";
import { toast } from "sonner";

export function EventTypeSwitcher({
  initialChecked,
  eventTypeId,
}: {
  eventTypeId: string;
  initialChecked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [state, action] = useActionState(
    updateEventTypeStatusAction,
    undefined
  );

  useEffect(() => {
    if (state?.status === "success") {
      toast.success(state.message);
    } else if (state?.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Switch
      defaultChecked={initialChecked}
      disabled={isPending}
      onCheckedChange={(isChecked) => {
        startTransition(() => {
          action({
            isChecked: isChecked,
            eventTypeId,
          });
        });
      }}
    />
  );
}
