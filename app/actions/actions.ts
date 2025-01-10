"use server";

import prisma from "../lib/db";
import { requireUser } from "../lib/hooks";
import { parseWithZod } from "@conform-to/zod";
import { signIn, signOut } from "../lib/auth";
import {
  eventTypeSchema,
  onBoardingSchemaValidation,
  settingsSchema,
} from "../lib/zodSchemas";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "../lib/auth";
import { nylas } from "../lib/nylas";
import { SubmissionResult } from "@conform-to/react";
import { sendEventCreatedEmail } from "../lib/resend";
import { Day } from "@prisma/client";

const providerMap = {
  "Google Meet": "Google Meet",
  "Zoom Meeting": "Zoom Meeting",
  "Microsoft Teams": "Microsoft Teams",
} as const;

export async function handleGoogleSignIn() {
  await signIn("google");
}

export async function handleGithubSignIn() {
  await signIn("github");
}

export async function handleSignOut() {
  await signOut();
}

export async function OnboardingAction(
  previousState: unknown,
  formData: FormData
) {
  const session = await requireUser();
  const submission = await parseWithZod(formData, {
    schema: onBoardingSchemaValidation({
      async isUsernameUnique() {
        const existingUsername = await prisma.user.findUnique({
          where: { username: formData.get("username") as string },
        });
        return !existingUsername;
      },
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  // Check for existing availability records
  const existingAvailability = await prisma.availability.findMany({
    where: {
      userId: session.user?.id,
    },
  });

  // Only create availability if none exists
  const availabilityData =
    existingAvailability.length === 0
      ? {
          createMany: {
            data: [
              {
                day: Day.Monday,
                fromTime: "08:00",
                toTime: "18:00",
                isActive: true,
              },
              {
                day: Day.Tuesday,
                fromTime: "08:00",
                toTime: "18:00",
                isActive: true,
              },
              {
                day: Day.Wednesday,
                fromTime: "08:00",
                toTime: "18:00",
                isActive: true,
              },
              {
                day: Day.Thursday,
                fromTime: "08:00",
                toTime: "18:00",
                isActive: true,
              },
              {
                day: Day.Friday,
                fromTime: "08:00",
                toTime: "18:00",
                isActive: true,
              },
              {
                day: Day.Saturday,
                fromTime: "08:00",
                toTime: "18:00",
                isActive: true,
              },
              {
                day: Day.Sunday,
                fromTime: "08:00",
                toTime: "18:00",
                isActive: true,
              },
            ],
          },
        }
      : undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      name: submission.value.fullName,
      username: submission.value.username,
      availability: availabilityData,
    },
  });

  return redirect("/onboarding/grant-id");
}

export async function SettingsAction(
  previousState: unknown,
  formData: FormData
) {
  const session = await requireUser();

  const submission = await parseWithZod(formData, {
    schema: settingsSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      name: submission.value.fullName,
      image: submission.value.profileImage,
      timezone: submission.value.timezone,
    },
  });

  revalidatePath("/dashboard/settings");

  return submission.reply();
}

