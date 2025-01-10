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
import { format } from "date-fns";

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

  const startDateTime = new Date(`${eventDate}T${formTime}:00`);
  const endDateTime = new Date(startDateTime.getTime() + meetingLength * 60000);

  console.log("Debug - Meeting Creation:", {
    formTime,
    eventDate,
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    timezone: getUserData.timezone || "UTC",
  });

  const requestBody = {
    title: eventTypeData?.title,
    description: eventTypeData?.description,
    when: {
      start_date: format(startDateTime, "yyyy-MM-dd"),
      end_date: format(endDateTime, "yyyy-MM-dd"),
    },
    conferencing: {
      autocreate: {},
      provider: "Google Meet",
    },
    participants: [
      {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        status: "yes",
      },
    ],
    notify_participants: true,
  };

  console.log("Debug - Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(
      `${process.env.NYLAS_API_URI}/v3/grants/${getUserData.grantId}/events?calendar_id=${getUserData.grantEmail}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NYLAS_CLIENT_SECRET}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error(
        "Nylas API Error Full Response:",
        JSON.stringify(error, null, 2)
      );
      throw new Error(JSON.stringify(error));
    }
  } catch (error) {
    console.error("Failed to create meeting:", error);
    throw error;
  }

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
