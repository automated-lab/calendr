import { Resend } from "resend";
import EventCreatedEmail from "../components/emails/EventCreated";
import VerifyEmail from "../components/emails/VerifyEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEventCreatedEmail({
  userEmail,
  username,
  eventTitle,
  eventUrl,
}: {
  userEmail: string;
  username: string;
  eventTitle: string;
  eventUrl: string;
}) {
  try {
    await resend.emails.send({
      from: "MyCalendar <notifications@mycalendar.com>",
      to: userEmail,
      subject: `Event Created: ${eventTitle}`,
      react: EventCreatedEmail({ username, eventTitle, eventUrl }),
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

export async function sendVerificationEmail({
  email,
  username,
  token,
}: {
  email: string;
  username: string;
  token: string;
}) {
  const verifyLink = `${process.env.NEXT_PUBLIC_URL}/verify?token=${token}`;

  try {
    await resend.emails.send({
      from: "MyCalendar <notifications@mycalendar.com>",
      to: email,
      subject: "Verify your email for MyCalendar",
      react: VerifyEmail({ username, verifyLink }),
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}