export async function updateAvailabilityAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const updates = JSON.parse(formData.get("updates") as string);

  try {
    const availability = await prisma.availability.findUnique({
      where: {
        id: updates.id,
        userId: session.user.id,
      },
    });

    if (!availability) {
      throw new Error("Availability record not found");
    }

    await prisma.availability.update({
      where: {
        id: updates.id,
      },
      data: {
        isActive: updates.isActive,
        fromTime: updates.fromTime,
        toTime: updates.toTime,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/availability");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Update error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    throw new Error("Failed to update availability");
  }
}

export async function createEventTypeAction(
  previousState: unknown,
  formData: FormData
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const session = await requireUser();

  const submission = parseWithZod(formData, {
    schema: eventTypeSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const event = await prisma.eventType.create({
    data: {
      title: submission.value.title,
      duration: submission.value.duration,
      url: submission.value.url,
      description: submission.value.description,
      videoCallSoftware: submission.value.videoCallSoftware,
      userId: session.user?.id,
    },
  });

  // Send email notification
  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
    select: { username: true },
  });

  await sendEventCreatedEmail({
    userEmail: session.user?.email as string,
    username: session.user?.name as string,
    eventTitle: event.title,
    eventUrl: `${process.env.NEXT_PUBLIC_URL}/${user?.username}/${event.url}`,
  });

  return redirect("/dashboard");
}

export async function createMeetingAction(formData: FormData) {
  const getUserData = await prisma.user.findUnique({
    where: {
      username: formData.get("username") as string,
    },
    select: {
      grantEmail: true,
      grantId: true,
      timezone: true,
    },
  });

  if (!getUserData) {
    throw new Error("User not found");
  }

  const eventTypeData = await prisma.eventType.findUnique({
    where: {
      id: formData.get("eventTypeId") as string,
    },
    select: {
      title: true,
      description: true,
    },
  });

  const formTime = formData.get("fromTime") as string;
  const meetingLength = Number(formData.get("meetingLength"));
  const eventDate = formData.get("eventDate") as string;
  const provider = formData.get("provider") as string;

  // Create a local datetime string and parse it in the user's timezone
  const localDateTime = `${eventDate}T${formTime}:00`;
  const userTimezone = getUserData.timezone || "UTC";

  // Convert to UTC for storage
  const startDateTime = new Date(`${localDateTime}Z`);
  const endDateTime = new Date(startDateTime.getTime() + meetingLength * 60000);

  await nylas.events.create({
    identifier: getUserData?.grantId as string,
    requestBody: {
      title: eventTypeData?.title,
      description: eventTypeData?.description,
      when: {
        startTime: Math.floor(startDateTime.getTime() / 1000),
        endTime: Math.floor(endDateTime.getTime() / 1000),
        timezone: userTimezone,
      },
      conferencing: {
        autocreate: {},
        provider: providerMap[provider as keyof typeof providerMap],
      },
      participants: [
        {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          status: "yes",
        },
      ],
    },
    queryParams: {
      calendarId: getUserData?.grantEmail as string,
      notifyParticipants: true,
    },
  });

  return redirect(`/success`);
}

export async function cancelMeetingAction(formData: FormData) {
  const session = await requireUser();

  const userData = await prisma.user.findUnique({
    where: {
      id: session.user?.id as string,
    },
    select: {
      grantEmail: true,
      grantId: true,
    },
  });

  if (!userData) {
    throw new Error("User not found");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await nylas.events.destroy({
    eventId: formData.get("eventId") as string,
    identifier: userData?.grantId as string,
    queryParams: {
      calendarId: userData.grantEmail as string,
    },
  });

  revalidatePath("/dashboard/meetings");
}

export async function editEventTypeAction(
  prevState: SubmissionResult<string[]> | null,
  formData: FormData
): Promise<SubmissionResult<string[]>> {
  const session = await requireUser();

  const submission = parseWithZod(formData, {
    schema: eventTypeSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await prisma.eventType.update({
    where: {
      id: formData.get("id") as string,
      userId: session.user?.id as string,
    },
    data: {
      title: submission.value.title,
      duration: Number(submission.value.duration),
      url: submission.value.url,
      description: submission.value.description,
      videoCallSoftware: submission.value.videoCallSoftware,
    },
  });

  return redirect("/dashboard");
}

export async function updateEventTypeStatusAction(
  prevState: unknown,
  {
    eventTypeId,
    isChecked,
  }: {
    eventTypeId: string;
    isChecked: boolean;
  }
) {
  try {
    const session = await requireUser();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = await prisma.eventType.update({
      where: {
        id: eventTypeId,
        userId: session.user?.id as string,
      },
      data: {
        active: isChecked,
      },
    });

    revalidatePath(`/dashboard`);
    return {
      status: "success",
      message: isChecked ? "Event activated" : "Event deactivated",
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
}

export async function deleteEventTypeAction(formData: FormData) {
  const session = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await prisma.eventType.delete({
    where: {
      id: formData.get("id") as string,
      userId: session.user?.id as string,
    },
  });

  revalidatePath("/dashboard");

  return redirect("/dashboard");
}

interface AvailabilityUpdate {
  id: string;
  isActive: boolean;
  fromTime: string;
  toTime: string;
}

export async function updateBulkAvailabilityAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id; // Safe to access after check
  const updates = JSON.parse(
    formData.get("updates") as string
  ) as AvailabilityUpdate[];

  try {
    await prisma.$transaction(
      updates.map((update) =>
        prisma.availability.update({
          where: {
            id: update.id,
            userId,
          },
          data: {
            isActive: update.isActive,
            fromTime: update.fromTime,
            toTime: update.toTime,
          },
        })
      )
    );

    revalidatePath("/dashboard/availability");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Update error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    throw new Error("Failed to update availability");
  }
}
