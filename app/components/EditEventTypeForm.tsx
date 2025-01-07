"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "./SubmitButton";
import { useActionState } from "react";
import { parseWithZod } from "@conform-to/zod";
import { eventTypeSchema } from "../lib/zodSchemas";
import { useForm } from "@conform-to/react";
import { useState } from "react";
import { editEventTypeAction } from "../actions/actions";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

type videoCallProvider = "Google Meet" | "Zoom Meeting" | "Microsoft Teams";

interface iAppProps {
  id: string;
  title: string;
  duration: number;
  url: string;
  description: string;
  videoCallSoftware: string;
  callProvider: string;
}

export function EditEventTypeForm({
  id,
  title,
  duration,
  url,
  description,
  callProvider,
}: iAppProps) {
  const [activePlatform, setActivePlatform] = useState<videoCallProvider>(
    callProvider as videoCallProvider
  );

  const [lastResult, action] = useActionState(editEventTypeAction, null);
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: eventTypeSchema,
      });
    },

    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const router = useRouter();

  return (
    <div className="h-full w-full flex-1 flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
          <CardDescription>Edit your event.</CardDescription>
          <form
            id={form.id}
            onSubmit={form.onSubmit}
            action={action}
            noValidate
          >
            <input type="hidden" name="id" value={id} />
            <CardContent className="grid gap-y-5">
              <div className="flex flex-col gap-y-2">
                <Label>Title</Label>
                <Input
                  name={fields.title.name}
                  key={fields.title.key}
                  defaultValue={title}
                  placeholder="30-minute meeting"
                />
                <p className="text-xs text-red-500">{fields.title.errors}</p>
              </div>
              <div className="grid gap-y-2">
                <Label>URL Slug</Label>
                <div className="flex rounded-md">
                  <span className="inline-flex items-center px-3 rounded-l-md border-r-0 border-muted bg-muted text-sm text-muted-foreground">
                    okbook.me/
                  </span>
                  <Input
                    className="rounded-l-none"
                    placeholder="Example-url-1"
                    name={fields.url.name}
                    key={fields.url.key}
                    defaultValue={url}
                  />
                </div>
                <p className="text-xs text-red-500">{fields.url.errors}</p>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Book me!"
                  name={fields.description.name}
                  key={fields.description.key}
                  defaultValue={description}
                />
                <p className="text-xs text-red-500">
                  {fields.description.errors}
                </p>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>Duration</Label>
                <Select
                  name={fields.duration.name}
                  key={fields.duration.key}
                  defaultValue={duration.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-red-500">{fields.duration.errors}</p>
              </div>

              <div className="grid gap-y-2">
                <Label>Meeting Provider</Label>
                <input
                  type="hidden"
                  name={fields.videoCallSoftware.name}
                  value={activePlatform}
                />
                <ButtonGroup>
                  <Button
                    key="google"
                    type="button"
                    onClick={() => setActivePlatform("Google Meet")}
                    className="w-full"
                    variant={
                      activePlatform === "Google Meet" ? "secondary" : "outline"
                    }
                  >
                    Google Meet
                  </Button>
                  <Button
                    key="zoom"
                    type="button"
                    onClick={() => setActivePlatform("Zoom Meeting")}
                    className="w-full"
                    variant={
                      activePlatform === "Zoom Meeting"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    Zoom
                  </Button>
                  <Button
                    key="teams"
                    type="button"
                    onClick={() => setActivePlatform("Microsoft Teams")}
                    className="w-full"
                    variant={
                      activePlatform === "Microsoft Teams"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    Microsoft Teams
                  </Button>
                </ButtonGroup>
              </div>
            </CardContent>
            <CardFooter className="flex w-full justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
              <SubmitButton text="Update Event" />
            </CardFooter>
          </form>
        </CardHeader>
      </Card>
    </div>
  );
}
