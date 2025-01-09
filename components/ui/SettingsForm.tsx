"use client";

import { SubmitButton } from "@/app/components/SubmitButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { SettingsAction } from "@/app/actions/actions";
import { useActionState } from "react";
import { useForm } from "@conform-to/react";
import { settingsSchema } from "@/app/lib/zodSchemas";
import { parseWithZod } from "@conform-to/zod";
import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "./button";
import { UploadDropzone } from "@/app/lib/uploadthing";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface iAppProps {
  fullName: string;
  profileImage: string;
  email: string;
  timezone: string;
}

export default function SettingsForm({
  fullName,
  profileImage,
  email,
  timezone,
}: iAppProps) {
  const [lastResult, action] = useActionState(SettingsAction, null);
  const [currentProfileImage, setCurrentProfileImage] = useState(profileImage);
  const [form, fields] = useForm({
    lastResult,

    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: settingsSchema,
      });
    },

    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const handleDeleteImage = () => {
    setCurrentProfileImage("");
  };

  // Get list of IANA timezone names
  const timezones = Intl.supportedValuesOf('timeZone');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings</CardDescription>
      </CardHeader>
      <form id={form.id} onSubmit={form.onSubmit} action={action} noValidate>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              defaultValue={fullName}
              id="fullName"
              name={fields.fullName.name}
              key={fields.fullName.key}
            />
            <p className="text-red-500 text-sm">{fields.fullName.errors}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input disabled defaultValue={email} id="email" name="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              name={fields.timezone.name}
              key={fields.timezone.key}
              defaultValue={timezone}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-red-500 text-sm">{fields.timezone.errors}</p>
          </div>
          <div className="grid gap-5">
            <Label htmlFor="profileImage">Profile Image</Label>
            <input
              type="hidden"
              name={fields.profileImage.name}
              key={fields.profileImage.key}
              value={currentProfileImage}
            />
            {currentProfileImage ? (
              <div className="relative size-16">
                <Image
                  src={currentProfileImage}
                  alt="Profile Image"
                  width={50}
                  height={50}
                  className="rounded-lg"
                />
                <Button
                  onClick={handleDeleteImage}
                  variant="outline"
                  size="icon"
                  type="button"
                  className="absolute -top-3 -right-3"
                >
                  <X className="size-1" />
                </Button>
              </div>
            ) : (
              <UploadDropzone
                onClientUploadComplete={(res) => {
                  setCurrentProfileImage(res[0].url);
                  toast.success("Profile image updated successfully");
                }}
                onUploadError={(error) => {
                  console.log("Something went wrong", error);
                  toast.error(error.message);
                }}
                endpoint="imageUploader"
              />
            )}
            <p className="text-red-500 text-sm">{fields.profileImage.errors}</p>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton text="Save Changes" />
        </CardFooter>
      </form>
    </Card>
  );
}
